//! Affine cipher over ASCII A–Z, with normalized integer keys and exact traces.
//! For education only; this cipher does not provide modern security.

use crate::{
    CipherResult, CryptoError, Operation, StepArithmetic,
    cipher::transform,
    math::{ModularInverseResult, modular_inverse, modulo},
};

/// Supplied or normalized affine parameters; a supplied key may be invalid.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AffineKey {
    /// Multiplicative parameter; must be coprime with 26 after normalization.
    pub a: i32,
    /// Additive parameter.
    pub b: i32,
}

/// Affine output, key normalization, and the inverse derivation.
///
/// Contains private educational session information; this is not an interceptor
/// projection. Serialization and perspective filtering belong to future adapters.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AffineResult {
    /// Parameters exactly as supplied by the caller.
    pub supplied_key: AffineKey,
    /// Both parameters reduced into 0..26.
    pub normalized_key: AffineKey,
    /// Inverse of the normalized multiplier, derived once for this operation.
    pub inverse: ModularInverseResult,
    /// Output and ordered per-letter arithmetic trace.
    pub cipher: CipherResult,
}

/// Encrypts using `(a*x + b) mod 26` after normalizing the key.
///
/// # Errors
/// Rejects a noninvertible multiplier before checking the message. Text must
/// be nonempty ASCII A–Z; the first invalid character is reported by byte offset.
pub fn encrypt(message: &str, key: AffineKey) -> Result<AffineResult, CryptoError> {
    apply(message, key, Operation::Encrypt)
}

/// Decrypts using `a⁻¹*(y - b) mod 26` after normalizing the key.
///
/// # Errors
/// Uses the same key-first validation and text rules as [`encrypt`].
pub fn decrypt(message: &str, key: AffineKey) -> Result<AffineResult, CryptoError> {
    apply(message, key, Operation::Decrypt)
}

fn apply(message: &str, key: AffineKey, operation: Operation) -> Result<AffineResult, CryptoError> {
    let normalized_key = AffineKey {
        a: modulo(key.a, 26)?,
        b: modulo(key.b, 26)?,
    };
    let inverse = modular_inverse(normalized_key.a, 26).map_err(|error| match error {
        CryptoError::NoModularInverse { gcd, .. } => CryptoError::InvalidAffineKey {
            supplied_a: key.a,
            normalized_a: normalized_key.a,
            gcd,
        },
        other => other,
    })?;
    let cipher = transform(message, operation, |input| match operation {
        Operation::Encrypt => StepArithmetic::AffineEncrypt {
            input,
            multiplier: normalized_key.a,
            offset: normalized_key.b,
        },
        Operation::Decrypt => StepArithmetic::AffineDecrypt {
            input,
            inverse: inverse.inverse,
            offset: normalized_key.b,
        },
    })?;
    Ok(AffineResult {
        supplied_key: key,
        normalized_key,
        inverse,
        cipher,
    })
}
