use std::{error::Error, fmt};

/// Invalid mathematical parameters or text; operations never return partial text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CryptoError {
    /// A modulus is smaller than the operation's required minimum.
    InvalidModulus {
        /// Supplied modulus.
        modulus: i32,
        /// One for reduction, two for modular inverse.
        minimum: i32,
    },
    /// The value is not coprime with the modulus.
    NoModularInverse {
        /// Supplied value.
        value: i32,
        /// Supplied modulus.
        modulus: i32,
        /// Greatest common divisor.
        gcd: u32,
    },
    /// The affine multiplier is not invertible modulo 26.
    InvalidAffineKey {
        /// Multiplier before normalization.
        supplied_a: i32,
        /// Multiplier reduced modulo 26.
        normalized_a: i32,
        /// Greatest common divisor of the multiplier and 26.
        gcd: u32,
    },
    /// Ciphers require at least one letter.
    EmptyMessage,
    /// First character outside ASCII A–Z.
    InvalidCharacter {
        /// Unsupported Unicode scalar value.
        character: char,
        /// Zero-based UTF-8 byte offset within the supplied text.
        byte_index: usize,
    },
}

impl fmt::Display for CryptoError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidModulus { modulus, minimum } => {
                write!(formatter, "modulus {modulus} must be at least {minimum}")
            }
            Self::NoModularInverse {
                value,
                modulus,
                gcd,
            } => {
                write!(
                    formatter,
                    "{value} has no inverse modulo {modulus}: gcd is {gcd}"
                )
            }
            Self::InvalidAffineKey {
                supplied_a,
                normalized_a,
                gcd,
            } => {
                write!(
                    formatter,
                    "affine multiplier {supplied_a} (normalized to {normalized_a}) is not invertible modulo 26: gcd is {gcd}"
                )
            }
            Self::EmptyMessage => formatter.write_str("message must not be empty"),
            Self::InvalidCharacter {
                character,
                byte_index,
            } => {
                write!(
                    formatter,
                    "invalid character {character:?} at byte {byte_index}; expected ASCII A–Z"
                )
            }
        }
    }
}

impl Error for CryptoError {}
