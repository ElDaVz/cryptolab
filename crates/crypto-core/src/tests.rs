use crate::{
    CipherResult, CryptoError, Operation, StepArithmetic, affine, caesar,
    math::{self, ExtendedGcdResult},
};

const ALPHABET: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

fn assert_derivation(a: i32, b: i32, result: &ExtendedGcdResult) {
    assert_eq!(
        i128::from(a) * i128::from(result.x) + i128::from(b) * i128::from(result.y),
        i128::from(result.gcd)
    );
    assert_eq!(result.gcd, math::gcd(a, b));
    let (mut dividend, mut divisor) = (i64::from(a).abs(), i64::from(b).abs());
    for step in &result.steps {
        assert_eq!((step.dividend, step.divisor), (dividend, divisor));
        assert!(step.divisor > 0);
        assert_eq!(step.dividend, step.quotient * step.divisor + step.remainder);
        assert!((0..step.divisor).contains(&step.remainder));
        (dividend, divisor) = (divisor, step.remainder);
    }
    assert_eq!(divisor, 0);
    assert_eq!(dividend, i64::from(result.gcd));
}

fn assert_cipher_trace(input: &str, result: &CipherResult) {
    assert_eq!(input.len(), result.steps.len());
    assert_eq!(
        result
            .steps
            .iter()
            .map(|step| step.output_character)
            .collect::<String>(),
        result.output
    );
    for ((byte_index, character), step) in input.char_indices().zip(&result.steps) {
        assert_eq!(step.byte_index, byte_index);
        assert_eq!(step.input_character, character);
        assert_eq!(
            u32::from(character) - u32::from('A'),
            u32::from(step.input_value)
        );
        assert_eq!(
            u32::from(step.output_character) - u32::from('A'),
            u32::from(step.output_value)
        );
        let expected = match step.arithmetic {
            StepArithmetic::Shift { input, shift } => {
                assert_eq!(input, step.input_value);
                i64::from(input) + i64::from(shift)
            }
            StepArithmetic::AffineEncrypt {
                input,
                multiplier,
                offset,
            } => {
                assert_eq!(input, step.input_value);
                i64::from(multiplier) * i64::from(input) + i64::from(offset)
            }
            StepArithmetic::AffineDecrypt {
                input,
                inverse,
                offset,
            } => {
                assert_eq!(input, step.input_value);
                i64::from(inverse) * (i64::from(input) - i64::from(offset))
            }
        };
        assert_eq!(step.unreduced, expected);
        assert_eq!(step.modulus, 26);
        assert_eq!(i64::from(step.output_value), expected.rem_euclid(26));
    }
}

#[test]
fn modular_reduction_obeys_domains_and_boundaries() {
    assert_eq!(math::modulo(-1, 26), Ok(25));
    for value in [i32::MIN, -27, -1, 0, 1, 26, i32::MAX] {
        for modulus in [1, 2, 26, i32::MAX] {
            let residue = math::modulo(value, modulus).unwrap();
            assert!((0..modulus).contains(&residue));
            assert_eq!(
                (i64::from(value) - i64::from(residue)) % i64::from(modulus),
                0
            );
        }
        for modulus in [i32::MIN, -1, 0] {
            assert_eq!(
                math::modulo(value, modulus),
                Err(CryptoError::InvalidModulus {
                    modulus,
                    minimum: 1
                })
            );
        }
    }
}

#[test]
fn gcd_known_cases_and_symmetry() {
    for (a, b, expected) in [
        (54, 24, 6),
        (-54, 24, 6),
        (0, 0, 0),
        (0, -7, 7),
        (i32::MIN, 0, 2_147_483_648),
        (i32::MIN, i32::MAX, 1),
    ] {
        assert_eq!(math::gcd(a, b), expected);
        assert_eq!(math::gcd(b, a), expected);
    }
}

#[test]
fn euclidean_derivations_preserve_bezout_and_division_invariants() {
    let values = [
        i32::MIN,
        i32::MIN + 1,
        -1_836_311_903,
        -54,
        -1,
        0,
        1,
        24,
        1_134_903_170,
        1_836_311_903,
        i32::MAX,
    ];
    for a in values {
        for b in values {
            assert_derivation(a, b, &math::extended_gcd(a, b));
        }
    }
    let zero = math::extended_gcd(0, 0);
    assert_eq!((zero.x, zero.y), (0, 0));
    assert!(zero.steps.is_empty());
}

#[test]
fn euclidean_known_steps() {
    let result = math::extended_gcd(26, 5);
    let divisions: Vec<_> = result
        .steps
        .iter()
        .map(|s| (s.dividend, s.divisor, s.quotient, s.remainder))
        .collect();
    assert_eq!(divisions, [(26, 5, 5, 1), (5, 1, 5, 0)]);
    assert_eq!((result.gcd, result.x, result.y), (1, 1, -5));
}

