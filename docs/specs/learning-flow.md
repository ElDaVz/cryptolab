# Especificación — Recorrido de aprendizaje y sesión

## 1. Propósito y alcance

Definir el recorrido inicial en español: una introducción guiada que se puede omitir o repetir, un laboratorio libre y un ejercicio introductorio de criptoanálisis afín. Esta especificación define comportamiento futuro; no indica que exista ya una interfaz implementada.

Los contratos de información por vista se establecen en [Perspectivas](./perspectives.md). Los cálculos, validaciones y trazas proceden exclusivamente del núcleo Rust, según [César](./cipher-caesar.md), [Afín](./cipher-affine.md) y [Fundamentos matemáticos](./math-foundations.md).

Este incremento documental no define serialización WASM, diseño visual, componentes 3D ni reproducción de animaciones. No añade persistencia, historial de intentos, resolución automática ni análisis de frecuencias. Los cifrados se presentan exclusivamente como herramientas educativas, sin seguridad moderna.

## 2. Entrada e introducción

Cada carga de la aplicación inicia una sesión nueva en el primer paso de la introducción. No se guarda progreso en almacenamiento local, cookies ni servicios remotos.

La introducción utiliza ejemplos propios, separados del laboratorio y del ejercicio. Ofrece `Anterior`, `Siguiente` y `Omitir introducción`; el primer paso no tiene anterior y el último ofrece `Abrir laboratorio`. Avanzar depende de la navegación explícita, sin exigir respuestas correctas ni esperar animaciones. Cada paso presenta el ejemplo y permite consultar su explicación matemática.

| Paso | Contenido y resultado esperado |
| --- | --- |
| 1. Letras y números | Alfabeto ASCII `A`–`Z`, con `A=0`, `B=1`, …, `Z=25`. Explicar que los mensajes del núcleo no incluyen espacios, acentos ni minúsculas. |
| 2. Desplazamiento César | Cifrar `ABCXYZ` con +8 para obtener `IJKFGH`; explicar especialmente `X=23 → (23+8) mod 26=5 → F`. El desplazamiento es conocido y fijo. |
| 3. Transformación afín | Cifrar `ABC` con `(5,8)` para obtener `INS`. Mostrar `gcd(5,26)=1` y contrastarlo con el rechazo de `(2,3)`, cuyo factor no tiene inverso. |
| 4. Recuperar el mensaje | Descifrar `INS` con `(5,8)` para recuperar `ABC`; explicar el inverso `21`, la identidad de Bézout y `21×(y−8) mod 26`, usando la derivación y las trazas de Rust. |

Al terminar u omitir la introducción inicial se abre el laboratorio en la perspectiva del emisor, con mensaje vacío, César seleccionado y operación de cifrado. Al seleccionar afín por primera vez, los campos de clave parten de `(5,8)`. Un mensaje vacío es un borrador permitido, pero ejecutarlo produce el error del núcleo.

`Repetir introducción` está disponible desde el laboratorio y vuelve al paso 1. Al terminarla u omitirla se restaura la perspectiva, la fuente y el trabajo que estaban activos antes de repetirla; sus ejemplos nunca reemplazan mensajes, claves, resultados, intentos ni el estado del ejercicio.

## 3. Laboratorio del emisor

El emisor puede elegir César o afín, introducir un mensaje y ejecutar `Cifrar` o `Descifrar`. César no tiene campo de clave configurable. Afín acepta parámetros enteros con signo dentro de `i32`, conserva los suministrados y muestra su forma normalizada tras una operación válida.

Los formularios no convierten automáticamente mensajes a mayúsculas ni eliminan espacios o acentos. Los campos de clave vacíos, no enteros o fuera de `i32` deben indicar un error de entrada y no ejecutar la operación. Una vez representables las entradas, el núcleo determina los errores de dominio, incluida la prioridad de clave inválida sobre mensaje inválido en afín. Los errores se explican en español y conservan los datos estructurados del núcleo.

| Acción | Efecto en el estado |
| --- | --- |
| Editar mensaje, clave, algoritmo u operación | Conservar el borrador e invalidar resultado, traza y error anteriores de la operación actual. Cambiar de algoritmo conserva el mensaje y los últimos campos afines, aunque César no los utiliza. |
| Operación válida | Asociar resultado y traza a las entradas exactas que los produjeron. |
| Operación fallida | Conservar el borrador, mostrar el error y no presentar un resultado anterior como si correspondiera al intento fallido. |
| Cambiar de perspectiva | Conservar borradores, resultados vigentes, errores, fuente seleccionada y trabajo del ejercicio. |

