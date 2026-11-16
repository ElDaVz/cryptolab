# Especificación — Primera experiencia de escritorio

## 1. Alcance y distribución

Demo completa en español para Chromium de escritorio: introducción, emisor, interceptor, ejercicio y mecanismo interno. Área objetivo mínima de 1280×720 píxeles CSS; verificar también 1920×1080. No se exige aceptación móvil ni en Firefox/Safari en este hito. Una ventana menor conserva acceso a formularios y navegación mediante distribución en flujo y desplazamiento; no bloquea ni descarta el trabajo.

La entrega incluye desarrollo local y un build estático, sin servidor de aplicaciones ni publicación automática. El [recorrido](./learning-flow.md) y las [perspectivas](./perspectives.md) gobiernan estados y datos; este documento concreta su presentación. La demo contiene interfaz; la apertura y las etapas afines de la siguiente iteración siguen pendientes. Consultar [Implementación](../IMPLEMENTATION.md) para distinguir código y evidencia de requisitos futuros.

## 2. Composición y navegación

La máquina ocupa un lienzo de fondo con mesa e iluminación cálida. Los paneles HTML flotan por encima, con fondos suficientemente opacos para que los textos sean legibles independientemente de la escena. Tipografía de sistema, texto principal de al menos 16 píxeles CSS y contraste mínimo 4.5:1 para texto normal; el foco y los estados no dependen solo del color.

| Zona | Contenido |
| --- | --- |
| Barra superior | Nombre, perspectiva activa y botones `Emisor`, `Interceptor`, `Mecanismo interno`, `Repetir introducción` y `Sonido`. |
| Panel izquierdo | Formulario del contexto activo: algoritmo/operación/mensaje/clave del emisor, o fuente y clave candidata del interceptor. En interior, origen del cálculo y acción para volver a él. |
| Panel derecho | Resultado, error o estado vacío; en el ejercicio, pista, envío, revelación y reinicio según su estado. En interior, ecuación del carácter y derivación de Euclides desplegable. |
| Franja inferior | Selección de caracteres y controles de reproducción del resultado vigente; las secuencias largas se desplazan dentro de su región. |

En 1280×720 los paneles laterales tienen 300 píxeles de ancho como máximo y desplazamiento vertical propio. El lienzo encuadra la máquina en el espacio central restante, sin colocar perillas editables detrás de los paneles. La introducción utiliza un panel guiado central con navegación y sus ejemplos aislados. Abrir explicaciones extensas usa el desplazamiento del panel, no ventanas nuevas ni paneles arrastrables.

Los cambios de perspectiva son acciones explícitas sin rutas de servidor. El botón general de interior abre el resultado vigente del emisor o del intento de la fuente activa, según el contexto del que se viene; si no existe, abre un estado vacío. La solución preparada solo se abre mediante su acción autorizada después de resolver o revelar. Dentro de interior se mantiene el origen, sin sustituirlo por datos de otro contexto.

César aparece como recorrido principal con +8 fijo; afín se identifica como modo avanzado, conservando sus controles y el ejercicio. El emisor ofrece un botón HTML `Abrir máquina` / `Cerrar máquina` con estado accesible (`aria-expanded`), sin desplazar el foco al lienzo. Su estado inicial es cerrado; el interior se identifica como abierto y el interceptor como cerrado, sin controles que permitan eludir sus permisos. Los mismos estados y explicaciones se ofrecen sin WebGL. Las etapas afines se leen como una lista ordenada de operaciones Rust, junto a la ecuación completa.

## 3. Entrada, errores y resultados

El mensaje tiene un contador `N / 256`, donde N cuenta puntos de código Unicode, no unidades UTF-16 ni bytes UTF-8. Se puede pegar o escribir texto más largo para corregirlo: no se trunca, pero se muestra un error y no se ejecuta una operación con más de 256 caracteres. El límite pertenece a la interfaz, no modifica el núcleo Rust ni la frontera WASM.

Orden de validación en la UI: primero campos de clave representables como enteros `i32` cuando correspondan, después el límite de longitud, y después las reglas de dominio de Rust. No se recorta el mensaje ni se convierten letras, acentos o espacios. Una cadena vacía dentro del límite llega a Rust y produce `EmptyMessage`; un mensaje inválido dentro del límite conserva el primer carácter y su índice de byte original. Los errores del núcleo se traducen mediante sus códigos, sin analizar `Display` ni reemplazar el índice de byte por un índice UTF-16.

La salida completa aparece inmediatamente tras una operación válida. La UI distingue borrador, vista previa de configuración, resultado vigente y último cifrado interceptable. La consulta de una tabla alfabética nunca sustituye un resultado de mensaje. Los cálculos, claves y permisos se invalidan según el recorrido y se sincronizan con máquina y reproducción.

Las explicaciones usan los operandos, residuos e inversos devueltos por Rust. Euclides muestra sus divisiones ordenadas y los coeficientes de Bézout; no es necesario animarlo ni recalcularlo. El selector de caracteres identifica cada ocurrencia por posición y permite consultar su ecuación completa.

## 4. Accesibilidad y movimiento

