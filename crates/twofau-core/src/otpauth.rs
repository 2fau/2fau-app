use crate::base32::{base32_decode, base32_encode};
use crate::error::OtpError;
use crate::model::{Account, OtpAlgorithm, OtpType, ParsedOtp};
use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};
use url::Url;

/// Parse an `otpauth://totp/...` or `otpauth://hotp/...` URI into [`ParsedOtp`].
/// Defaults follow the Key Uri Format: SHA1, 6 digits, 30s period, counter 0.
pub fn parse_otpauth(uri: &str) -> Result<ParsedOtp, OtpError> {
    let url = Url::parse(uri).map_err(|_| OtpError::InvalidUri)?;
    if url.scheme() != "otpauth" {
        return Err(OtpError::UnsupportedScheme);
    }

    let mut otp_type = match url.host_str() {
        Some("totp") => OtpType::Totp,
        Some("hotp") => OtpType::Hotp,
        Some("steam") => OtpType::Steam,
        _ => return Err(OtpError::UnsupportedScheme),
    };

    // Label is the path (minus the leading '/'), percent-decoded. It may be
    // "Issuer:Account".
    let raw_label = url.path().trim_start_matches('/');
    let label_decoded = percent_encoding::percent_decode_str(raw_label)
        .decode_utf8_lossy()
        .into_owned();
    let (mut issuer, label) = match label_decoded.split_once(':') {
        Some((iss, acc)) => (iss.trim().to_string(), acc.trim().to_string()),
        None => (String::new(), label_decoded),
    };

    let mut secret_b32: Option<String> = None;
    let mut algorithm = OtpAlgorithm::Sha1;
    let mut digits: u8 = 6;
    let mut period: u32 = 30;
    let mut counter: u64 = 0;

    for (k, v) in url.query_pairs() {
        match k.as_ref() {
            "secret" => secret_b32 = Some(v.into_owned()),
            "issuer" => {
                if issuer.is_empty() {
                    issuer = v.into_owned();
                }
            }
            "algorithm" => {
                algorithm = match v.to_ascii_uppercase().as_str() {
                    "SHA1" => OtpAlgorithm::Sha1,
                    "SHA256" => OtpAlgorithm::Sha256,
                    "SHA512" => OtpAlgorithm::Sha512,
                    _ => return Err(OtpError::UnsupportedAlgorithm),
                }
            }
            "digits" => digits = v.parse().map_err(|_| OtpError::InvalidDigits)?,
            "period" => period = v.parse().map_err(|_| OtpError::InvalidUri)?,
            "counter" => counter = v.parse().map_err(|_| OtpError::InvalidUri)?,
            _ => {}
        }
    }

    // Steam codes are commonly shared as plain TOTP with issuer=Steam; promote
    // them so they generate Steam's alphabet codes rather than 6 digits.
    if otp_type == OtpType::Totp && issuer.eq_ignore_ascii_case("steam") {
        otp_type = OtpType::Steam;
    }

    let secret_b32 = secret_b32.ok_or(OtpError::MissingSecret)?;
    let secret = base32_decode(&secret_b32)?;
    if secret.is_empty() {
        return Err(OtpError::MissingSecret);
    }
    if otp_type == OtpType::Steam {
        // Steam is fixed: 5 alphabet chars, SHA-1, 30s.
        digits = 5;
        period = 30;
        algorithm = OtpAlgorithm::Sha1;
    } else if !(6..=10).contains(&digits) {
        return Err(OtpError::InvalidDigits);
    }

    Ok(ParsedOtp {
        issuer,
        label,
        otp_type,
        algorithm,
        digits,
        period,
        counter,
        secret,
    })
}

fn algorithm_name(a: OtpAlgorithm) -> &'static str {
    match a {
        OtpAlgorithm::Sha1 => "SHA1",
        OtpAlgorithm::Sha256 => "SHA256",
        OtpAlgorithm::Sha512 => "SHA512",
    }
}