### Instantánea interceptable

Cada cifrado válido del emisor crea o reemplaza una única instantánea: el último cifrado de la sesión. Su registro privado conserva las entradas y el resultado necesarios para representar esa operación, mientras su proyección pública contiene solamente algoritmo y texto cifrado, junto con las reglas públicas del alfabeto.

Editar un borrador, ejecutar un descifrado o fallar una operación no reemplaza la instantánea. Se identifica como `Último cifrado válido de la sesión`, separado del borrador actual. Hasta el primer cifrado válido no hay texto de sesión que interceptar; se explica cómo crearlo y se mantiene disponible el ejercicio preparado.

Un nuevo cifrado válido invalida el resultado, la traza y los errores del intento interceptor de sesión, aunque el texto cifrado coincida con el anterior. Puede conservarse su borrador de clave candidata, pero debe probarse nuevamente sobre la nueva instantánea. No modifica el ejercicio preparado.

## 4. Interceptar y probar candidatos

El interceptor selecciona `Cifrado de la sesión` o `Ejercicio preparado`. Cada fuente conserva su propio trabajo al alternarlas. La selección no copia mensajes o claves entre el ejercicio y el emisor.

Para el cifrado de sesión se explica: `Esta vista simula información limitada. Si creaste el mensaje, es posible que ya conozcas la clave.` No se ofrece calificación, pista ni revelación de solución para esta fuente.

- En César se informa que el desplazamiento conocido es +8 y se ofrece `Descifrar con César`. El resultado usa −8 y permite inspeccionar su cálculo; no hay búsqueda de clave.
- En afín se introducen `(a,b)` y se usa `Probar clave`. Cada intento válido muestra el texto candidato y permite abrir su cálculo interno, sin indicar si coincide con el original.
- La primera entrada en cada fuente afín presenta campos candidatos vacíos; no se precargan con una clave del emisor ni con la solución del ejercicio.
- Se conserva únicamente el último intento vigente por fuente. Editar cualquier campo candidato invalida texto, traza y feedback de ese intento. Los candidatos no se normalizan ni evalúan criptográficamente en TypeScript: se usan los resultados de Rust.
- Un intento inválido conserva el borrador y muestra el error; no deja vigente un resultado previo. No existe límite de intentos.

La fuente y las entradas que produjeron un resultado deben acompañarlo internamente. Si una futura integración completa una operación después de que esas entradas hayan cambiado, no debe publicar ese resultado obsoleto como vigente.

## 5. Ejercicio preparado

El ejercicio pide recuperar una clave afín mediante intentos manuales sobre un mensaje en español escrito sin espacios ni acentos. Solo muestra inicialmente el algoritmo, el alfabeto, el texto cifrado y las instrucciones. Los siguientes datos son la solución privada para la implementación y las pruebas; no se entregan a la proyección inicial del interceptor.

| Dato de referencia | Valor |
| --- | --- |
| Mensaje original | `LACLAVEESTAENLOSDISCOS` |
| Clave normalizada | `(7,3)` |
| Texto cifrado | `CDRCDUFFZGDFQCXZYHZRXZ` |
| Inverso multiplicativo | `15` |
| Candidato incorrecto de prueba | `(7,4)` |
| Texto del candidato incorrecto | `WLNWLGPPDELPYWZDOTDNZD` |
| Clave equivalente aceptada | `(33,29)` |

El texto cifrado y el candidato de referencia se verificaron ejecutando las funciones existentes de `crypto-core`. La futura implementación conservará este vector como dato fijo y lo comprobará contra Rust; no implementará otra versión del cifrado en el frontend.

### Ayuda, envío y resultado

`Mostrar pista` entrega una única pista fija: `El factor multiplicativo normalizado es a=7. Prueba los desplazamientos b del 0 al 25.` Solicitarla registra su uso, sin cambiar candidatos ni marcar el ejercicio como resuelto. Repetirla muestra la misma pista.

