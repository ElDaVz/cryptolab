# Especificación — Cifrado afín

**Identificador:** SPEC-CRYPTO-001

## 1. Propósito

Implementar el cifrado afín como algoritmo educativo para demostrar el uso de aritmética modular, congruencias, máximo común divisor e inversos modulares.

La implementación debe permitir cifrar, descifrar y generar trazas matemáticas verificables.

## 2. Definición matemática

Se utilizará inicialmente el alfabeto latino de 26 letras mayúsculas, sin caracteres adicionales.

Cada letra se representará mediante un entero entre 0 y 25:

A = 0, B = 1, ..., Z = 25.

### Cifrado

E(x) = (ax + b) mod 26

Donde:

- `x` es el valor numérico del carácter.
- `a` es el factor multiplicativo.
- `b` es el desplazamiento.
- `26` es el módulo correspondiente al alfabeto.

### Condición de validez

La clave multiplicativa deberá satisfacer:

gcd(a, 26) = 1

### Descifrado

D(y) = a⁻¹(y - b) mod 26

Donde `a⁻¹` representa el inverso multiplicativo modular de `a` respecto de 26.

## 3. Requisitos funcionales

### RF-001 — Validación de claves

El sistema deberá verificar que `a` sea coprimo con 26.

Si no se cumple la condición, deberá devolver un error estructurado.

### RF-002 — Cifrado

El sistema deberá aceptar un mensaje válido y una clave `(a, b)`.

Deberá devolver el mensaje cifrado utilizando la transformación afín.

### RF-003 — Descifrado

El sistema deberá recuperar el mensaje original mediante el inverso modular correspondiente.

### RF-004 — Trazabilidad

El sistema deberá proporcionar, para cada carácter procesado:

- Carácter original.
- Representación numérica.
- Parámetros utilizados.
- Operación modular.
- Resultado numérico.
- Carácter resultante.

### RF-005 — Manejo de entradas

En la primera versión, únicamente se aceptarán letras ASCII mayúsculas de A a Z.

Las entradas que contengan caracteres fuera de ese conjunto deberán producir un error de validación.

La normalización de minúsculas, espacios, signos y caracteres acentuados queda pendiente de una especificación posterior.

### RF-006 — Claves equivalentes

Los parámetros enteros `i32` se normalizarán módulo 26, incluidos valores negativos y extremos. La validación de coprimalidad utiliza el valor normalizado de `a`.

La normalización deberá producir resultados consistentes para claves equivalentes.

### RF-007 — Contrato Rust y validación

`crypto_core::affine::encrypt(message, key)` y `decrypt(message, key)` aceptarán una cadena y `AffineKey { a: i32, b: i32 }`, y devolverán `Result<AffineResult, CryptoError>`. Se valida primero la clave: una clave no invertible produce `InvalidAffineKey` con el factor suministrado, el normalizado y su MCD con 26. Después se rechaza la cadena vacía con `EmptyMessage`, o el primer carácter inválido con `InvalidCharacter` (carácter y desplazamiento de byte UTF-8 desde cero). No habrá resultados parciales. Los errores implementarán `Display` y `std::error::Error`.

### RF-008 — Datos educativos

`AffineResult` conserva la clave suministrada y la normalizada, el inverso de `a` normalizado, su derivación por Euclides extendido (una vez por operación) y un `CipherResult` común con César: operación, salida y pasos ordenados por carácter.

Cada paso registra índice de byte, carácter y valor de entrada/salida, y una operación tipada con operandos, módulo, valor entero antes del módulo y residuo. En cifrado representa `(a*x+b)`; en descifrado representa `a⁻¹*(y-b)` sin sustituirla por otra fórmula. Los intermedios usan `i64`. Estos datos son internos, sin serialización ni proyección para el interceptor en este incremento.

## 4. Requisitos no funcionales

- La implementación deberá utilizar aritmética entera exacta.
- No deberá depender del navegador.
- No deberá depender de Three.js.
- Deberá permitir pruebas unitarias independientes.
- Los errores deberán ser explícitos.
- Las trazas deberán ser estructuradas y verificables.

## 5. Criterios de aceptación

### CA-001 — Cifrado conocido

