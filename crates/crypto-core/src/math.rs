//! Exact signed-integer helpers, with structured Euclidean derivations.

use crate::CryptoError;

/// One division over nonnegative magnitudes in Euclid's algorithm.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EuclideanStep {
    /// Nonnegative dividend.
    pub dividend: i64,
    /// Positive divisor.
    pub divisor: i64,
    /// Integer quotient.
    pub quotient: i64,
    /// Remainder in `0..divisor`.
    pub remainder: i64,
}

/// Bézout identity and its ordered division trace for the original signed inputs.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExtendedGcdResult {
    /// Nonnegative greatest common divisor.
    pub gcd: u32,
    /// Coefficient of the first input.
    pub x: i64,
    /// Coefficient of the second input.
    pub y: i64,
    /// Divisions over input magnitudes, including the terminating zero remainder.
    pub steps: Vec<EuclideanStep>,
}

/// A normalized multiplicative inverse and its Bézout derivation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ModularInverseResult {
    /// Unique inverse in `0..modulus`.
    pub inverse: i32,
    /// Extended Euclid applied to the original value and modulus.
    pub derivation: ExtendedGcdResult,
}

/// Returns the least nonnegative residue, accepting modulus 1.
///
/// # Errors
/// Returns [`CryptoError::InvalidModulus`] for a nonpositive modulus.
pub fn modulo(value: i32, modulus: i32) -> Result<i32, CryptoError> {
    if modulus < 1 {
        return Err(CryptoError::InvalidModulus {
            modulus,
            minimum: 1,
        });
    }
    Ok(value.rem_euclid(modulus))
}

/// Returns a nonnegative GCD, with `gcd(0, 0) = 0`.
///
/// The unsigned result can represent `abs(i32::MIN)`.
pub fn gcd(a: i32, b: i32) -> u32 {
    let (mut dividend, mut divisor) = (a.unsigned_abs(), b.unsigned_abs());
    while divisor != 0 {
        (dividend, divisor) = (divisor, dividend % divisor);
    }
    dividend
}

/// Returns `a*x + b*y = gcd(a,b)` and divisions on the input magnitudes.
///
/// For `(0,0)`, both coefficients are zero and the trace is empty. Widening
/// before taking magnitudes handles `i32::MIN`; i64 also fits the coefficient
/// recurrence for i32 inputs. Original signs are restored after division.
pub fn extended_gcd(a: i32, b: i32) -> ExtendedGcdResult {
    let (mut dividend, mut divisor) = (i64::from(a).abs(), i64::from(b).abs());
    let (mut old_x, mut x) = (1_i64, 0_i64);
    let (mut old_y, mut y) = (0_i64, 1_i64);
    let mut steps = Vec::new();

    while divisor != 0 {
        let quotient = dividend / divisor;
        let remainder = dividend % divisor;
        steps.push(EuclideanStep {
            dividend,
            divisor,
            quotient,
            remainder,
        });
        (dividend, divisor) = (divisor, remainder);
        (old_x, x) = (x, old_x - quotient * x);
        (old_y, y) = (y, old_y - quotient * y);
    }

    ExtendedGcdResult {
        gcd: dividend as u32,
        x: old_x * i64::from(a.signum()),
        y: old_y * i64::from(b.signum()),
        steps,
    }
}

/// Finds the inverse of a signed value, including its Euclidean derivation.
///
/// # Errors
/// Requires modulus ≥2; returns [`CryptoError::NoModularInverse`] when inputs
/// are not coprime. The returned inverse is always normalized.
pub fn modular_inverse(value: i32, modulus: i32) -> Result<ModularInverseResult, CryptoError> {
    if modulus < 2 {
        return Err(CryptoError::InvalidModulus {
            modulus,
            minimum: 2,
        });
    }
    let derivation = extended_gcd(value, modulus);
    if derivation.gcd != 1 {
        return Err(CryptoError::NoModularInverse {
            value,
            modulus,
            gcd: derivation.gcd,
        });
    }
    let inverse = derivation.x.rem_euclid(i64::from(modulus)) as i32;
    Ok(ModularInverseResult {
        inverse,
        derivation,
    })
}