`Enviar clave` solo está habilitado para un intento válido vigente de este ejercicio. Compara su clave normalizada con `(7,3)`, utilizando la normalización devuelta por Rust. No vuelve a calificar un borrador editado ni acepta un intento de otra fuente. Probar la clave correcta no produce reconocimiento automático.

| Estado / acción | Resultado |
| --- | --- |
| Inicio | Estado `Sin resolver`; sin candidato vigente ni pista utilizada. |
| Enviar clave incorrecta | Conservar `Sin resolver`, el candidato y su traza; indicar `La clave enviada no coincide. Puedes seguir probando.` No revelar parámetros ni mensajes originales. |
| Enviar clave correcta o equivalente | Pasar a `Resuelto`; confirmar el logro y permitir consultar la solución original. Haber solicitado la pista no impide resolver. |
| `Revelar solución` en `Sin resolver` | Pasar a `Revelado`; mostrar el mensaje, la clave y el cálculo original, dejando claro que no cuenta como resolución. La acción se etiqueta explícitamente como revelación. |
| Editar o probar después de `Resuelto` o `Revelado` | Permitir experimentar sin cambiar el resultado alcanzado; no habilitar nuevos envíos ni convertir `Revelado` en `Resuelto`. |
| `Reiniciar ejercicio` | Volver a `Sin resolver`, vaciar candidatos, resultados y feedback, ocultar la solución y limpiar el uso de pista. No borrar el trabajo del emisor. |

El estado alcanzado y el uso de pista se conservan al cambiar vistas o fuentes. Reiniciar oculta de nuevo los datos en las interfaces; no pretende borrar lo que el usuario ya aprendió. Recargar la página descarta toda la sesión.

## 6. Criterios de aceptación

Estos escenarios son requisitos para las futuras pruebas del estado y la interfaz; su documentación no equivale a haberlos ejecutado.

| ID | Escenario verificable |
| --- | --- |
| FL-01 | Una carga nueva muestra el paso 1; anterior/siguiente recorren los cuatro pasos y sus vectores coinciden con Rust. Omitir o terminar abre el emisor. |
| FL-02 | Repetir y omitir o completar la introducción desde cualquier vista restaura el contexto y mantiene intactos borradores, instantánea, candidatos y estado del ejercicio. |
| FL-03 | Ambos algoritmos permiten cifrar y descifrar; se rechazan mensajes vacíos o inválidos, claves no enteras/fuera de rango y factores no invertibles, sin normalización de texto ni resultados parciales. |
| FL-04 | Tras un resultado válido, editar cualquier entrada o cambiar algoritmo/operación invalida su salida y traza. Un error posterior no presenta como vigente el resultado anterior. |
| FL-05 | Sin cifrados válidos se muestra el estado vacío de intercepción. Un cifrado válido crea la instantánea; editar, descifrar o fallar no la sustituye. El siguiente cifrado válido la reemplaza e invalida el intento de sesión. |
| FL-06 | Cambiar vistas o fuentes preserva cada trabajo sin copiar claves del emisor al candidato ni mezclar ejercicio e instantánea. Resultados obsoletos no se publican. |
| FL-07 | César declara su desplazamiento conocido y recupera el texto con −8; afín permite candidatos manuales con texto y traza, sin calificación al probar. |
| FL-08 | El vector fijo cifra y descifra correctamente con `(7,3)`; `(7,4)` produce el candidato documentado, y `(33,29)` recupera el original. |
| FL-09 | Probar `(7,3)` conserva `Sin resolver` hasta enviar. Un envío incorrecto permite continuar; uno correcto o equivalente pasa a `Resuelto`. Editar o cambiar de fuente impide enviar un intento obsoleto. |
| FL-10 | La pista revela únicamente el multiplicador acordado y registra su uso. Revelar la solución produce `Revelado`, nunca `Resuelto`, incluso tras probar o enviar después la clave correcta. |
| FL-11 | Reiniciar borra únicamente el trabajo del ejercicio y vuelve a ocultar su solución. Recargar descarta también el laboratorio y vuelve a la introducción. |

## Documentos relacionados

- [Visión del proyecto](../VISION.md)
- [Arquitectura](../ARCHITECTURE.md)
- [Perspectivas e información visible](./perspectives.md)
- [César](./cipher-caesar.md)
- [Afín](./cipher-affine.md)
- [Fundamentos matemáticos](./math-foundations.md)
