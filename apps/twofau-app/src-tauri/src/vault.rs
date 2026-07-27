//! The desktop vault: decrypts and computes codes entirely in the Rust process.
//! Secrets never cross to the webview — only account metadata and code strings
//! do. The OS keyring caches the passphrase so it's entered once per device.

use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use twofau_core::{
    base32_decode, derive_key, hotp, merge, open_with_passphrase, parse_otpauth, salt_of, seal,
    seal_with_passphrase, totp, Account, FileVaultStore, OtpAlgorithm, OtpType, StoredAccount,
    Tombstone, VaultDocument, VaultStore, NONCE_LEN, SALT_LEN,
};
use uuid::Uuid;

const KEYRING_SERVICE: &str = "dev.artkost.2fau";
const KEYRING_USER: &str = "vault-passphrase";

/// Fallback vault location if Tauri's app-data dir can't be resolved. Uses the
/// bundle identifier (not the legacy Swift app's `2fau` dir) to avoid collision.
pub fn fallback_vault_path() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("dev.artkost.2fau")
        .join("vault.dat")
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn random<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    getrandom::getrandom(&mut bytes).expect("OS RNG unavailable");
    bytes
}

fn str_err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

struct Unlocked {
    passphrase: String,
    doc: VaultDocument,
}

/// Result of writing an externally-supplied sealed blob under the revision guard.
pub enum ReplaceOutcome {
    Committed { revision: u64 },
    Conflict { revision: u64, blob: Vec<u8> },
}

/// Result of a desktop-mediated merge: the new desktop revision and the merged
/// document re-sealed under the *sender's* salt so they can open it themselves.
#[derive(Debug)]
pub struct MergeResult {
    pub revision: u64,
    pub blob: Vec<u8>,
}

pub struct AppVault {
    store: FileVaultStore,
    rev_path: PathBuf,
    revision: Mutex<u64>,
    inner: Mutex<Option<Unlocked>>,
}

impl AppVault {
    pub fn new(path: PathBuf) -> AppVault {
        let rev_path = path.with_extension("rev");
        let revision = std::fs::read_to_string(&rev_path)
            .ok()
            .and_then(|s| s.trim().parse::<u64>().ok())
            .unwrap_or(0);
        AppVault {
            store: FileVaultStore::new(path),
            rev_path,
            revision: Mutex::new(revision),
            inner: Mutex::new(None),
        }
    }

    pub fn revision(&self) -> u64 {
        *self.revision.lock().expect("revision mutex")
    }

    /// The raw sealed blob on disk (ciphertext), or None on first run.
    pub fn sealed_blob(&self) -> Result<Option<Vec<u8>>, String> {
        self.store.load().map_err(str_err)
    }

    pub fn is_locked(&self) -> bool {
        self.inner.lock().expect("vault mutex").is_none()
    }

    /// Whether an encrypted vault file already exists (first-run detection).
    pub fn has_vault(&self) -> bool {
        matches!(self.store.load(), Ok(Some(_)))
    }

    pub fn unlock(&self, passphrase: String, remember: bool) -> Result<(), String> {
        let doc = match self.store.load().map_err(str_err)? {
            Some(blob) => open_with_passphrase(&blob, &passphrase).map_err(str_err)?,
            None => {
                // First run: create and persist an empty vault under this passphrase.
                let doc = VaultDocument::default();
                self.seal_and_save(&doc, &passphrase)?;
                doc
            }
        };
        *self.inner.lock().expect("vault mutex") = Some(Unlocked {
            passphrase: passphrase.clone(),
            doc,
        });
        if remember {
            let _ = keyring_set(&passphrase);
        }
        Ok(())
    }

    /// Try to unlock silently using a passphrase cached in the OS keyring.
    pub fn try_auto_unlock(&self) -> bool {
        match keyring_get() {
            Some(pass) => self.unlock(pass, false).is_ok(),
            None => false,
        }
    }

    pub fn list(&self) -> Result<Vec<Account>, String> {
        let guard = self.inner.lock().expect("vault mutex");
        let u = guard.as_ref().ok_or("vault is locked")?;
        Ok(u.doc.entries.iter().map(|e| e.account.clone()).collect())
    }

