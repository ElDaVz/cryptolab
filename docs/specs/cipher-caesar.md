# Especificación — Cifrado César

## Definición y dominios

El cifrado educativo usa exclusivamente cadenas no vacías de letras ASCII `A`–`Z`, con `A=0,…,Z=25`. La salida pertenece al mismo dominio. El desplazamiento es fijo, no configurable: ocho posiciones hacia adelante para cifrar y ocho hacia atrás para descifrar, con vuelta al inicio del alfabeto.

```text
E(x) = (x + 8) mod 26
D(y) = (y - 8) mod 26
```

`crypto_core::caesar::encrypt(message)` y `decrypt(message)` devolverán `Result<CipherResult, CryptoError>`. Se rechaza la cadena vacía con `EmptyMessage`; se rechaza el primer carácter no permitido con `InvalidCharacter`, incluyendo el carácter y su desplazamiento de byte UTF-8 desde cero. No se normalizan ni omiten caracteres ni se devuelven resultados parciales.

## Resultado y trazas

El resultado contiene operación (`Encrypt`/`Decrypt`), salida y pasos ordenados por carácter. Cada paso contiene índice de byte, carácter/valor de entrada y salida, y una operación aritmética tipada con los operandos, módulo, valor entero antes del módulo y residuo. En descifrado el operando de desplazamiento es -8. No se calcula ninguna transformación en TypeScript ni en animaciones.

Las estructuras comunes se comparten con el [cifrado afín](./cipher-affine.md). No se fija todavía un contrato de serialización ni de perspectivas. Estas trazas son datos internos educativos y no constituyen una proyección para el interceptor.

## Criterios de aceptación

1. `ABC → IJK` y `XYZ → FGH`; se verifican también los descifrados conocidos.
2. Cifrar y descifrar el alfabeto completo recupera la entrada original.
3. La cadena vacía, minúsculas, espacios, signos, dígitos, acentos y otros caracteres Unicode producen errores explícitos en ambas operaciones.
4. Cada paso cumple la fórmula correspondiente y la concatenación de sus caracteres de salida coincide con el resultado. Se verifica especialmente la resta negativa durante el descifrado.
5. La API no acepta claves o desplazamientos alternativos.

## Límites

César es vulnerable al criptoanálisis y no proporciona seguridad moderna. Esta implementación es exclusivamente educativa. WASM, interfaz, animaciones y contratos detallados de perspectivas quedan fuera de este incremento.

## Documentos relacionados

- [Visión](../VISION.md)
- [Arquitectura](../ARCHITECTURE.md)
- [Fundamentos matemáticos](./math-foundations.md)
