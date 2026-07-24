//! The localhost bridge: an opt-in HTTP server that serves and accepts the
//! sealed vault blob for the browser extension. Off by default.

mod state;

pub use state::{BridgeState, PairedBrowser, DEFAULT_PORT, PAIRING_TTL_MS};
