use crate::CryptoError;

/// Direction of a cipher operation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Operation {
    /// Transform plaintext to ciphertext.
    Encrypt,
    /// Transform ciphertext to plaintext.
    Decrypt,
}

/// Structured arithmetic before modular reduction; no expression parsing needed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StepArithmetic {
    /// `input + shift`, with a negative shift for Caesar decryption.
    Shift {
        /// Input letter value.
        input: u8,
        /// Signed fixed displacement.
        shift: i32,
    },
    /// `multiplier * input + offset`.
    AffineEncrypt {
        /// Input letter value.
        input: u8,
        /// Normalized affine multiplier.
        multiplier: i32,
        /// Normalized affine offset.
        offset: i32,
    },
    /// `inverse * (input - offset)`.
    AffineDecrypt {
        /// Input letter value.
        input: u8,
        /// Normalized multiplicative inverse.
        inverse: i32,
        /// Normalized affine offset.
        offset: i32,
    },
}

impl StepArithmetic {
    fn evaluate(self) -> i64 {
        match self {
            Self::Shift { input, shift } => i64::from(input) + i64::from(shift),
            Self::AffineEncrypt {
                input,
                multiplier,
                offset,
            } => i64::from(multiplier) * i64::from(input) + i64::from(offset),
            Self::AffineDecrypt {
                input,
                inverse,
                offset,
            } => i64::from(inverse) * (i64::from(input) - i64::from(offset)),
        }
    }
}

/// A letter transformation, containing both unreduced arithmetic and residue.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CipherStep {
    /// Zero-based UTF-8 byte index in the input.
    pub byte_index: usize,
    /// Original character for this operation.
    pub input_character: char,
    /// Input value, A=0 through Z=25.
    pub input_value: u8,
    /// Structured expression and operands.
    pub arithmetic: StepArithmetic,
    /// Value of the expression before modular reduction.
    pub unreduced: i64,
    /// Alphabet modulus, always 26.
    pub modulus: i32,
    /// Least nonnegative residue, A=0 through Z=25.
    pub output_value: u8,
    /// Character corresponding to the residue.
    pub output_character: char,
}

/// Cipher output and its ordered educational trace.
///
/// This internal domain result is not an interceptor-view contract.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CipherResult {
    /// Requested transformation direction.
    pub operation: Operation,
    /// Complete transformed message.
    pub output: String,
    /// One step per input letter in order.
    pub steps: Vec<CipherStep>,
}

pub(crate) fn transform(
    message: &str,
    operation: Operation,
    arithmetic: impl Fn(u8) -> StepArithmetic,
) -> Result<CipherResult, CryptoError> {
    if message.is_empty() {
        return Err(CryptoError::EmptyMessage);
    }
    // Validate the entire message before allocating results or processing letters.
    for (byte_index, character) in message.char_indices() {
        if !character.is_ascii_uppercase() {
            return Err(CryptoError::InvalidCharacter {
                character,
                byte_index,
            });
        }
    }

    let mut output = String::with_capacity(message.len());
    let mut steps = Vec::with_capacity(message.len());
    for (byte_index, byte) in message.bytes().enumerate() {
        let input_value = byte - b'A';
        let arithmetic = arithmetic(input_value);
        let unreduced = arithmetic.evaluate();
        let output_value = unreduced.rem_euclid(26) as u8;
        let output_character = char::from(b'A' + output_value);
        output.push(output_character);
        steps.push(CipherStep {
            byte_index,
            input_character: char::from(byte),
            input_value,
            arithmetic,
            unreduced,
            modulus: 26,
            output_value,
            output_character,
        });
    }
    Ok(CipherResult {
        operation,
        output,
        steps,
    })
}
