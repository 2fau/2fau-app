//! Decoder for Google Authenticator's `otpauth-migration://offline?data=…`
//! export payload — a base64'd protobuf holding one or more accounts. Hand-rolled
//! (no protobuf dependency) since the schema is tiny and fixed:
//!
//! ```text
//! MigrationPayload { repeated OtpParameters otp_parameters = 1; ... }
//! OtpParameters {
//!   bytes secret = 1; string name = 2; string issuer = 3;
//!   Algorithm algorithm = 4;  // 1 SHA1, 2 SHA256, 3 SHA512, 4 MD5
//!   DigitCount digits = 5;    // 1 SIX, 2 EIGHT
//!   OtpType type = 6;         // 1 HOTP, 2 TOTP
//!   int64 counter = 7;
//! }
//! ```

use crate::error::OtpError;
use crate::model::{OtpAlgorithm, OtpType, ParsedOtp};
use base64::{engine::general_purpose::STANDARD, Engine};
use url::Url;

/// Decode an `otpauth-migration://` URI into its accounts. The exported secrets
/// are raw bytes (no Base32), matching [`ParsedOtp::secret`].
pub fn parse_migration(uri: &str) -> Result<Vec<ParsedOtp>, OtpError> {
    let url = Url::parse(uri).map_err(|_| OtpError::InvalidUri)?;
    if url.scheme() != "otpauth-migration" {
        return Err(OtpError::UnsupportedScheme);
    }
    let data = url
        .query_pairs()
        .find(|(k, _)| k == "data")
        .map(|(_, v)| v.into_owned())
        .ok_or(OtpError::MissingSecret)?;
    // The `data` value is base64 (standard alphabet, may be padded).
    let bytes = STANDARD
        .decode(data.as_bytes())
        .map_err(|_| OtpError::InvalidUri)?;

    let mut out = Vec::new();
    let mut i = 0usize;
    while i < bytes.len() {
        let (field, wire) = read_key(&bytes, &mut i)?;
        if field == 1 && wire == 2 {
            let msg = read_len_delimited(&bytes, &mut i)?;
            if let Some(parsed) = parse_params(msg) {
                out.push(parsed);
            }
        } else {
            skip_field(&bytes, &mut i, wire)?;
        }
    }
    Ok(out)
}

/// Decode one `OtpParameters` sub-message. Returns None for records with no
/// secret (unusable) rather than failing the whole import.
fn parse_params(bytes: &[u8]) -> Option<ParsedOtp> {
    let mut secret: Vec<u8> = Vec::new();
    let mut name = String::new();
    let mut issuer = String::new();
    let mut algorithm = OtpAlgorithm::Sha1;
    let mut digits: u8 = 6;
    let mut otp_type = OtpType::Totp;
    let mut counter: u64 = 0;

    let mut i = 0usize;
    while i < bytes.len() {
        let (field, wire) = read_key(bytes, &mut i).ok()?;
        match (field, wire) {
            (1, 2) => secret = read_len_delimited(bytes, &mut i).ok()?.to_vec(),
            (2, 2) => {
                name = String::from_utf8_lossy(read_len_delimited(bytes, &mut i).ok()?).into_owned()
            }
            (3, 2) => {
                issuer =
                    String::from_utf8_lossy(read_len_delimited(bytes, &mut i).ok()?).into_owned()
            }
            (4, 0) => {
                algorithm = match read_varint(bytes, &mut i).ok()? {
                    2 => OtpAlgorithm::Sha256,
                    3 => OtpAlgorithm::Sha512,
                    _ => OtpAlgorithm::Sha1,
                }
            }
            (5, 0) => {
                digits = if read_varint(bytes, &mut i).ok()? == 2 {
                    8
                } else {
                    6
                }
            }
            (6, 0) => {
                otp_type = if read_varint(bytes, &mut i).ok()? == 1 {
                    OtpType::Hotp
                } else {
                    OtpType::Totp
                }
            }
            (7, 0) => counter = read_varint(bytes, &mut i).ok()?,
            _ => skip_field(bytes, &mut i, wire).ok()?,
        }
    }

    if secret.is_empty() {
        return None;
    }
    // A "Steam" issuer marks a Steam account, matching parse_otpauth.
    if otp_type == OtpType::Totp && issuer.eq_ignore_ascii_case("steam") {
        otp_type = OtpType::Steam;
        digits = 5;
    }
    Some(ParsedOtp {
        issuer,
        label: name,
        otp_type,
        algorithm,
        digits,
        period: 30,
        counter,
        secret,
    })
}

