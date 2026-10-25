import type { Account } from "@twofau/ui/src/core/types";
import type { AddManualFields, Capabilities, VaultService } from "@twofau/ui/src/core/vault-service";
import { buildOtpauthUri } from "@twofau/ui/src/lib/otpauth";

/**
 * In-memory vault behind the homepage's live popup. The UI's own
 * MockVaultService computes codes through the WASM core, which would make the
 * site build depend on Rust + wasm-pack; the demo only ever holds throwaway
 * random secrets, so WebCrypto HMAC (RFC 4226/6238) is enough.
 * ponytail: Steam accounts get plain TOTP codes, add the Steam alphabet if the
 * demo ever needs it.
 */

const HASH = { Sha1: "SHA-1", Sha256: "SHA-256", Sha512: "SHA-512" } as const;
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(s: string): Uint8Array {
  const out: number[] = [];
  let bits = 0;
  let val = 0;
  for (const c of s.toUpperCase().replace(/[\s=-]/g, "")) {
    const i = B32.indexOf(c);
    if (i < 0) throw new Error("Invalid secret");
    val = ((val << 5) | i) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      out.push((val >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  if (!out.length) throw new Error("Invalid secret");
  return new Uint8Array(out);
}

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hotp(secretB64: string, counter: number, digits: number, algo: Account["algorithm"]) {
  const key = await crypto.subtle.importKey(
    "raw",
    fromB64(secretB64),
    { name: "HMAC", hash: HASH[algo] },
    false,
    ["sign"],
  );
  const msg = new DataView(new ArrayBuffer(8));
  msg.setUint32(0, Math.floor(counter / 2 ** 32));
  msg.setUint32(4, counter >>> 0);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg.buffer));
  const off = mac[mac.length - 1] & 0xf;
  const bin =
    ((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}

type Entry = { account: Account; secret: string };

const randomSecret = () => toB64(crypto.getRandomValues(new Uint8Array(20)));

function account(issuer: string, label: string, color: string, otp_type: Account["otp_type"] = "Totp"): Entry {
  return {
    account: {
      id: crypto.randomUUID(),
      issuer,
      label,
      otp_type,
      algorithm: "Sha1",
      digits: 6,
      period: 30,
      counter: 0,
      color,
    },
    secret: randomSecret(),
  };
}

export class DemoVaultService implements VaultService {
  private entries: Entry[] = [
    account("Google", "alex@example.com", "red"),
    account("GitHub", "alex", ""),
    account("Figma", "alex@example.com", "purple"),
    account("Stripe", "alex@example.com", "blue"),
    account("AWS", "root", "orange"),
    account("Cloudflare", "alex@example.com", "yellow"),
  ];
  private locked = false;

  capabilities(): Capabilities {
    return { scanScreen: false, qrImage: true, paste: true };
  }
  isLocked() {
    return this.locked;
  }
  needsSetup() {
    return false;
  }
  // Any passphrase opens the demo vault.
  async unlock() {
    this.locked = false;
  }
  async lock() {
    this.locked = true;
  }
  async list() {
    return this.entries.map((e) => e.account);
  }

  async addUri(uri: string): Promise<Account> {
    const u = new URL(uri);
    if (u.protocol !== "otpauth:") throw new Error("Not an otpauth:// link");
    const p = u.searchParams;
    const path = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    const [pathIssuer, label] = path.includes(":") ? path.split(/:(.*)/s) : ["", path];
    const algo = (p.get("algorithm") ?? "SHA1").toUpperCase();
    const e: Entry = {
      account: {
        id: crypto.randomUUID(),
        issuer: p.get("issuer") ?? pathIssuer,
        label: label.trim(),
        otp_type: u.host.toLowerCase() === "hotp" ? "Hotp" : "Totp",
        algorithm: algo === "SHA256" ? "Sha256" : algo === "SHA512" ? "Sha512" : "Sha1",
        digits: Number(p.get("digits")) || 6,
        period: Number(p.get("period")) || 30,
        counter: Number(p.get("counter")) || 0,
        color: "",
      },
      secret: toB64(base32Decode(p.get("secret") ?? "")),
    };
    this.entries.push(e);
    return e.account;
  }

  async addManual(f: AddManualFields): Promise<Account> {
    const e = account(f.issuer, f.label, "", f.type === "hotp" ? "Hotp" : "Totp");
    e.secret = toB64(base32Decode(f.secretBase32));
    this.entries.push(e);
    return e.account;
  }

  async update(a: Account) {
    const e = this.entries.find((x) => x.account.id === a.id);
    if (e) e.account = a;
  }

  async reorder(orderedIds: string[]) {
    const rank = new Map(orderedIds.map((id, i) => [id, i]));
    this.entries.sort(
      (a, b) =>
        (rank.get(a.account.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.account.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  async remove(id: string) {
    this.entries = this.entries.filter((e) => e.account.id !== id);
  }

  async code(a: Account, unixTimeMs: number) {
    const e = this.entries.find((x) => x.account.id === a.id);
    if (!e) return "-".repeat(a.digits);
    const counter = a.otp_type === "Hotp" ? a.counter : Math.floor(unixTimeMs / 1000 / a.period);
    return hotp(e.secret, counter, a.digits, a.algorithm);
  }

  async advanceHotp(id: string) {
    const e = this.entries.find((x) => x.account.id === id);
    if (e) e.account = { ...e.account, counter: e.account.counter + 1 };
  }

  async secretUri(id: string) {
    const e = this.entries.find((x) => x.account.id === id);
    if (!e) throw new Error(`no account with id ${id}`);
    return buildOtpauthUri(e.account, e.secret);
  }
}