#[test]
fn inverses_have_correct_values_and_derivations() {
    for (value, modulus, expected) in [
        (5, 26, 21),
        (-5, 26, 5),
        (i32::MIN, i32::MAX, i32::MAX - 1),
        (i32::MAX, 26, 17),
    ] {
        let result = math::modular_inverse(value, modulus).unwrap();
        assert_eq!(result.inverse, expected);
        assert_derivation(value, modulus, &result.derivation);
        assert_eq!(
            (i64::from(value) * i64::from(result.inverse)).rem_euclid(i64::from(modulus)),
            1
        );
    }
}

#[test]
fn inverse_rejects_invalid_domains() {
    for modulus in [i32::MIN, -1, 0, 1] {
        assert_eq!(
            math::modular_inverse(5, modulus),
            Err(CryptoError::InvalidModulus {
                modulus,
                minimum: 2
            })
        );
    }
    for (value, modulus, gcd) in [(2, 26, 2), (0, 26, 26), (i32::MIN, 2, 2)] {
        assert_eq!(
            math::modular_inverse(value, modulus),
            Err(CryptoError::NoModularInverse {
                value,
                modulus,
                gcd
            })
        );
    }
}

#[test]
fn inverse_existence_matches_coprimality_for_small_domains() {
    for modulus in 2..=60 {
        for value in -100..=100 {
            match math::modular_inverse(value, modulus) {
                Ok(result) => {
                    assert_eq!(math::gcd(value, modulus), 1);
                    assert!((0..modulus).contains(&result.inverse));
                    assert_eq!(
                        (i64::from(value) * i64::from(result.inverse))
                            .rem_euclid(i64::from(modulus)),
                        1
                    );
                }
                Err(CryptoError::NoModularInverse { gcd, .. }) => {
                    assert!(gcd > 1);
                    assert_eq!(gcd, math::gcd(value, modulus));
                }
                other => panic!("unexpected inverse result: {other:?}"),
            }
        }
    }
}

#[test]
fn caesar_known_vectors_and_round_trip() {
    for (plain, encrypted) in [
        ("ABC", "IJK"),
        ("XYZ", "FGH"),
        (ALPHABET, "IJKLMNOPQRSTUVWXYZABCDEFGH"),
    ] {
        let result = caesar::encrypt(plain).unwrap();
        assert_eq!(result.operation, Operation::Encrypt);
        assert_eq!(result.output, encrypted);
        assert_cipher_trace(plain, &result);
        for step in &result.steps {
            assert_eq!(
                step.arithmetic,
                StepArithmetic::Shift {
                    input: step.input_value,
                    shift: 8
                }
            );
        }
        let decrypted = caesar::decrypt(encrypted).unwrap();
        assert_eq!(decrypted.operation, Operation::Decrypt);
        assert_eq!(decrypted.output, plain);
        assert_cipher_trace(encrypted, &decrypted);
        for step in &decrypted.steps {
            assert_eq!(
                step.arithmetic,
                StepArithmetic::Shift {
                    input: step.input_value,
                    shift: -8
                }
            );
        }
    }
}

#[test]
fn affine_known_vectors_and_inverse_trace() {
    let key = affine::AffineKey { a: 5, b: 8 };
    let encrypted = affine::encrypt("ABC", key).unwrap();
    assert_eq!(encrypted.cipher.output, "INS");
    assert_eq!(encrypted.cipher.operation, Operation::Encrypt);
    assert_eq!(encrypted.supplied_key, key);
    assert_eq!(encrypted.normalized_key, key);
    assert_eq!(encrypted.inverse.inverse, 21);
    assert_derivation(5, 26, &encrypted.inverse.derivation);
    assert_cipher_trace("ABC", &encrypted.cipher);
    assert_eq!(encrypted.cipher.steps[0].unreduced, 8);
    let decrypted = affine::decrypt("INS", key).unwrap();
    assert_eq!(decrypted.cipher.output, "ABC");
    assert_eq!(decrypted.cipher.operation, Operation::Decrypt);
    assert_cipher_trace("INS", &decrypted.cipher);
    // A negative intermediate must be preserved, not replaced by an equivalent formula.
    let negative = affine::decrypt("A", key).unwrap();
    assert_eq!(negative.cipher.steps[0].unreduced, -168);
    assert_eq!(negative.cipher.output, "O");
}

