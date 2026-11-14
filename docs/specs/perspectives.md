# Especificación — Perspectivas e información visible

## 1. Propósito

Definir la información que reciben las perspectivas de emisor, interceptor y mecanismo interno. Las tres representan una sesión educativa; cambiar de cámara o perspectiva no ejecuta cifrados ni modifica claves, mensajes o resultados.

El [recorrido de aprendizaje](./learning-flow.md) define navegación, fuentes, intentos, calificación, reinicio e invalidación de resultados. Esta especificación define sus proyecciones de información, con independencia del diseño visual y del contrato de transporte de [Integración WASM](./wasm-integration.md).

La aplicación se ejecuta en el navegador. La separación es parte de la simulación y **no es una garantía de confidencialidad ante quien controla o inspecciona su navegador**. Tampoco puede hacer que el usuario olvide una clave que introdujo en el emisor o una solución revelada previamente.

## 2. Responsabilidades y contratos

`experience` conserva el estado privado y construye modelos explícitos para cada vista, entregando solo los campos autorizados. Los nombres siguientes son contratos conceptuales para implementación futura, no nuevas APIs Rust ni esquemas de transporte.

| Modelo | Información permitida |
| --- | --- |
| Emisor | Su borrador de mensaje, algoritmo, operación, clave afín suministrada, errores y resultado vigente. Para afín incluye clave normalizada. Puede solicitar el mecanismo interno de su operación vigente. |
| Interceptor | Fuente seleccionada, algoritmo, alfabeto y reglas públicas, texto cifrado o estado vacío, borrador de clave candidata, último texto candidato vigente y errores de su propio intento. En el ejercicio incluye estado, feedback y la pista solamente después de solicitarla. |
| Mecanismo interno | Contexto autorizado, entradas de ese cálculo, algoritmo, operación, salida, claves aplicables y trazas estructuradas de Rust. Nunca selecciona por defecto un resultado privado ajeno a su contexto. |
| Solución del ejercicio | Mensaje original, clave original normalizada y acceso a su cálculo original; disponible únicamente en `Resuelto` o `Revelado`. Se entrega separada del modelo interceptor de intentos. |

El resultado completo `AffineResult` o el estado global de sesión no se pasan al interceptor para esconder después campos mediante CSS o componentes condicionales. Los modelos no incluyen referencias, funciones ni estructuras anidadas que permitan a sus consumidores consultar información excluida mediante la interfaz normal de la aplicación. La escena, paneles y explicaciones usan la misma información autorizada para su contexto.

Los cálculos permanecen en Rust. `experience` puede comparar la clave candidata ya normalizada con la solución para calificar un envío explícito; no reproduce normalización, cifrado, descifrado ni algoritmos matemáticos en TypeScript.

## 3. Información pública, privada y derivada

| Dato | Clasificación y reglas |
| --- | --- |
| Algoritmo, alfabeto `A`–`Z`, módulo 26 y fórmulas generales | Públicos en todas las perspectivas. |
| Desplazamiento César +8 | Público y fijo; no se presenta como secreto ni como problema de recuperación de clave. |
| Texto cifrado de la fuente seleccionada | Observable por el interceptor. |
| Mensaje y clave originales de una operación afín | Privados del emisor o de la solución del ejercicio. No se precargan en candidatos. |
| Clave original normalizada, inverso y traza original | También privados: contienen o permiten deducir parámetros originales. |
| Candidato suministrado y normalizado, su inverso, texto y traza | Derivados de la elección del usuario; permitidos en el contexto de su intento, aunque coincidan accidentalmente con la solución. La coincidencia no se anuncia al probar. |
| Pista del ejercicio | Excepción educativa explícita: al solicitarla se revela `a=7`, sin revelar `b`, mensaje original ni traza original. |
| Resultado de un envío | Informa éxito o fallo según el recorrido; un fallo no identifica cuál parámetro coincide ni suministra partes del original. |

Las etiquetas distinguen `Texto candidato` de `Solución original`. Un candidato legible no se presenta como descifrado verificado antes del envío correcto. La fuente de sesión no tiene verificador ni revelación de solución desde el interceptor; el usuario puede volver explícitamente al emisor para consultar su propio trabajo.

## 4. Contextos del mecanismo interno

El acceso se realiza desde un resultado vigente y conserva el origen. Un cambio de fuente no reutiliza silenciosamente una traza de otra fuente.

| Origen | Datos mostrados y etiqueta |
| --- | --- |
| Resultado del emisor | `Operación del emisor`: el cifrado o descifrado vigente con sus propias entradas y trazas. |
| Intento de intercepción de sesión | `Intento candidato · Cifrado de la sesión`: descifrado producido con el candidato, o con −8 si es César. No usa la clave ni la traza original de la instantánea. |
| Intento del ejercicio | `Intento candidato · Ejercicio preparado`: únicamente el descifrado de la clave probada por el usuario, aun si la clave es correcta. |
| Consulta de solución tras resolver o revelar | `Solución original · Ejercicio preparado`: cifrado del mensaje original con `(7,3)` y su derivación, identificando si el ejercicio fue resuelto o revelado. |

