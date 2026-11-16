# Especificación — Máquina e interacción

## 1. Alcance

Máquina procedural de Three.js para escritorio: dos discos sobre un mismo eje, un indicador de lectura, dos perillas para el modo afín avanzado y una carcasa sobre una mesa sencilla. Madera, metal y latón, iluminación cálida y fondo discreto; sin modelos externos, habitación explorable ni simulación física. Es un mecanismo didáctico ficticio, no una reproducción de una máquina histórica.

Este contrato incorpora la siguiente iteración acordada. La demo existente aún usa anillos concéntricos; la apertura y las etapas afines requieren implementación. El estado y la evidencia de cada incremento se registran en [Implementación](../IMPLEMENTATION.md) y [Backlog](../BACKLOG.md); los criterios siguientes no declaran pruebas ejecutadas. Se complementa con [Experiencia de escritorio](./desktop-experience.md), [Animaciones](./animation-system.md), [Perspectivas](./perspectives.md) e [Integración WASM](./wasm-integration.md).

## 2. Representación matemática

César es el recorrido principal, siempre con +8 público y fijo. El disco trasero contiene el alfabeto de referencia `ABCDEFGHIJKLMNOPQRSTUVWXYZ`; el delantero, el alfabeto cifrado desplazado. Al abrir se separan sobre el mismo eje, con una distancia y encuadre que permitan comparar ambas inscripciones sin ocultamientos. Los rótulos `Referencia A–Z` y `Alfabeto cifrado · +8` distinguen sus funciones, además del algoritmo y de `Cifrar` o `Descifrar`.

La pareja física conserva el sentido referencia → cifrado. Cifrar lee de referencia a cifrado; descifrar recorre la misma pareja en sentido inverso, sin convertir el disco delantero en un alfabeto de texto claro. Las parejas se obtienen de las tablas Rust autorizadas: en descifrado, su entrada es el carácter cifrado y su salida la referencia. Reordenar esas parejas para presentarlas no autoriza calcular cifrados en TypeScript.

Un indicador inequívoco identifica ambos caracteres y su sentido de lectura. Se distingue el desplazamiento relativo fijo de ocho posiciones del giro de selección: seleccionar otra letra conserva todas las parejas y no cambia la clave. En el resultado, la selección utiliza la ocurrencia y los valores del paso Rust.

Para seleccionar un carácter se mueve el conjunto conservando la correspondencia. La posición de presentación se obtiene de la pareja autorizada, atendiendo al sentido de lectura. La salida se lee de la tabla Rust; el ángulo nunca determina un resultado criptográfico. Las letras repetidas mantienen selecciones de ocurrencia independientes. Las siguientes tablas son vectores de entrada/salida para A–Z, no una ordenación física obligatoria de los discos:

| Operación de referencia | Salidas Rust para entradas A–Z |
| --- | --- |
| César, cifrar | `IJKLMNOPQRSTUVWXYZABCDEFGH` |
| César, descifrar | `STUVWXYZABCDEFGHIJKLMNOPQR` |
| Afín (5,8), cifrar | `INSXCHMRWBGLQVAFKPUZEJOTYD` |
| Afín (5,8), descifrar | `OJEZUPKFAVQLGBWRMHCXSNIDYT` |

Estos vectores proceden de las funciones existentes de `crypto-core`. Afín permanece como modo avanzado: su tabla completa cambia con la clave y operación autorizadas; un giro solo selecciona una correspondencia, nunca explica la multiplicación.

Su representación por etapas muestra, al cifrar, multiplicación, desplazamiento y reducción módulo 26; al descifrar, resta, multiplicación por el inverso y reducción. Utiliza los operandos, el valor antes de reducir y el residuo de la traza Rust, en ese orden. Una etapa puede mostrar una expresión sin resolver si la traza no contiene su resultado intermedio; no se añade aritmética criptográfica en TypeScript para completarla. La ecuación textual completa y la clave suministrada/normalizada siguen disponibles. Las etapas son presentación del carácter seleccionado, no nuevas operaciones ni intentos.

`experience` obtiene esta tabla con `executeCipher` sobre el alfabeto fijo y la misma configuración autorizada del resultado o borrador. Es una consulta de representación: no crea una instantánea interceptable, no cuenta como intento del ejercicio, no habilita `Enviar clave` ni modifica resultados del usuario. Solo la acción explícita de cifrar del emisor reemplaza la instantánea.

