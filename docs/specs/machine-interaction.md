# Especificación — Máquina e interacción

## 1. Alcance

Primera máquina procedural de Three.js para escritorio: dos anillos concéntricos, un indicador fijo, dos perillas afines y una carcasa sobre una mesa sencilla. Madera, metal y latón, iluminación cálida y fondo discreto; sin modelos externos, habitación explorable ni simulación física. Es un mecanismo didáctico ficticio, no una reproducción de una máquina histórica.

Este documento especifica comportamiento futuro. Se complementa con [Experiencia de escritorio](./desktop-experience.md), [Animaciones](./animation-system.md), [Perspectivas](./perspectives.md) e [Integración WASM](./wasm-integration.md).

## 2. Representación matemática

El anillo interior contiene 26 posiciones con `ABCDEFGHIJKLMNOPQRSTUVWXYZ` en orden. El exterior contiene la salida de aplicar la operación activa a ese alfabeto completo mediante Rust. Cada posición exterior corresponde a la posición interior del mismo índice. Un indicador radial fijo permite leer la pareja seleccionada. Los rótulos distinguen `Entrada` y `Salida`, además del algoritmo y de `Cifrar` o `Descifrar`.

Para seleccionar un carácter, ambos anillos giran juntos hasta colocar su posición de entrada bajo el indicador, conservando la correspondencia entre posiciones. La salida se lee de la tabla Rust; el ángulo nunca determina un resultado criptográfico. La selección de una ocurrencia en el mensaje utiliza su `inputValue` y su paso Rust, aunque una letra aparezca varias veces.

| Operación de referencia | Etiquetas exteriores para A–Z |
| --- | --- |
| César, cifrar | `IJKLMNOPQRSTUVWXYZABCDEFGH` |
| César, descifrar | `STUVWXYZABCDEFGHIJKLMNOPQR` |
| Afín (5,8), cifrar | `INSXCHMRWBGLQVAFKPUZEJOTYD` |
| Afín (5,8), descifrar | `OJEZUPKFAVQLGBWRMHCXSNIDYT` |

Estos vectores proceden de las funciones existentes de `crypto-core`. En afín no se representa la multiplicación como un desplazamiento uniforme del mismo alfabeto: al cambiar la clave, la operación o el contexto se reemplaza la tabla exterior completa por la devuelta por Rust. El giro posterior solo selecciona una pareja de esa tabla.

`experience` obtiene esta tabla con `executeCipher` sobre el alfabeto fijo y la misma configuración autorizada del resultado o borrador. Es una consulta de representación: no crea una instantánea interceptable, no cuenta como intento del ejercicio, no habilita `Enviar clave` ni modifica resultados del usuario. Solo la acción explícita de cifrar del emisor reemplaza la instantánea.

La tabla puede previsualizar una clave válida aun sin mensaje. Se etiqueta `Vista previa de configuración`, sin seleccionar caracteres ni presentar un resultado de mensaje. Una clave vacía, mal formada o no invertible retira la tabla exterior y muestra `Configura una clave válida`; no deja una tabla anterior visible. El anillo de entrada puede permanecer como referencia pública.

## 3. Perillas y campos

En modo afín hay perillas `a · Factor` y `b · Desplazamiento`, cada una con 26 posiciones canónicas, de 0 a 25. Se permite seleccionar factores no invertibles para enseñar el error. En César se ocultan esas perillas y se muestra el desplazamiento público fijo +8; no se permite editarlo.

Cada perilla tiene un campo numérico HTML y botones `Disminuir`/`Aumentar` equivalentes. Los campos aceptan enteros `i32` con signo según el [recorrido](./learning-flow.md). Sus valores suministrados se conservan hasta que el usuario los edita; una previsualización no los sustituye silenciosamente por su forma normalizada.

La normalización necesaria para colocar una perilla procede de `normalizeAffineKey`. Cada campo entero representable obtiene su posición normalizada, incluso cuando el otro esté vacío o `a` sea inválido para cifrar. Para normalizar se representa un campo aún no válido como `null`, sin enviar el texto mal formado como número. Si un campo está vacío o mal formado, su perilla no tiene posición numérica y no se inicializa con una clave privada. Su primer incremento o decremento establece explícitamente 0; el campo pasa a contener `0`.