    pub fn code(&self, id: &str, unix_ms: u64) -> Result<String, String> {
        let uuid = Uuid::parse_str(id).map_err(str_err)?;
        let guard = self.inner.lock().expect("vault mutex");
        let u = guard.as_ref().ok_or("vault is locked")?;
        let entry = u
            .doc
            .entries
            .iter()
            .find(|e| e.account.id == uuid)
            .ok_or("no such account")?;
        let a = &entry.account;
        Ok(match a.otp_type {
            OtpType::Totp => totp(
                &entry.secret,
                unix_ms / 1000,
                a.period,
                a.digits,
                a.algorithm,
            ),
            OtpType::Hotp => hotp(&entry.secret, a.counter, a.digits, a.algorithm),
        })
    }

    pub fn add_uri(&self, uri: &str) -> Result<Account, String> {
        let parsed = parse_otpauth(uri).map_err(str_err)?;
        let account = Account {
            id: Uuid::new_v4(),
            issuer: parsed.issuer,
            label: parsed.label,
            otp_type: parsed.otp_type,
            algorithm: parsed.algorithm,
            digits: parsed.digits,
            period: parsed.period,
            counter: parsed.counter,
        };
        let stored = StoredAccount {
            account: account.clone(),
            secret: parsed.secret,
            modified_at: now_ms(),
        };
        self.mutate(|doc| doc.entries.push(stored))?;
        Ok(account)
    }

    pub fn add_manual(
        &self,
        issuer: String,
        label: String,
        secret_base32: String,
        kind: String,
    ) -> Result<Account, String> {
        let secret = base32_decode(&secret_base32).map_err(str_err)?;
        let otp_type = if kind == "hotp" {
            OtpType::Hotp
        } else {
            OtpType::Totp
        };
        let account = Account {
            id: Uuid::new_v4(),
            issuer,
            label,
            otp_type,
            algorithm: OtpAlgorithm::Sha1,
            digits: 6,
            period: 30,
            counter: 0,
        };
        let stored = StoredAccount {
            account: account.clone(),
            secret,
            modified_at: now_ms(),
        };
        self.mutate(|doc| doc.entries.push(stored))?;
        Ok(account)
    }

    pub fn update(&self, account: Account) -> Result<(), String> {
        let ts = now_ms();
        self.mutate(|doc| {
            if let Some(e) = doc.entries.iter_mut().find(|e| e.account.id == account.id) {
                e.account = account;
                e.modified_at = ts;
            }
        })
    }

    pub fn remove(&self, id: &str) -> Result<(), String> {
        let uuid = Uuid::parse_str(id).map_err(str_err)?;
        let ts = now_ms();
        self.mutate(|doc| {
            doc.entries.retain(|e| e.account.id != uuid);
            doc.tombstones.push(Tombstone {
                id: uuid,
                deleted_at: ts,
            });
        })
    }

    pub fn advance_hotp(&self, id: &str) -> Result<(), String> {
        let uuid = Uuid::parse_str(id).map_err(str_err)?;
        let ts = now_ms();
        self.mutate(|doc| {
            if let Some(e) = doc.entries.iter_mut().find(|e| e.account.id == uuid) {
                e.account.counter += 1;
                e.modified_at = ts;
            }
        })
    }

    // Apply `f` to the in-memory doc, then re-seal and persist under the same
    // passphrase with a fresh random salt + nonce.
    fn mutate<T>(&self, f: impl FnOnce(&mut VaultDocument) -> T) -> Result<T, String> {
        let mut guard = self.inner.lock().expect("vault mutex");
        let u = guard.as_mut().ok_or("vault is locked")?;
        let out = f(&mut u.doc);
        let doc = u.doc.clone();
        let pass = u.passphrase.clone();
        drop(guard);
        self.seal_and_save(&doc, &pass)?;
        Ok(out)
    }

    /// Persist a sealed blob, bump the revision, and persist the revision.
    /// The single choke point every write goes through.
    fn write_blob_locked(&self, rev: &mut u64, blob: &[u8]) -> Result<u64, String> {
        self.store.save(blob).map_err(str_err)?;
        *rev += 1;
        std::fs::write(&self.rev_path, rev.to_string()).map_err(str_err)?;
        Ok(*rev)
    }

