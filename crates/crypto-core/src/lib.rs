//! Exact integer mathematics and classical ciphers for education.
//!
//! These ciphers do not provide modern security. Results and traces are domain
//! data, independent of rendering, WebAssembly, and perspective projections.
//!
//! ```
//! use crypto_core::{affine, caesar};
//!
//! let key = affine::AffineKey { a: 5, b: 8 };
//! let encrypted = affine::encrypt("ABC", key)?;
//! assert_eq!(encrypted.cipher.output, "INS");
//! assert_eq!(affine::decrypt("INS", key)?.cipher.output, "ABC");
//! assert_eq!(caesar::encrypt("XYZ")?.output, "FGH");
//! # Ok::<(), crypto_core::CryptoError>(())
//! ```

#![forbid(unsafe_code)]
#![deny(missing_docs)]

pub mod affine;
pub mod caesar;
mod cipher;
mod error;
pub mod math;

pub use cipher::{CipherResult, CipherStep, Operation, StepArithmetic};
pub use error::CryptoError;

#[cfg(test)]
mod tests;