/// Read a protobuf field key (tag), advancing `i`. Returns (field_number, wire_type).
fn read_key(bytes: &[u8], i: &mut usize) -> Result<(u64, u8), OtpError> {
    let key = read_varint(bytes, i)?;
    Ok((key >> 3, (key & 0x07) as u8))
}

/// Read a base-128 varint, advancing `i`.
fn read_varint(bytes: &[u8], i: &mut usize) -> Result<u64, OtpError> {
    let mut result: u64 = 0;
    let mut shift = 0u32;
    loop {
        let byte = *bytes.get(*i).ok_or(OtpError::InvalidUri)?;
        *i += 1;
        result |= ((byte & 0x7f) as u64) << shift;
        if byte & 0x80 == 0 {
            return Ok(result);
        }
        shift += 7;
        if shift >= 64 {
            return Err(OtpError::InvalidUri);
        }
    }
}

/// Read a length-delimited field's bytes, advancing `i` past them.
fn read_len_delimited<'a>(bytes: &'a [u8], i: &mut usize) -> Result<&'a [u8], OtpError> {
    let len = read_varint(bytes, i)? as usize;
    let end = i.checked_add(len).ok_or(OtpError::InvalidUri)?;
    let slice = bytes.get(*i..end).ok_or(OtpError::InvalidUri)?;
    *i = end;
    Ok(slice)
}

/// Skip a field of unknown/uninteresting type, advancing `i`.
fn skip_field(bytes: &[u8], i: &mut usize, wire: u8) -> Result<(), OtpError> {
    match wire {
        0 => {
            read_varint(bytes, i)?;
        }
        2 => {
            read_len_delimited(bytes, i)?;
        }
        5 => *i = i.checked_add(4).ok_or(OtpError::InvalidUri)?,
        1 => *i = i.checked_add(8).ok_or(OtpError::InvalidUri)?,
        _ => return Err(OtpError::InvalidUri),
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Hand-build one `OtpParameters` sub-message (secret "Hello", name "alice",
    /// issuer "ACME", SHA1, 6 digits, TOTP, counter 0).
    fn sample_params() -> Vec<u8> {
        let mut b = Vec::new();
        b.extend_from_slice(&[0x0A, 0x05]); // field1 secret, len 5
        b.extend_from_slice(b"Hello");
        b.extend_from_slice(&[0x12, 0x05]); // field2 name, len 5
        b.extend_from_slice(b"alice");
        b.extend_from_slice(&[0x1A, 0x04]); // field3 issuer, len 4
        b.extend_from_slice(b"ACME");
        b.extend_from_slice(&[0x20, 0x01]); // field4 algorithm = SHA1
        b.extend_from_slice(&[0x28, 0x01]); // field5 digits = SIX
        b.extend_from_slice(&[0x30, 0x02]); // field6 type = TOTP
        b.extend_from_slice(&[0x38, 0x00]); // field7 counter = 0
        b
    }

    fn migration_uri(params_msgs: &[Vec<u8>]) -> String {
        let mut payload = Vec::new();
        for p in params_msgs {
            payload.push(0x0A); // field1 otp_parameters, wire 2
            payload.push(p.len() as u8); // len fits in one byte for the test
            payload.extend_from_slice(p);
        }
        format!(
            "otpauth-migration://offline?data={}",
            STANDARD.encode(&payload)
        )
    }

    #[test]
    fn parses_a_google_authenticator_export() {
        let accounts =
            parse_migration(&migration_uri(&[sample_params(), sample_params()])).unwrap();
        assert_eq!(accounts.len(), 2);
        let a = &accounts[0];
        assert_eq!(a.otp_type, OtpType::Totp);
        assert_eq!(a.issuer, "ACME");
        assert_eq!(a.label, "alice");
        assert_eq!(a.digits, 6);
        assert_eq!(a.secret, b"Hello");
    }

    #[test]
    fn rejects_a_non_migration_uri() {
        assert!(parse_migration("otpauth://totp/x?secret=AA").is_err());
    }
}