- Incrementar 25 produce 0; decrementar 0 produce 25. La elección del índice es interacción de un control finito, no una implementación del cifrado. La reducción de claves suministradas se delega a Rust.
- Al mover una perilla, el campo de ese parámetro pasa al valor canónico seleccionado. Por ejemplo, `a=31` se muestra en posición 5; un incremento escribe `6`. El otro campo suministrado no cambia.
- Arrastrar hacia la derecha aumenta y hacia la izquierda disminuye, un paso por cada 12 píxeles horizontales desde el último paso consumido. Usar captura de puntero; terminar en `pointerup`, cancelación, pérdida de captura o salida del contexto. No hay inercia.
- Los campos y sus botones son el equivalente de teclado de la interacción 3D. En el campo, flecha arriba/abajo ejecuta un paso solo con el foco ahí; no se capturan flechas de otras áreas. El lienzo por sí solo no es necesario para editar claves.
- Cada cambio efectivo de clave invalida el cálculo vigente de ese contexto y cancela su reproducción antes de actualizar la representación. No ejecuta automáticamente el mensaje ni crea un intento calificado.

## 4. Contextos y cámaras

| Perspectiva | Encuadre y controles |
| --- | --- |
| Emisor | Tres cuartos frontal izquierdo, incluyendo anillos y controles de su borrador. |
| Interceptor | Tres cuartos frontal derecho, usando exclusivamente el candidato de la fuente activa; nunca conserva rótulos, tabla ni posiciones de la clave original. |
| Mecanismo interno | Acercamiento frontal al indicador y a la pareja seleccionada, con explicación de su traza. Las perillas son de solo lectura y corresponden al cálculo autorizado. |

Los tres encuadres permanecen delante de la cara legible de los anillos. No hay cámara libre, órbita ni zoom manual en esta entrega. Las distancias se ajustan al área libre de paneles para evitar cortar los controles; el encuadre interno es una inspección de la correspondencia matemática, no una simulación física de engranajes ocultos.

Antes de mover la cámara, `experience` entrega la nueva proyección autorizada y retira datos privados del contexto anterior. No se hace fundido entre textos originales y candidatos. Si la nueva fuente no tiene clave o resultado válido, la máquina muestra su estado vacío, no una copia de la configuración anterior.

Las geometrías, materiales, texturas de etiquetas y controles de eventos tienen propietarios explícitos en `machine`; se reutilizan entre pasos y se liberan al reemplazarlos o destruir la escena. Cambiar de perspectiva no crea otra escena ni otro bucle de renderizado.

## 5. Criterios de aceptación

Escenarios para la futura implementación; todavía no ejecutados como pruebas 3D.

| ID | Escenario verificable |
| --- | --- |
| MI-01 | Las cuatro tablas de referencia coinciden con Rust. En afín, cambiar `a` modifica la permutación y no se representa como una rotación uniforme del alfabeto anterior. |
| MI-02 | Para cada uno de los 26 valores de entrada, el indicador alinea su salida Rust en ambas operaciones; letras repetidas seleccionan ocurrencias distintas del mensaje sin alterar la tabla. |
| MI-03 | Campos, botones y arrastre sincronizan las posiciones, incluidos 25→0, 0→25 y `31→posición 5→incremento→6`, sin cambiar el otro parámetro suministrado. |
| MI-04 | Seleccionar `a=2` deja visible la elección, pero retira la tabla exterior y explica el error. Campos candidatos vacíos no reciben la clave original; un primer paso escribe 0 explícitamente. |
| MI-05 | Previsualizar el alfabeto no crea instantáneas, intentos ni envíos habilitados. César no ofrece una clave editable. |
| MI-06 | Cambiar a interceptor retira primero todos los datos originales, incluso durante la transición; cada cámara mantiene sus etiquetas legibles y usa el contexto autorizado. |
| MI-07 | Editar la clave cancela la reproducción; perder captura o cambiar de perspectiva termina el arrastre. La misma edición puede hacerse sin puntero 3D. |
| MI-08 | Repetir selecciones y cambios de perspectiva no acumula escenas, bucles, texturas ni eventos; destruir la escena libera sus recursos. |

## Documentos relacionados

- [Visión](../VISION.md)
- [Arquitectura](../ARCHITECTURE.md)
- [Recorrido de aprendizaje](./learning-flow.md)
- [Perspectivas](./perspectives.md)
- [Escritorio](./desktop-experience.md)
- [Animaciones](./animation-system.md)
- [WASM](./wasm-integration.md)