Dado:

- Mensaje: `ABC`
- Clave: `(5, 8)`

El resultado deberá ser:

`INS`

### CA-002 — Descifrado conocido

Dado:

- Mensaje cifrado: `INS`
- Clave: `(5, 8)`

El resultado deberá ser:

`ABC`

### CA-003 — Clave inválida

Dada la clave `(2, 3)`, el sistema deberá rechazar la operación porque:

gcd(2, 26) = 2

Por tanto, el factor multiplicativo no tiene inverso modular.

### CA-004 — Propiedad de reversibilidad

Para cualquier mensaje válido `m` y cualquier clave válida `k`:

decrypt(encrypt(m, k), k) = m

### CA-005 — Trazabilidad matemática

Para el carácter `A` y la clave `(5, 8)`, la traza deberá representar:

- A → 0
- (5 × 0 + 8) mod 26 = 8
- 8 → I

### CA-006 — Entradas inválidas

Un mensaje que contenga caracteres fuera del alfabeto admitido deberá producir un error explícito y no un resultado parcial silencioso.

### CA-007 — Casos límite y normalización

Se rechazan mensajes vacíos. Se verifica la prioridad del error de clave sobre el error de mensaje, y el primer carácter inválido con su índice de byte. `(31,34)` y `(-21,-18)` producen los mismos resultados que `(5,8)` conservando sus claves suministradas. Se prueban claves con extremos `i32`.

### CA-008 — Cobertura exhaustiva y derivación

Se verifica reversibilidad del alfabeto completo para las 312 claves normalizadas válidas, rechazo de los restantes factores, consistencia de cada paso de cifrado/descifrado y la identidad de Bézout de la derivación del inverso.

## 6. Integración visual

El frontend podrá representar cada transformación mediante:

- Posicionamiento de discos.
- Movimiento de indicadores.
- Visualización de valores numéricos.
- Presentación de congruencias.
- Animación del carácter de salida.

La representación visual deberá consumir la traza producida por Rust.

No deberá recalcular el resultado criptográfico.

La secuencia visual será coordinada por AnimationDirector,
utilizando las trazas estructuradas generadas por Rust.

Las animaciones deberán conservar la correspondencia
entre cada operación matemática y su representación visual.

La estrategia de animación se define en
[Arquitectura de software](../ARCHITECTURE.md).

## 7. Perspectivas

### Emisor

Podrá observar el mensaje original, la clave y el resultado cifrado.

### Interceptor

Podrá observar el mensaje cifrado y experimentar con técnicas de recuperación de claves.

No recibirá directamente la clave original mediante el contrato de esta perspectiva.

### Interior

Podrá representar la secuencia de operaciones matemáticas para explicar el algoritmo.

## 8. Pruebas requeridas

- Cifrado con vectores conocidos.
- Descifrado con vectores conocidos.
- Rechazo de claves inválidas.
- Normalización de claves equivalentes.
- Verificación de inversos modulares.
- Reversibilidad para mensajes válidos.
- Validación de caracteres no admitidos.
- Consistencia entre resultados y trazas.

## 9. Limitaciones

El cifrado afín es vulnerable a técnicas de criptoanálisis y no debe utilizarse para proteger información real.

La implementación se desarrollará exclusivamente con fines educativos.

## 10. Dependencias

Esta especificación requiere operaciones matemáticas correctas de:

- Aritmética modular.
- Máximo común divisor.
- Algoritmo de Euclides extendido.
- Inverso modular.

Estas operaciones deberán implementarse y verificarse antes de completar el cifrado afín.

Su contrato se define en [Fundamentos matemáticos](./math-foundations.md). El incremento Rust puede completarse y verificarse por separado; la finalización de toda la funcionalidad sigue requiriendo la integración visual descrita en este documento.

## 11. Condición de finalización

La funcionalidad estará completa cuando se satisfagan todos los criterios de aceptación, las pruebas automatizadas sean satisfactorias y la integración visual represente correctamente los resultados matemáticos.

## Documentos relacionados

- [Visión del proyecto](../VISION.md)
- [Arquitectura técnica](../ARCHITECTURE.md)
- [Instrucciones para agentes](../../AGENTS.md)
