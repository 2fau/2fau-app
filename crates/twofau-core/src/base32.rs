use crate::error::OtpError;

const ALPHABET: &[u8; 32] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/// Decode an RFC 4648 Base32 string. Tolerant of lowercase, whitespace, and
/// `=` padding (all ignored).
pub fn base32_decode(input: &str) -> Result<Vec<u8>, OtpError> {
    let mut out = Vec::with_capacity(input.len() * 5 / 8 + 1);
    let mut buffer: u32 = 0;
    let mut bits_left: u32 = 0;

    for c in input.chars() {
        if c == '=' || c.is_whitespace() {
            continue;
        }
        let up = c.to_ascii_uppercase() as u8;
        let val = ALPHABET
            .iter()
            .position(|&a| a == up)
            .ok_or(OtpError::InvalidBase32)? as u32;

        buffer = (buffer << 5) | val;
        bits_left += 5;
        if bits_left >= 8 {
            bits_left -= 8;
            out.push((buffer >> bits_left) as u8);
            buffer &= (1 << bits_left) - 1;
        }
    }

    Ok(out)
}

/// Encode bytes as RFC 4648 Base32, no `=` padding — the form `otpauth://`
/// secrets and QR codes use. Inverse of [`base32_decode`].
pub fn base32_encode(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len().div_ceil(5) * 8);
    let mut buffer: u32 = 0;
    let mut bits: u32 = 0;
    for &b in bytes {
        buffer = (buffer << 8) | b as u32;
        bits += 8;
        while bits >= 5 {
            bits -= 5;
            out.push(ALPHABET[((buffer >> bits) & 0x1F) as usize] as char);
        }
        buffer &= (1 << bits) - 1; // keep only the not-yet-emitted low bits
    }
    if bits > 0 {
        out.push(ALPHABET[((buffer << (5 - bits)) & 0x1F) as usize] as char);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_rfc4648_vectors() {
        assert_eq!(base32_encode(b""), "");
        assert_eq!(base32_encode(b"f"), "MY");
        assert_eq!(base32_encode(b"foo"), "MZXW6");
        assert_eq!(base32_encode(b"foobar"), "MZXW6YTBOI");
    }

    #[test]
    fn encode_decode_round_trips_the_rfc_otp_seed() {
        let seed = b"12345678901234567890";
        let encoded = base32_encode(seed);
        assert_eq!(encoded, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
        assert_eq!(base32_decode(&encoded).unwrap(), seed);
    }

    #[test]
    fn decodes_rfc4648_vectors() {
        assert_eq!(base32_decode("MY======").unwrap(), b"f");
        assert_eq!(base32_decode("MZXW6===").unwrap(), b"foo");
        assert_eq!(base32_decode("MZXW6YTBOI======").unwrap(), b"foobar");
    }

    #[test]
    fn tolerates_missing_padding_and_lowercase_and_spaces() {
        assert_eq!(base32_decode("mzxw6").unwrap(), b"foo");
        assert_eq!(base32_decode("MZXW 6YTB OI").unwrap(), b"foobar");
    }

    #[test]
    fn decodes_the_rfc_otp_seed() {
        // The 20-byte RFC 4226/6238 SHA1 seed.
        assert_eq!(
            base32_decode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ").unwrap(),
            b"12345678901234567890"
        );
    }

    #[test]
    fn rejects_invalid_characters() {
        assert_eq!(base32_decode("0189!"), Err(OtpError::InvalidBase32));
    }
}
