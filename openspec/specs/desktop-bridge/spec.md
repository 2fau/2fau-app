# desktop-bridge Specification

## Purpose

The desktop app's loopback HTTP bridge and the extension's three backend modes,
letting the browser and the desktop share one vault. Only ciphertext crosses the
wire: each side opens the sealed blob with its own derived key.

## Requirements

### Requirement: Three user-selected modes

The extension SHALL offer `independent`, `client`, and `sync` modes.
`independent` uses `chrome.storage` only with no desktop contact. `client` holds
no local vault and routes every operation to the desktop. `sync` keeps the local
`chrome.storage` vault as primary and reconciles it with the desktop in the
background. Mode SHALL be orthogonal to the `storageArea` setting, which applies
only to the modes that keep a local vault.

#### Scenario: Desktop unreachable in client mode

- **WHEN** the desktop is closed while the extension is in `client` mode
- **THEN** the service reports a distinct "desktop offline" locked state and the popup prompts to reconnect, rather than showing an empty vault

#### Scenario: Independent mode untouched

- **WHEN** the user stays in `independent` mode
- **THEN** no bridge code runs and the extension holds zero host permissions

### Requirement: Ciphertext-only transport

The bridge SHALL transfer only the sealed vault blob, base64-encoded. No account,
secret, or code SHALL cross the wire in the clear, and the desktop SHALL NOT send
the salt separately — the extension recovers it from the blob.

#### Scenario: Observing the loopback traffic

- **WHEN** a request or response body is inspected
- **THEN** it contains only ciphertext and a revision number

### Requirement: Bridge server is off by default and loopback-only

The desktop SHALL host the bridge only when explicitly enabled from its settings,
bound to `127.0.0.1` on a configurable port (default `4849`), never `0.0.0.0`.

#### Scenario: Fresh install

- **WHEN** the desktop app is installed and launched
- **THEN** no port is listening until the user enables the bridge

### Requirement: Three independent request defenses

Every `/vault*` request SHALL be rejected unless it carries the paired
extension's exact `chrome-extension://<id>` origin, a `Host` header of
`127.0.0.1:<port>` or `localhost:<port>`, and a valid bearer token compared in
constant time. Each layer SHALL be sufficient on its own, and no permissive CORS
headers SHALL be returned to any other origin.

#### Scenario: DNS-rebinding attempt

- **WHEN** a request arrives with an attacker-controlled `Host` header
- **THEN** it is rejected before any vault access

#### Scenario: Another local process

- **WHEN** a local process without the token calls `/vault`
- **THEN** the request is rejected, and even defeating all three layers would yield only ciphertext

### Requirement: Pairing is explicit and revocable

Pairing SHALL require a short-lived code (about two minutes) shown on the
desktop. `POST /pair` SHALL verify the code, mint a token bound to that extension
origin, and add the browser to a paired list the user can revoke at any time. The
extension SHALL request the optional `http://127.0.0.1/*` host permission at
runtime only when a bridge mode is turned on.

#### Scenario: Expired code

- **WHEN** a pairing code older than its validity window is submitted
- **THEN** pairing fails with `401` and no token is minted

#### Scenario: Revoking a browser

- **WHEN** the user revokes a paired browser
- **THEN** its token stops working immediately

### Requirement: Revision-guarded writes

`AppVault` SHALL hold a monotonic `revision` persisted alongside the vault and
incremented on every desktop save, including edits made in the desktop UI.
`PUT /vault` SHALL carry `base_revision`; a mismatch SHALL return `409` with the
current `{revision, blob}` so the client can fold the remote in and retry.

#### Scenario: Stale write

- **WHEN** the extension pushes a blob derived from an older revision
- **THEN** the desktop returns `409` with its current blob and the extension merges and retries

#### Scenario: Edit made in the desktop UI

- **WHEN** the user edits an account on the desktop
- **THEN** the revision advances so the extension observes the change

### Requirement: First-run desktop vault

`GET /vault` and `GET /vault/revision` SHALL return `404` when the desktop has no
vault yet, and the extension SHALL treat that as an empty vault to create.

#### Scenario: Desktop has never been unlocked

- **WHEN** the extension fetches the vault from a fresh desktop install
- **THEN** it receives `404` and proceeds as it would with empty `chrome.storage`

### Requirement: Best-effort background sync

In `sync` mode a background engine SHALL reconcile on connect, on a roughly 60
second alarm, and after each local change: pull the desktop blob, `merge` into the
local vault, and push back when the merge changed anything, retrying a `409` by
folding in the remote. A pass SHALL be a silent no-op when the desktop is absent
and SHALL never block the UI.

#### Scenario: Desktop absent

- **WHEN** a reconcile pass runs with no desktop listening
- **THEN** it ends silently and the popup continues to work against the local vault

### Requirement: Bridge settings stay out of the shared UI

The desktop SHALL supply its bridge settings through the shared UI's
`settingsSlot`, and no bridge-specific code SHALL enter `@twofau/ui`.

#### Scenario: Building the shared UI

- **WHEN** `@twofau/ui` is built
- **THEN** it contains no reference to bridge commands or endpoints
