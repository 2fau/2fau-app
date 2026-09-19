# otp-core Specification

## Purpose

The shared Rust core (`twofau-core`) that computes one-time passwords, parses
`otpauth://` URIs, and merges vault documents, plus the thin `twofau-wasm`
wrapper that exposes it to JavaScript. It is the single implementation of the
critical logic, compiled natively for the desktop app and to `wasm32` for the
browser extension.

## Requirements

### Requirement: Purity of the core crate

`twofau-core` SHALL contain no clock, no RNG, no filesystem access, and no
network access. Callers supply `unix_time`, ids, salts, and nonces. `getrandom`
and `uuid v4` live only in `twofau-wasm` and in the host applications.

#### Scenario: Computing a TOTP code

- **WHEN** a caller invokes `totp(secret, unix_time, period, digits, algo)`
- **THEN** the code is derived from the supplied `unix_time` and the core never reads the system clock

#### Scenario: Parsing an otpauth URI

- **WHEN** `parse_otpauth(uri)` succeeds
- **THEN** it returns a `ParsedOtp` without an `id`, leaving id assignment to the host

### Requirement: RFC-conformant OTP generation

The core SHALL implement HOTP (RFC 4226) and TOTP (RFC 6238) over SHA-1,
SHA-256, and SHA-512, and Base32 decoding (RFC 4648) tolerant of lowercase input
and missing padding.

#### Scenario: RFC 4226 vectors

- **WHEN** `hotp` is called with the RFC 4226 Appendix D secret and counters 0–9
- **THEN** it returns the published reference codes

#### Scenario: RFC 6238 vectors

- **WHEN** `totp` is called at times 59, 1111111109, 1234567890, 2000000000, and 20000000000 for each supported algorithm
- **THEN** it returns the RFC 6238 Appendix B reference codes

#### Scenario: Lenient Base32 input

- **WHEN** `base32_decode` receives lowercase or unpadded input
- **THEN** it decodes successfully rather than returning `InvalidBase32`

### Requirement: Deterministic vault merge

`merge(local, remote)` SHALL union entries and tombstones by `id` using
newest-wins on `modified_at`, with a tombstone winning on a tie. The result SHALL
be deterministic and independent of argument order beyond the timestamps.

#### Scenario: Concurrent edit and delete at the same instant

- **WHEN** one side edited an account and the other deleted it with an equal timestamp
- **THEN** the merged document contains the tombstone and not the entry

#### Scenario: Re-adding a deleted account

- **WHEN** an entry's `modified_at` is later than its tombstone's `deleted_at`
- **THEN** the merged document contains the entry

### Requirement: Secret-free UI model

The `Account` type SHALL never carry a secret. Secrets SHALL live only in
`StoredAccount`, inside the encrypted vault, and SHALL cross the JavaScript
boundary as base64 strings rather than byte arrays.

#### Scenario: Listing accounts

- **WHEN** a host lists accounts for display
- **THEN** every returned `Account` carries metadata only, with no secret material

### Requirement: Typed WASM boundary

`twofau-wasm` SHALL wrap the core for JavaScript without leaking `wasm-bindgen`
into the core, passing complex types through `serde-wasm-bindgen` and exposing
host helpers `new_id()` and `now_ms()`. `packages/core-wasm` SHALL publish a
committed `index.ts` that layers the `ts-rs`-generated model types over the loose
`JsValue` returns.

#### Scenario: Merging from JavaScript

- **WHEN** JavaScript calls `merge(local, remote)` on the built WASM module
- **THEN** it receives a `VaultDocument` typed as such, not `any`

#### Scenario: Core crate stays wrapper-free

- **WHEN** `twofau-core` is compiled for any target
- **THEN** it depends on no `wasm-bindgen` symbol
