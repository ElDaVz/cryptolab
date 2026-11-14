use crypto_core::{CipherResult, CryptoError, Operation, StepArithmetic, affine, caesar, math};
use serde::Serialize;

#[derive(Debug, Serialize, PartialEq)]
#[serde(tag = "code", rename_all_fields = "camelCase")]
pub enum ApiError {
    InvalidRequest {
        field: String,
        reason: &'static str,
    },
    EmptyMessage,
    InvalidCharacter {
        character: char,
        byte_index: usize,
    },
    InvalidAffineKey {
        supplied_a: i32,
        normalized_a: i32,
        gcd: u32,
    },
    InternalError,
}
impl From<CryptoError> for ApiError {
    fn from(value: CryptoError) -> Self {
        match value {
            CryptoError::EmptyMessage => Self::EmptyMessage,
            CryptoError::InvalidCharacter {
                character,
                byte_index,
            } => Self::InvalidCharacter {
                character,
                byte_index,
            },
            CryptoError::InvalidAffineKey {
                supplied_a,
                normalized_a,
                gcd,
            } => Self::InvalidAffineKey {
                supplied_a,
                normalized_a,
                gcd,
            },
            _ => Self::InternalError,
        }
    }
}
#[derive(Debug, Clone, Copy, Serialize, PartialEq)]
pub struct Key {
    pub a: i32,
    pub b: i32,
}
#[derive(Debug, Clone, Copy, Serialize, PartialEq)]
pub struct PartialKey {
    pub a: Option<i32>,
    pub b: Option<i32>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Normalized {
    pub supplied_key: PartialKey,
    pub normalized_key: PartialKey,
}
pub fn normalize(key: PartialKey) -> Result<Normalized, ApiError> {
    Ok(Normalized {
        supplied_key: key,
        normalized_key: PartialKey {
            a: key.a.map(|n| math::modulo(n, 26)).transpose()?,
            b: key.b.map(|n| math::modulo(n, 26)).transpose()?,
        },
    })
}
pub enum Request {
    Caesar {
        operation: Operation,
        message: String,
    },
    Affine {
        operation: Operation,
        message: String,
        key: Key,
    },
}
#[derive(Debug, Serialize)]
#[serde(
    tag = "algorithm",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum CipherValue {
    Caesar {
        cipher: CipherData,
    },
    Affine {
        supplied_key: Key,
        normalized_key: Key,
        inverse: InverseData,
        cipher: CipherData,
    },
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CipherData {
    pub operation: &'static str,
    pub output: String,
    pub steps: Vec<StepData>,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StepData {
    pub byte_index: usize,
    pub input_character: char,
    pub input_value: u8,
    pub arithmetic: Arithmetic,
    pub unreduced: i64,
    pub modulus: i32,
    pub output_value: u8,
    pub output_character: char,
}
#[derive(Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Arithmetic {
    Shift {
        input: u8,
        shift: i32,
    },
    AffineEncrypt {
        input: u8,
        multiplier: i32,
        offset: i32,
    },
    AffineDecrypt {
        input: u8,
        inverse: i32,
        offset: i32,
    },
}
#[derive(Debug, Serialize)]
pub struct EuclideanStepData {
    pub dividend: i64,
    pub divisor: i64,
    pub quotient: i64,
    pub remainder: i64,
}
#[derive(Debug, Serialize)]
pub struct ExtendedGcdData {
    pub gcd: u32,
    pub x: i64,
    pub y: i64,
    pub steps: Vec<EuclideanStepData>,
}
#[derive(Debug, Serialize)]
pub struct InverseData {
    pub inverse: i32,
    pub derivation: ExtendedGcdData,
}
impl From<CipherResult> for CipherData {
    fn from(value: CipherResult) -> Self {
        Self {
            operation: match value.operation {
                Operation::Encrypt => "encrypt",
                Operation::Decrypt => "decrypt",
            },
            output: value.output,
            steps: value
                .steps
                .into_iter()
                .map(|s| StepData {
                    byte_index: s.byte_index,
                    input_character: s.input_character,
                    input_value: s.input_value,
                    arithmetic: match s.arithmetic {
                        StepArithmetic::Shift { input, shift } => {
                            Arithmetic::Shift { input, shift }
                        }
                        StepArithmetic::AffineEncrypt {
                            input,
                            multiplier,
                            offset,
                        } => Arithmetic::AffineEncrypt {
                            input,
                            multiplier,
                            offset,
                        },
                        StepArithmetic::AffineDecrypt {
                            input,
                            inverse,
                            offset,
                        } => Arithmetic::AffineDecrypt {
                            input,
                            inverse,
                            offset,
                        },
                    },
                    unreduced: s.unreduced,
                    modulus: s.modulus,
                    output_value: s.output_value,
                    output_character: s.output_character,
                })
                .collect(),
        }
    }
}
impl From<math::ModularInverseResult> for InverseData {
    fn from(v: math::ModularInverseResult) -> Self {
        Self {
            inverse: v.inverse,
            derivation: ExtendedGcdData {
                gcd: v.derivation.gcd,
                x: v.derivation.x,
                y: v.derivation.y,
                steps: v
                    .derivation
                    .steps
                    .into_iter()
                    .map(|s| EuclideanStepData {
                        dividend: s.dividend,
                        divisor: s.divisor,
                        quotient: s.quotient,
                        remainder: s.remainder,
                    })
                    .collect(),
            },
        }
    }
}
pub fn execute(request: Request) -> Result<CipherValue, ApiError> {
    Ok(match request {
        Request::Caesar { operation, message } => CipherValue::Caesar {
            cipher: match operation {
                Operation::Encrypt => caesar::encrypt(&message)?,
                Operation::Decrypt => caesar::decrypt(&message)?,
            }
            .into(),
        },
        Request::Affine {
            operation,
            message,
            key,
        } => {
            let key = affine::AffineKey { a: key.a, b: key.b };
            let value = match operation {
                Operation::Encrypt => affine::encrypt(&message, key)?,
                Operation::Decrypt => affine::decrypt(&message, key)?,
            };
            CipherValue::Affine {
                supplied_key: Key {
                    a: value.supplied_key.a,
                    b: value.supplied_key.b,
                },
                normalized_key: Key {
                    a: value.normalized_key.a,
                    b: value.normalized_key.b,
                },
                inverse: value.inverse.into(),
                cipher: value.cipher.into(),
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn transport_preserves_domain_vectors_errors_and_partial_normalization() {
        for (input, output, key, operation) in [
            ("ABC", "INS", Key { a: 5, b: 8 }, Operation::Encrypt),
            ("INS", "ABC", Key { a: 31, b: 34 }, Operation::Decrypt),
            (
                "LACLAVEESTAENLOSDISCOS",
                "CDRCDUFFZGDFQCXZYHZRXZ",
                Key { a: 7, b: 3 },
                Operation::Encrypt,
            ),
            (
                "CDRCDUFFZGDFQCXZYHZRXZ",
                "WLNWLGPPDELPYWZDOTDNZD",
                Key { a: 7, b: 4 },
                Operation::Decrypt,
            ),
        ] {
            let value = execute(Request::Affine {
                operation,
                message: input.into(),
                key,
            })
            .unwrap();
            let CipherValue::Affine {
                cipher,
                supplied_key,
                inverse,
                ..
            } = value
            else {
                panic!("wrong algorithm")
            };
            assert_eq!(cipher.output, output);
            assert_eq!(supplied_key, key);
            assert_eq!(cipher.steps.len(), input.len());
            assert_eq!(inverse.derivation.gcd, 1);
        }
        assert_eq!(
            normalize(PartialKey {
                a: Some(2),
                b: None
            })
            .unwrap()
            .normalized_key,
            PartialKey {
                a: Some(2),
                b: None
            }
        );
        assert_eq!(
            execute(Request::Affine {
                operation: Operation::Encrypt,
                message: "".into(),
                key: Key { a: 2, b: 3 }
            })
            .unwrap_err(),
            ApiError::InvalidAffineKey {
                supplied_a: 2,
                normalized_a: 2,
                gcd: 2
            }
        );
    }
    #[test]
    fn dto_keeps_exact_negative_intermediate_and_extreme_keys() {
        let CipherValue::Caesar { cipher } = execute(Request::Caesar {
            operation: Operation::Decrypt,
            message: "A".into(),
        })
        .unwrap() else {
            panic!("wrong algorithm")
        };
        assert_eq!(cipher.steps[0].unreduced, -8);
        let key = Key {
            a: i32::MAX,
            b: i32::MIN,
        };
        let CipherValue::Affine {
            supplied_key,
            normalized_key,
            ..
        } = execute(Request::Affine {
            operation: Operation::Encrypt,
            message: "ABC".into(),
            key,
        })
        .unwrap()
        else {
            panic!("wrong algorithm")
        };
        assert_eq!(supplied_key, key);
        assert_eq!(normalized_key, Key { a: 23, b: 2 });
    }
}