La tabla puede previsualizar una clave válida aun sin mensaje. Se etiqueta `Vista previa de configuración`, sin seleccionar caracteres ni presentar un resultado de mensaje. Una clave vacía, mal formada o no invertible retira las etiquetas cifradas dependientes de esa clave y muestra `Configura una clave válida`; no deja una tabla anterior visible. El alfabeto de referencia puede permanecer como información pública.

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
| Emisor | Tres cuartos frontal izquierdo; comienza cerrado y dispone de `Abrir máquina` / `Cerrar máquina`. La elección se conserva al volver al emisor durante la sesión. |
| Interceptor | Tres cuartos frontal derecho; siempre cerrado, sin control para abrir en esta perspectiva. Usa exclusivamente el candidato de la fuente activa, sin rótulos, tabla ni posiciones originales. |
| Mecanismo interno | Ambos discos abiertos y visibles, indicador y explicación de la traza autorizada. Perillas de solo lectura; desde un intento, muestra exclusivamente ese candidato. Sin resultado, conserva un estado vacío sin datos privados. |

Los tres encuadres permanecen delante de la cara legible de los anillos. No hay cámara libre, órbita ni zoom manual en esta entrega. Las distancias se ajustan al área libre de paneles para evitar cortar los controles; la separación axial ilustra la correspondencia matemática, sin simulación física detallada. Los rótulos y las letras deben seguir legibles con la máquina abierta y cerrada.

Antes de mover la cámara, `experience` entrega la nueva proyección autorizada y retira datos privados del contexto anterior. No se hace fundido entre textos originales y candidatos. Si la nueva fuente no tiene clave o resultado válido, la máquina muestra su estado vacío, no una copia de la configuración anterior.

Las geometrías, materiales, texturas de etiquetas y controles de eventos tienen propietarios explícitos en `machine`; se reutilizan entre pasos y se liberan al reemplazarlos o destruir la escena. Cambiar de perspectiva no crea otra escena ni otro bucle de renderizado.

## 5. Criterios de aceptación

Criterios normativos; consultar la evidencia por incremento antes de considerar cualquiera verificado. Los escenarios MI-09 a MI-14 cubren la nueva iteración y no quedan acreditados por las pruebas históricas de anillos.

### Legibilidad de etiquetas

Las 26 letras completas usan un área cuadrada ajustada al glifo, tipografía sans serif en negrita y fondo opaco oscuro con texto claro de contraste mínimo 4.5:1. No se reduce una letra aislada dentro de una textura panorámica con grandes márgenes vacíos. Los rótulos largos usan ancho medido y conservan la proporción de su textura al representarse. Los colores de texto se interpretan como sRGB y no cambian con la exposición de los materiales de la escena.

Las comprobaciones de métricas, proporción y recursos no sustituyen la evaluación humana. Revisar todas las letras, especialmente I/M/W, en los encuadres de emisor, interceptor e interior a 1280×720 y 1920×1080: deben leerse completas, contrastadas y sin solapamientos. La apertura deberá repetir esta revisión al implementarse. No capturar imágenes, vídeo ni trazas con imágenes.

### Escenarios

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
| MI-09 | En ambos tamaños de escritorio, métricas de glifos sin recorte, proporción correcta y contraste ≥4.5:1; revisión humana de todas las letras sin ocultamientos ni solapamientos. |
| MI-10 | Una sesión nueva abre el emisor cerrado; su control alterna apertura/cierre sin cambiar claves, resultados ni selección. Interior abre ambos discos; interceptor permanece cerrado. |
| MI-11 | En César, A → I y X → F, y en descifrado I → A y F → X; seleccionar otra ocurrencia conserva el desplazamiento relativo +8 y la orientación referencia/cifrado. |
| MI-12 | Ir del emisor abierto al interceptor retira sus datos antes de cerrar/mover la cámara; abrir el interior de un intento muestra solo las parejas y trazas de ese candidato. |
| MI-13 | Afín (5,8) presenta las tres etapas en el orden correspondiente al cifrado/descifrado y sus datos coinciden con Rust; no presenta una rotación uniforme como multiplicación. |
| MI-14 | Apertura/cierre y selección funcionan con HTML/teclado y sin WebGL; cancelar o reducir movimiento asienta el estado autorizado sin callbacks antiguos ni pérdida de resultados. |

## Documentos relacionados

- [Visión](../VISION.md)
- [Arquitectura](../ARCHITECTURE.md)
- [Recorrido de aprendizaje](./learning-flow.md)
- [Perspectivas](./perspectives.md)
- [Escritorio](./desktop-experience.md)
- [Animaciones](./animation-system.md)
- [WASM](./wasm-integration.md)