- Todos los formularios, claves, navegación, caracteres, apertura/cierre y controles de reproducción son HTML semántico y operables por teclado. Los controles 3D tienen equivalentes descritos en [Máquina e interacción](./machine-interaction.md).
- Orden de tabulación: navegación superior, formulario activo, resultado/acciones y reproducción. Los paneles con desplazamiento son accesibles por teclado. No hay atajos globales de letras, espacio o flechas que interfieran con la escritura.
- Cada entrada tiene etiqueta y descripción de restricciones. Los errores se asocian al campo; al fallar una operación, se lleva el foco al primer campo inválido. El estado de ejercicio se anuncia mediante una región de estado; la reproducción no anuncia automáticamente cada carácter ni vuelve a leer todo el resultado.
- Al cambiar de perspectiva, el foco pasa a su encabezado. Al cerrar o terminar la introducción repetida vuelve al control que la abrió; al entrar inicialmente al laboratorio va al encabezado del emisor. Ningún panel de fondo de la introducción captura el foco.
- Respetar `prefers-reduced-motion` al iniciar y cuando cambie. El usuario puede activar también `Reducir movimiento`; si cualquiera de las dos preferencias lo solicita, no hay desplazamiento animado de cámara ni giro interpolado. Las actualizaciones y controles siguen funcionando según [Animaciones](./animation-system.md).
- Las tablas, ecuaciones, valores y resultados ofrecen toda la información educativa sin depender del lienzo ni de sonidos.

## 5. Carga y degradación

| Estado | Comportamiento observable |
| --- | --- |
| Motor cargando | Mostrar `Cargando motor matemático…`; se puede leer/navegar la introducción y editar borradores, pero las acciones que necesitan Rust permanecen deshabilitadas. No se simulan resultados con TypeScript. |
| Error al cargar WASM | Mostrar `No se pudo cargar el motor matemático` y `Reintentar`. Conservar lo escrito y continuar mostrando el contenido estático. El reintento no reinicia sesión ni ejercicio. |
| WebGL no disponible | Mostrar un aviso persistente y retirar el lienzo interactivo; mantener todos los formularios, resultados, navegación, trazas y acciones del ejercicio. |
| Pérdida de contexto WebGL | Cancelar reproducción 3D y arrastre, liberar la escena y pasar al mismo modo textual conservando el paso seleccionado y los datos. No recrear automáticamente la escena en bucle; recargar permite un nuevo intento. |
| Audio no disponible | Informar al intentar habilitarlo y mantener el control silenciado, sin bloquear operaciones ni reproducción visual. |

En modo textual, anterior/siguiente, selección y reproducción recorren las mismas trazas autorizadas. Los avisos de renderizado y audio no se presentan como errores criptográficos. Reintentar WASM solo aplica a la inicialización del motor, no vuelve a ejecutar una operación anterior automáticamente.

## 6. Criterios de aceptación

Contratos para pruebas de estado, DOM y Chromium; la evidencia se registra por incremento. Los nuevos criterios DE-11/12 no se acreditan con la verificación histórica.

| ID | Escenario verificable |
| --- | --- |
| DE-01 | En 1280×720 y 1920×1080, todas las acciones y textos son accesibles, los paneles no ocultan controles 3D y las explicaciones largas se desplazan sin perder navegación. |
| DE-02 | Reducir la ventana conserva trabajo y acceso mediante desplazamiento; no exige soporte táctil ni declara aceptación móvil. |
| DE-03 | Un mensaje de 256 letras se ejecuta; 257 no. Un símbolo Unicode suplementario cuenta como un carácter, se conserva sin truncar y Rust lo rechaza si el mensaje está dentro del límite. |
| DE-04 | Campos mal formados, fuera de `i32`, mensajes vacíos y caracteres inválidos producen el error apropiado sin normalización ni resultados parciales; el foco y la descripción señalan el problema. |
| DE-05 | Un recorrido completo por introducción, ambos cifrados, intercepción y ejercicio se realiza solo con teclado, incluido el equivalente de las perillas y la selección de un carácter. |
| DE-06 | `prefers-reduced-motion` y el control propio suprimen interpolaciones, también si cambian durante reproducción, manteniendo el paso y todos los resultados. |
| DE-07 | Un error de inicialización permite reintentar sin borrar borradores. Una respuesta obsoleta o una vista previa no se presenta como resultado vigente. |
| DE-08 | WebGL ausente o perdido deja disponibles los escenarios FL/PE del recorrido y sus trazas textuales; no aparecen datos privados de un contexto anterior. |
| DE-09 | El audio comienza silenciado, solo se habilita por acción explícita y su fallo no altera resultados, controles ni estado del ejercicio. |
| DE-10 | El build estático carga HTML, módulos y WASM desde una subruta sin backend ni recursos de desarrollo; se cumple la prueba de distribución de [WASM](./wasm-integration.md). |
| DE-11 | El emisor puede abrir/cerrar por teclado manteniendo foco y estado accesible; interior/interceptor muestran su estado impuesto. Todo funciona sin WebGL, sin depender de sonido o color. |
| DE-12 | En ambos tamaños de escritorio, César es el recorrido principal, afín se identifica como avanzado y sus etapas ordenadas son legibles; revisión humana de letras según MI-09, sin capturas. |

## Documentos relacionados

- [Visión](../VISION.md)
- [Arquitectura](../ARCHITECTURE.md)
- [Recorrido](./learning-flow.md)
- [Perspectivas](./perspectives.md)
- [Máquina](./machine-interaction.md)
- [Animaciones](./animation-system.md)
- [WASM](./wasm-integration.md)
