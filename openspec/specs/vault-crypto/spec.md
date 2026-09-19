# vault-crypto Specification

## Purpose

The encryption layer and storage abstraction that seal a `VaultDocument` into an
opaque, self-describing blob and recover it, identically on native and WASM. The
root of trust is a user passphrase, so every host — desktop, extension, bridge —
can open the same bytes.

## Requirements

### Requirement: Self-describing vault blob format

The sealed blob SHALL be laid out as
`magic "2FAU"(4) | version u8 | kdf_id u8 | salt(16) | nonce(12) | ciphertext(+GCM tag)`.
The 34-byte header SHALL be bound verbatim as AES-GCM associated data. The layout
SHALL NOT change without bumping `version`/`kdf_id` and handling the old value.

#### Scenario: Header tampering

- **WHEN** any byte of the magic, version, kdf_id, salt, or nonce is altered
- **THEN** `open` fails with `DecryptFailed` rather than returning a document

#### Scenario: Foreign or truncated blob

- **WHEN** `open` receives a blob shorter than the header or with the wrong magic
- **THEN** it returns `BadFormat`, and an unrecognized version or kdf_id returns `UnsupportedVersion`/`UnknownKdf`

### Requirement: Passphrase-derived key

Keys SHALL be derived with PBKDF2-HMAC-SHA256, 600,000 iterations, 32-byte
output, pinned by the blob's `kdf_id` so parameters can be revised without
breaking existing blobs. The derived `Key` SHALL be zeroized on drop.

#### Scenario: Deterministic derivation

- **WHEN** `derive_key` runs twice with the same passphrase and salt
- **THEN** it produces the same key, and a different salt produces a different key

#### Scenario: Wrong passphrase

- **WHEN** `open` is called with a key derived from the wrong passphrase
- **THEN** it returns `DecryptFailed` and no plaintext is produced

### Requirement: Host-supplied randomness

`seal` SHALL take `salt` and `nonce` as inputs so `twofau-core` stays RNG-free.
The WASM wrapper and the desktop app SHALL generate them, and each save SHALL use
a fresh random salt and nonce.

#### Scenario: Sealing from the extension

- **WHEN** JavaScript calls `seal_vault(doc, passphrase)`
- **THEN** the wrapper generates salt and nonce via `getrandom` and the core receives them as arguments

### Requirement: Ciphertext contains no plaintext secret

Sealing SHALL encrypt the JSON-serialized `VaultDocument`, so no account secret
appears in the blob.

#### Scenario: Searching the blob

- **WHEN** a document containing a known secret is sealed
- **THEN** that secret's bytes do not appear anywhere in the resulting blob

### Requirement: Storage abstraction

`twofau-core::store` SHALL define a `VaultStore` trait with `load` returning the
raw blob or `None` when absent, and `save` persisting it. `FileVaultStore` SHALL
write atomically (temp file plus rename) and SHALL be excluded from `wasm32`
builds; `InMemoryVaultStore` SHALL be available on all targets.

#### Scenario: First run with no vault

- **WHEN** `load` is called and no vault file exists
- **THEN** it returns `Ok(None)` rather than an error

#### Scenario: Interrupted save

- **WHEN** a `save` is interrupted before the rename completes
- **THEN** the previously stored blob remains intact and loadable

### Requirement: Key-based sealing for hosts that cache a key

The crate SHALL expose key-based `seal`/`open` alongside the passphrase
convenience wrappers, and the WASM boundary SHALL expose `derive_key`,
`seal_with_key`, and `open_with_key`, so a host can cache a derived key instead of
a passphrase and avoid re-running the KDF per operation.

#### Scenario: Extension opening a vault with a cached key

- **WHEN** the extension holds a derived key and calls `open_with_key(blob, key)`
- **THEN** the document is recovered without deriving the key again