Si falta un resultado vigente se muestra un estado vacío indicando que debe ejecutarse una operación o probarse una clave. Si se invalida el cálculo que se estaba inspeccionando, desaparecen su salida y traza en esa vista; no se sustituye por otra operación privada.

En afín, las explicaciones utilizan las claves suministrada/normalizada y la derivación del inverso del contexto correspondiente. Cada paso por carácter usa los operandos, valor sin reducir y residuo de Rust. La vista no recalcula resultados ni deduce operandos a partir de animaciones.

La solución del ejercicio no puede abrirse por una acción normal o selección de contexto mientras esté `Sin resolver`. Volver al emisor siempre se refiere al trabajo propio de la sesión, nunca carga la solución preparada en sus campos. Tras reiniciar el ejercicio se retira también cualquier contexto abierto de solución o candidato del ejercicio.

## 5. Criterios de aceptación

Son escenarios para futuras pruebas de proyección y estado, independientes de Three.js. No se consideran pruebas ejecutadas en este incremento documental.

| ID | Escenario verificable |
| --- | --- |
| PE-01 | El modelo emisor representa solo su trabajo; alternar perspectivas conserva las entradas y resultados sin ejecutar operaciones nuevas. |
| PE-02 | La proyección interceptora de una sesión afín contiene ciphertext, datos públicos y candidatos propios, pero no mensaje original, clave original, inverso original ni traza original, tampoco anidados o accesibles por funciones del modelo. |
| PE-03 | Antes de cualquier intento, el ejercicio `Sin resolver` expone únicamente instrucciones, datos públicos, texto cifrado y estado; los campos candidatos están vacíos. La solución no se copia al emisor ni a los candidatos. |
| PE-04 | Un intento con `(7,4)` presenta `WLNWLGPPDELPYWZDOTDNZD` y su propia traza. El interior recibe `(7,4)`, no `(7,3)`, y está etiquetado como candidato. |
| PE-05 | Probar `(7,3)` o `(33,29)` puede producir el mensaje correcto, pero no cambia el estado ni incorpora un indicador de coincidencia o el registro original al modelo candidato antes de enviar. |
| PE-06 | Pedir la pista añade únicamente la revelación aprobada `a=7`; un envío incorrecto no revela parámetros originales adicionales. |
| PE-07 | En `Sin resolver`, ninguna acción normal permite consultar el contexto de solución original. En `Resuelto` o `Revelado`, la consulta explícita recibe la solución y su traza con etiquetas distintas del intento. |
| PE-08 | Editar una clave candidata, reemplazar la instantánea o reiniciar retira la traza invalidada de todos sus consumidores; no reaparecen datos originales como sustitución del estado vacío. |
| PE-09 | Alternar fuentes aísla sus candidatos, trazas y feedback; volver al emisor muestra sus datos propios sin introducir la solución del ejercicio. |
| PE-10 | César expone +8 como dato público y representa su descifrado con −8. No se exige recuperar una clave secreta inexistente en este modo. |
| PE-11 | La separación se comprueba en los modelos y sus consumidores, no únicamente mediante visibilidad del DOM o posición de cámara. La interfaz explica su carácter educativo sin prometer confidencialidad en el navegador. |

## 6. Dependencias y finalización

Las futuras pruebas de frontend verificarán listas explícitas de campos permitidos y excluidos, además de transiciones del recorrido. WASM transportará resultados del dominio según su [especificación](./wasm-integration.md); el filtrado por perspectiva seguirá siendo responsabilidad de `experience`, sin acoplar `crypto-core` a roles o pantallas.

La documentación está completa al fijar estas reglas y escenarios. La funcionalidad de perspectivas solo se considerará implementada cuando existan las proyecciones, la navegación y las pruebas correspondientes. Las cámaras y controles se definen en [Máquina](./machine-interaction.md), la reproducción en [Animaciones](./animation-system.md) y la accesibilidad en [Escritorio](./desktop-experience.md).

## Documentos relacionados

- [Recorrido de aprendizaje y sesión](./learning-flow.md)
- [Arquitectura](../ARCHITECTURE.md)
- [Visión del proyecto](../VISION.md)
- [Cifrado César](./cipher-caesar.md)
- [Cifrado afín](./cipher-affine.md)
- [Máquina e interacción](./machine-interaction.md)
- [Animaciones y audio](./animation-system.md)
- [Experiencia de escritorio](./desktop-experience.md)
- [Integración WASM](./wasm-integration.md)
