# Especificación — Fundamentos matemáticos

## Contrato

El módulo `crypto_core::math` ofrecerá funciones puras con entradas `i32`, sin dependencias externas, coma flotante, navegador ni WASM. Los cálculos intermedios y coeficientes de Bézout usan `i64`; el MCD usa `u32` para representar también `abs(i32::MIN)`.

- `modulo(value, modulus)`: residuo euclídeo `i32` en `0..modulus`; requiere módulo positivo, incluido 1.
- `gcd(a, b)`: MCD no negativo; acepta signos y ceros, con `gcd(0, 0) = 0`.
- `extended_gcd(a, b)`: MCD, coeficientes `x`, `y` que satisfacen `a*x + b*y = gcd(a,b)`, y divisiones ordenadas sobre las magnitudes no negativas de las entradas. Cada división contiene dividendo, divisor, cociente y residuo. Los signos originales se restauran en los coeficientes finales. Para `(0,0)` devuelve coeficientes cero y traza vacía.
- `modular_inverse(value, modulus)`: inverso normalizado y derivación por Euclides extendido sobre las entradas originales; requiere módulo ≥2 y MCD igual a 1.

Los errores serán variantes tipadas de `CryptoError`, con implementación de `Display` y `std::error::Error`: módulo inválido (valor y mínimo requerido) o inverso inexistente (valor, módulo y MCD). Las estructuras públicas serán datos Rust, sin contrato de serialización todavía.

## Criterios de aceptación

1. `modulo(-1,26)=25`, `modulo(i32::MIN,1)=0`; módulos cero y negativos producen error.
2. `gcd(-54,24)=6`, `gcd(0,0)=0`, `gcd(i32::MIN,0)=2147483648`.
3. Todo resultado de Euclides satisface la identidad de Bézout; cada paso cumple `dividendo = cociente*divisor + residuo` y `0 ≤ residuo < divisor`. Las divisiones encadenan sus operandos y terminan en residuo cero cuando el segundo operando no es cero.
4. El inverso de 5 módulo 26 es 21, y el de -5 es 5; 2 módulo 26 no tiene inverso. Los módulos ≤1 producen error al pedir un inverso.
5. Se verifican combinaciones de signos, entradas nulas, extremos `i32` y pares consecutivos de Fibonacci; no hay desbordamientos ni diferencias entre debug y release.

## Documentos relacionados

- [Arquitectura](../ARCHITECTURE.md)
- [Cifrado afín](./cipher-affine.md)
- [Cifrado César](./cipher-caesar.md)