    fn seal_and_save(&self, doc: &VaultDocument, passphrase: &str) -> Result<(), String> {
        let salt = random::<SALT_LEN>();
        let nonce = random::<NONCE_LEN>();
        let blob = seal_with_passphrase(doc, passphrase, &salt, &nonce).map_err(str_err)?;
        let mut rev = self.revision.lock().expect("revision mutex");
        self.write_blob_locked(&mut rev, &blob)?;
        Ok(())
    }

    /// Write an externally-supplied sealed blob under the revision guard. If the
    /// vault is unlocked, re-open the new blob so the desktop UI reflects it;
    /// if it can't be opened (a genuinely different passphrase), lock the vault
    /// rather than show stale data.
    pub fn replace_sealed(
        &self,
        blob: &[u8],
        base_revision: u64,
    ) -> Result<ReplaceOutcome, String> {
        let mut rev = self.revision.lock().expect("revision mutex");
        if base_revision != *rev {
            let current = self.store.load().map_err(str_err)?.unwrap_or_default();
            return Ok(ReplaceOutcome::Conflict {
                revision: *rev,
                blob: current,
            });
        }
        let new_rev = self.write_blob_locked(&mut rev, blob)?;
        drop(rev);

        let mut guard = self.inner.lock().expect("vault mutex");
        if let Some(u) = guard.as_mut() {
            match open_with_passphrase(blob, &u.passphrase) {
                Ok(doc) => u.doc = doc,
                Err(_) => *guard = None,
            }
        }
        Ok(ReplaceOutcome::Committed { revision: new_rev })
    }

    /// Fold an externally-sealed blob (same passphrase, any salt) into this
    /// vault and return the merged document re-sealed under the sender's salt.
    /// Requires the vault unlocked — only the passphrase can open a foreign salt.
    pub fn merge_incoming(&self, incoming: &[u8]) -> Result<MergeResult, String> {
        let (merged, pass, sender_salt) = {
            let mut guard = self.inner.lock().expect("vault mutex");
            let u = guard.as_mut().ok_or("vault is locked")?;
            let doc_ext = open_with_passphrase(incoming, &u.passphrase)
                .map_err(|_| "passphrase mismatch".to_string())?;
            let merged = merge(&u.doc, &doc_ext);
            u.doc = merged.clone();
            let sender_salt = salt_of(incoming).map_err(str_err)?;
            (merged, u.passphrase.clone(), sender_salt)
        };
        // Persist the merged doc as our own next generation (fresh salt + rev).
        self.seal_and_save(&merged, &pass)?;
        // Re-seal it under the sender's salt so the extension's existing key opens it.
        let key = derive_key(&pass, &sender_salt);
        let nonce = random::<NONCE_LEN>();
        let blob = seal(&merged, &key, &sender_salt, &nonce).map_err(str_err)?;
        Ok(MergeResult {
            revision: self.revision(),
            blob,
        })
    }
}

fn keyring_entry() -> Result<keyring::Entry, keyring::Error> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
}

fn keyring_set(passphrase: &str) -> Result<(), keyring::Error> {
    keyring_entry()?.set_password(passphrase)
}

