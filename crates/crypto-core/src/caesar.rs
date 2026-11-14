//! Caesar with a fixed forward shift of eight over ASCII A–Z.
//! For education only; this cipher does not provide modern security.

use crate::{CipherResult, CryptoError, Operation, StepArithmetic, cipher::transform};

/// Encrypts nonempty ASCII A–Z text with a fixed shift of +8.
///
/// # Errors
/// Rejects empty input or the first character outside ASCII A–Z.
pub fn encrypt(message: &str) -> Result<CipherResult, CryptoError> {
    transform(message, Operation::Encrypt, |input| StepArithmetic::Shift {
        input,
        shift: 8,
    })
}

/// Decrypts nonempty ASCII A–Z text with a fixed shift of -8.
///
/// # Errors
/// Rejects empty input or the first character outside ASCII A–Z.
pub fn decrypt(message: &str) -> Result<CipherResult, CryptoError> {
    transform(message, Operation::Decrypt, |input| StepArithmetic::Shift {
        input,
        shift: -8,
    })
}