/// Build an `otpauth://` URI for `account` with its raw `secret` bytes. Inverse
/// of [`parse_otpauth`] — used to render an account's QR so it can be re-added
/// on another device. Mirrors the shared UI's `buildOtpauthUri`.
pub fn build_otpauth(account: &Account, secret: &[u8]) -> String {
    let enc = |s: &str| utf8_percent_encode(s, NON_ALPHANUMERIC).to_string();
    // Steam is emitted as TOTP with issuer=Steam so other apps can import it;
    // parse_otpauth promotes it back to Steam via that issuer.
    let kind = match account.otp_type {
        OtpType::Totp | OtpType::Steam => "totp",
        OtpType::Hotp => "hotp",
    };
    let label = if account.issuer.is_empty() {
        enc(&account.label)
    } else {
        format!("{}:{}", enc(&account.issuer), enc(&account.label))
    };

    let mut params = format!("secret={}", base32_encode(secret));
    if !account.issuer.is_empty() {
        params.push_str(&format!("&issuer={}", enc(&account.issuer)));
    } else if account.otp_type == OtpType::Steam {
        params.push_str("&issuer=Steam");
    }
    params.push_str(&format!(
        "&algorithm={}&digits={}",
        algorithm_name(account.algorithm),
        account.digits
    ));
    match account.otp_type {
        OtpType::Totp | OtpType::Steam => params.push_str(&format!("&period={}", account.period)),
        OtpType::Hotp => params.push_str(&format!("&counter={}", account.counter)),
    }
    format!("otpauth://{kind}/{label}?{params}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn account(issuer: &str, label: &str, otp_type: OtpType) -> Account {
        Account {
            id: Uuid::nil(),
            issuer: issuer.to_string(),
            label: label.to_string(),
            otp_type,
            algorithm: OtpAlgorithm::Sha256,
            digits: 8,
            period: 60,
            counter: 4,
            color: String::new(),
        }
    }

    #[test]
    fn build_then_parse_round_trips_a_totp_account() {
        let a = account("ACME Co", "john@example.com", OtpType::Totp);
        let secret = b"12345678901234567890";
        let uri = build_otpauth(&a, secret);
        let p = parse_otpauth(&uri).unwrap();
        assert_eq!(p.issuer, "ACME Co");
        assert_eq!(p.label, "john@example.com");
        assert_eq!(p.otp_type, OtpType::Totp);
        assert_eq!(p.algorithm, OtpAlgorithm::Sha256);
        assert_eq!(p.digits, 8);
        assert_eq!(p.period, 60);
        assert_eq!(p.secret, secret);
    }

    #[test]
    fn build_uses_counter_for_hotp_and_omits_issuer_when_empty() {
        let a = account("", "me", OtpType::Hotp);
        let uri = build_otpauth(&a, b"12345678901234567890");
        assert!(uri.starts_with("otpauth://hotp/me?"));
        assert!(uri.contains("counter=4"));
        assert!(!uri.contains("issuer="));
        // And it parses back to the counter.
        assert_eq!(parse_otpauth(&uri).unwrap().counter, 4);
    }

    #[test]
    fn parses_a_full_totp_uri() {
        let p = parse_otpauth(
            "otpauth://totp/ACME%20Co:john@example.com\
             ?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=ACME%20Co\
             &algorithm=SHA256&digits=8&period=60",
        )
        .unwrap();
        assert_eq!(p.issuer, "ACME Co");
        assert_eq!(p.label, "john@example.com");
        assert_eq!(p.otp_type, OtpType::Totp);
        assert_eq!(p.algorithm, OtpAlgorithm::Sha256);
        assert_eq!(p.digits, 8);
        assert_eq!(p.period, 60);
        assert_eq!(p.secret, b"12345678901234567890");
    }

    #[test]
    fn applies_defaults_and_parses_hotp_counter() {
        let p = parse_otpauth("otpauth://hotp/me?secret=GEZDGNBVGY3TQOJQ&counter=7").unwrap();
        assert_eq!(p.issuer, "");
        assert_eq!(p.label, "me");
        assert_eq!(p.otp_type, OtpType::Hotp);
        assert_eq!(p.algorithm, OtpAlgorithm::Sha1);
        assert_eq!(p.digits, 6);
        assert_eq!(p.period, 30);
        assert_eq!(p.counter, 7);
    }

    #[test]
    fn rejects_missing_secret_and_bad_scheme() {
        assert_eq!(
            parse_otpauth("otpauth://totp/me"),
            Err(OtpError::MissingSecret)
        );
        assert_eq!(
            parse_otpauth("https://totp/me?secret=GEZDGNBVGY3TQOJQ"),
            Err(OtpError::UnsupportedScheme)
        );
        assert_eq!(
            parse_otpauth("otpauth://sms/me?secret=GEZDGNBVGY3TQOJQ"),
            Err(OtpError::UnsupportedScheme)
        );
    }
}