fn keyring_get() -> Option<String> {
    keyring_entry().ok()?.get_password().ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    const PASS: &str = "correct-horse-battery";

    fn fresh() -> (AppVault, tempfile::TempDir) {
        let dir = tempdir().unwrap();
        let vault = AppVault::new(dir.path().join("vault.dat"));
        (vault, dir)
    }

    #[test]
    fn revision_starts_at_zero_and_bumps_on_each_save() {
        let (vault, _dir) = fresh();
        assert_eq!(vault.revision(), 0);
        vault.unlock(PASS.into(), false).unwrap(); // creates + saves the empty vault
        assert_eq!(vault.revision(), 1);
        vault
            .add_uri("otpauth://totp/Acme:me?secret=JBSWY3DPEHPK3PXP&issuer=Acme")
            .unwrap();
        assert_eq!(vault.revision(), 2);
    }

    #[test]
    fn revision_survives_reopening_the_vault() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("vault.dat");
        {
            let vault = AppVault::new(path.clone());
            vault.unlock(PASS.into(), false).unwrap();
            vault
                .add_uri("otpauth://totp/A:b?secret=JBSWY3DPEHPK3PXP")
                .unwrap();
            assert_eq!(vault.revision(), 2);
        }
        let reopened = AppVault::new(path);
        assert_eq!(reopened.revision(), 2);
    }

    #[test]
    fn sealed_blob_round_trips_through_replace() {
        let (vault, _dir) = fresh();
        vault.unlock(PASS.into(), false).unwrap();
        let rev = vault.revision();
        let blob = vault.sealed_blob().unwrap().expect("a vault exists");

        // Re-sealing the same doc under the same passphrase is a valid new blob.
        let outcome = vault.replace_sealed(&blob, rev).unwrap();
        match outcome {
            ReplaceOutcome::Committed { revision } => assert_eq!(revision, rev + 1),
            ReplaceOutcome::Conflict { .. } => panic!("expected commit"),
        }
        assert_eq!(vault.revision(), rev + 1);
    }

    #[test]
    fn replace_with_stale_base_revision_conflicts() {
        let (vault, _dir) = fresh();
        vault.unlock(PASS.into(), false).unwrap();
        let blob = vault.sealed_blob().unwrap().unwrap();
        let current = vault.revision();

        let outcome = vault.replace_sealed(&blob, current - 1).unwrap();
        match outcome {
            ReplaceOutcome::Conflict {
                revision,
                blob: got,
            } => {
                assert_eq!(revision, current);
                assert_eq!(got, blob);
            }
            ReplaceOutcome::Committed { .. } => panic!("expected conflict"),
        }
        assert_eq!(vault.revision(), current, "a conflict must not bump");
    }

    #[test]
    fn merge_incoming_merges_both_sides_and_replies_under_the_senders_salt() {
        let (desktop, _d) = fresh();
        desktop.unlock(PASS.into(), false).unwrap();
        let d = desktop
            .add_uri("otpauth://totp/D:d?secret=JBSWY3DPEHPK3PXP")
            .unwrap();

        // A second vault stands in for the extension: same passphrase, its own salt.
        let (ext, _e) = fresh();
        ext.unlock(PASS.into(), false).unwrap();
        let e = ext
            .add_uri("otpauth://totp/E:e?secret=JBSWY3DPEHPK3PXP")
            .unwrap();
        let ext_blob = ext.sealed_blob().unwrap().unwrap();
        let ext_salt = salt_of(&ext_blob).unwrap();

        let before = desktop.revision();
        let res = desktop.merge_incoming(&ext_blob).unwrap();
        assert!(res.revision > before);

        // The desktop now holds both accounts.
        let ids: Vec<_> = desktop.list().unwrap().into_iter().map(|a| a.id).collect();
        assert!(ids.contains(&d.id) && ids.contains(&e.id));

        // The reply is sealed under the sender's salt (so the extension's key
        // opens it) and carries the merged document.
        assert_eq!(salt_of(&res.blob).unwrap(), ext_salt);
        let doc = open_with_passphrase(&res.blob, PASS).unwrap();
        assert_eq!(doc.entries.len(), 2);
    }

    #[test]
    fn merge_incoming_rejects_a_different_passphrase() {
        let (desktop, _d) = fresh();
        desktop.unlock(PASS.into(), false).unwrap();
        let (ext, _e) = fresh();
        ext.unlock("a-different-passphrase".into(), false).unwrap();
        let ext_blob = ext.sealed_blob().unwrap().unwrap();
        let err = desktop.merge_incoming(&ext_blob).unwrap_err();
        assert!(err.contains("passphrase"), "got {err}");
    }

    #[test]
    fn merge_incoming_needs_an_unlocked_vault() {
        let (desktop, _d) = fresh(); // never unlocked
        let (ext, _e) = fresh();
        ext.unlock(PASS.into(), false).unwrap();
        let ext_blob = ext.sealed_blob().unwrap().unwrap();
        let err = desktop.merge_incoming(&ext_blob).unwrap_err();
        assert!(err.contains("locked"), "got {err}");
    }
}