#[test]
fn affine_all_312_valid_keys_are_reversible_and_traces_match_keys() {
    let mut count = 0;
    for a in 0..26 {
        for b in 0..26 {
            let key = affine::AffineKey { a, b };
            if ![1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25].contains(&a) {
                assert!(matches!(
                    affine::encrypt(ALPHABET, key),
                    Err(CryptoError::InvalidAffineKey { .. })
                ));
                assert!(matches!(
                    affine::decrypt(ALPHABET, key),
                    Err(CryptoError::InvalidAffineKey { .. })
                ));
                continue;
            }
            count += 1;
            let encrypted = affine::encrypt(ALPHABET, key).unwrap();
            let decrypted = affine::decrypt(&encrypted.cipher.output, key).unwrap();
            assert_eq!(decrypted.cipher.output, ALPHABET);
            assert_cipher_trace(ALPHABET, &encrypted.cipher);
            assert_cipher_trace(&encrypted.cipher.output, &decrypted.cipher);
            assert_derivation(a, 26, &encrypted.inverse.derivation);
            let mut permutation: Vec<_> = encrypted.cipher.output.bytes().collect();
            permutation.sort_unstable();
            assert_eq!(permutation, ALPHABET.as_bytes());
            for step in &encrypted.cipher.steps {
                assert_eq!(
                    step.arithmetic,
                    StepArithmetic::AffineEncrypt {
                        input: step.input_value,
                        multiplier: a,
                        offset: b
                    }
                );
            }
            for step in &decrypted.cipher.steps {
                assert_eq!(
                    step.arithmetic,
                    StepArithmetic::AffineDecrypt {
                        input: step.input_value,
                        inverse: encrypted.inverse.inverse,
                        offset: b
                    }
                );
            }
        }
    }
    assert_eq!(count, 312);
}

#[test]
fn equivalent_and_extreme_keys_preserve_supplied_values() {
    for key in [
        affine::AffineKey { a: 31, b: 34 },
        affine::AffineKey { a: -21, b: -18 },
        affine::AffineKey {
            a: i32::MAX,
            b: i32::MIN,
        },
    ] {
        let normalized = affine::AffineKey {
            a: key.a.rem_euclid(26),
            b: key.b.rem_euclid(26),
        };
        let encrypted = affine::encrypt(ALPHABET, key).unwrap();
        assert_eq!(encrypted.supplied_key, key);
        assert_eq!(encrypted.normalized_key, normalized);
        assert_eq!(
            encrypted.cipher,
            affine::encrypt(ALPHABET, normalized).unwrap().cipher
        );
        let decrypted = affine::decrypt(&encrypted.cipher.output, key).unwrap();
        assert_eq!(decrypted.supplied_key, key);
        assert_eq!(decrypted.normalized_key, normalized);
        assert_eq!(decrypted.cipher.output, ALPHABET);
    }
    for a in [2, 0, 26, -24, i32::MIN] {
        let key = affine::AffineKey { a, b: 3 };
        let expected = CryptoError::InvalidAffineKey {
            supplied_a: a,
            normalized_a: a.rem_euclid(26),
            gcd: math::gcd(a, 26),
        };
        assert_eq!(affine::encrypt("ABC", key), Err(expected.clone()));
        assert_eq!(affine::decrypt("INS", key), Err(expected));
    }
}

#[test]
fn all_cipher_entrypoints_reject_empty_and_invalid_messages() {
    let key = affine::AffineKey { a: 5, b: 8 };
    for message in [
        "", "a", "AB C", "AB!", "AB1", "ABéZ", "AB🦀", "Ñ", "AB\n", "AB\0", "ABé!",
    ] {
        let expected = if message.is_empty() {
            CryptoError::EmptyMessage
        } else {
            let (byte_index, character) = message
                .char_indices()
                .find(|(_, c)| !c.is_ascii_uppercase())
                .unwrap();
            CryptoError::InvalidCharacter {
                character,
                byte_index,
            }
        };
        assert_eq!(caesar::encrypt(message), Err(expected.clone()));
        assert_eq!(caesar::decrypt(message), Err(expected.clone()));
        assert_eq!(affine::encrypt(message, key), Err(expected.clone()));
        assert_eq!(affine::decrypt(message, key), Err(expected));
    }
}

#[test]
fn invalid_affine_key_takes_precedence_over_invalid_message() {
    for message in ["", "bad", "ABC"] {
        for result in [
            affine::encrypt(message, affine::AffineKey { a: 2, b: 3 }),
            affine::decrypt(message, affine::AffineKey { a: 2, b: 3 }),
        ] {
            assert_eq!(
                result,
                Err(CryptoError::InvalidAffineKey {
                    supplied_a: 2,
                    normalized_a: 2,
                    gcd: 2
                })
            );
        }
    }
}
