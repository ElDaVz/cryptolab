# Primera demo: registro de implementación

Se implementa la secuencia autorizada en doce commits: entorno, frontera WASM,
adaptador, sesión, proyecciones, introducción/emisor, interceptor/interior,
máquina, controles, reproducción, audio/degradación y verificación final.

Las tablas WA, FL, PE, DE, MI y AN de las especificaciones son el contrato de
aceptación. Cada incremento añade pruebas en la capa que le corresponde. Las
pruebas de frontera usan el módulo WASM real en Chromium; las de estado y
presentación usan dobles tipados y reloj controlado cuando procede. La revisión
final ejecuta debug/release, formato, Clippy, TypeScript, Vitest y el build real en
raíz y subruta. No se capturan imágenes, vídeos ni trazas de Playwright.

No se modifica el comportamiento de crypto-core. La escena consume exclusivamente
tablas y pasos Rust autorizados. El texto ofrece toda la información educativa.

## Entorno validado · 2026-11-14

Linux x86_64; Rust 1.100.0 (0ef1bc386 2026-11-09), target nativo y
wasm32-unknown-unknown del mismo toolchain, Node v26.13.0, npm 12.2.2,
wasm-pack 0.13.1, wasm-bindgen-cli 0.2.105. Frontend: Vite 8.3.8,
TypeScript 7.0.2, Vitest 5.1.0, Three.js 0.187.0, GSAP 3.15.1,
Playwright 1.65.1 y Chromium headless 159.0.8154.6 (revisión 1255).

`./scripts/dev setup` finalizó correctamente: 13 pruebas Rust y un doctest,
módulo mínimo WASM, comprobación TypeScript/build Vite y lanzamiento Chromium.
Una consulta WebGL2 confirmó muestras generadas al dibujar un triángulo, sin
leer píxeles ni guardar imágenes. `doctor` también pasó. La distribución
fallback Ubuntu 24.04 de Playwright funciona en este host; no se instalaron
paquetes del sistema. Los perfiles de shell y las instalaciones globales se
conservaron.

## Demo completa · verificación final

Se implementaron los doce incrementos. `crypto-core` y los documentos de
`docs/specs/` permanecen sin cambios. El último incremento formatea el frontend y
scripts con Prettier 3.6.2 fijado, completa el teardown mediante AbortController y
conserva foco, selección, desplazamiento y explicaciones abiertas durante las
actualizaciones. Los errores de transporte se explican en español.

### Resultados ejecutados

- Rust debug y release: 15 pruebas unitarias y un doctest correctos en cada perfil.
- `cargo fmt --all -- --check` y Clippy de todo el workspace/all-targets con
  `-D warnings`: correctos.
- TypeScript estricto: correcto. Vitest: 24 pruebas en siete archivos, correctas.
- WASM real en Node: validación estricta, UTF-16, errores, extremos numéricos,
  normalización parcial, límite exclusivo de UI y 312 round trips correctos.
- Chromium 159.0.8154.6: 17 pruebas sobre el build release, correctas tanto en
  raíz como en `/cryptolab/`. Incluyen recursos/MIME de WASM, ausencia de rutas de
  desarrollo, recorrido solo con teclado, 1280×720 y 1920×1080, ventana menor,
  arrastre, cancelación, movimiento reducido, fallo/reintento de inicialización,
  ejercicio y separación de información, audio real y fallo de audio, WebGL
  ausente/perdido y liberación/estabilidad de recursos de la escena.
- Setup repetido con `pkg/` retirado: regeneró bindings, ejecutó `npm ci`, pruebas,
  build y comprobación WebGL correctamente. No fue necesario instalar librerías
  del sistema. `doctor` y comprobación de formato frontend: correctos.
- Revisión Git: herramientas, dependencias, bindings y resultados generados están
  ignorados. `git diff --check`: correcto. No se publicaron ni empujaron commits.
- No se utilizaron screenshots, vídeo, tracing, lectura de píxeles ni APIs de
  captura. El único artefacto de Playwright es su registro textual/JSON de pruebas.

### Relación con los escenarios de aceptación

| Familia | Evidencia principal |
| --- | --- |
| WA | `e2e/boundary.spec.ts`, `distribution.spec.ts`, `scripts/check-wasm.mjs`, pruebas del adaptador y setup/doctor. |
| FL | `experience/session.test.ts`, `e2e/demo.spec.ts` y `sender.spec.ts`. |
| PE | `experience/projections.test.ts`, claves candidatas vacías, contextos internos y solución autorizada. |
| DE | `e2e/demo.spec.ts`, `keyboard.spec.ts`, `distribution.spec.ts`, `rendering.spec.ts` y pruebas de errores. |
| MI | `e2e/machine.spec.ts`, `controls.spec.ts`, pruebas de controles y tablas Rust de frontera. |
| AN | `machine/AnimationDirector.test.ts`, `MechanicalAudio.test.ts`, `e2e/playback.spec.ts`, `audio.spec.ts` y `rendering.spec.ts`. |

Las rutas de pruebas de la tabla son relativas a `apps/web/` (las pruebas unitarias
están en `src/`). El chequeo WebGL independiente consulta muestras de un triángulo;
las pruebas de la escena comprueban draw calls, errores GL, posiciones de picking y
contadores de texturas/geometrías. Esto verifica renderizado e interacción, no una
evaluación artística de encuadres, materiales o una evaluación humana del sonido.
Esas evaluaciones manuales siguen pendientes, sin haber capturado imágenes.

### Decisiones y límites

ADR-001 está implementada; ADR-002 registra aislamiento de herramientas y la
exclusión deliberada de wasm-opt. No se introdujeron frameworks, backend, nuevos
algoritmos ni dependencias del navegador en el núcleo. La separación de roles es
educativa y no confidencialidad contra el propietario del navegador.

Setup soporta inicialmente Linux x86_64 con Node/npm exactos. Chromium de escritorio
es el navegador objetivo. Vite avisa del bundle de Three.js/GSAP, aproximadamente
656 kB sin comprimir y 178 kB gzip; el WASM release es aproximadamente 63 kB. La
aplicación ofrece el recorrido completo sin GPU; no promete aceptación móvil ni
compatibilidad probada con Firefox/Safari. No se modificaron perfiles ni herramientas
del sistema. Todos los comandos de ejecución y prueba están en el README.

### Commits locales

Rama: `feat/first-desktop-demo`. Orden de implementación:

| Commit | Incremento |
| --- | --- |
| `97b553b` | Entorno aislado, diagnósticos, locks y scaffold. |
| `5c2818f` | Frontera Rust/WASM, DTO y validación estricta. |
| `39a9e92` | Adaptador tipado, inicialización y reintento. |
| `d8d1f20` | Sesión, instantáneas, candidatos y ejercicio. |
| `3538f41` | Proyecciones autorizadas y exclusión de información. |
| `7590f16` | Introducción en español y emisor. |
| `45d096a` | Interceptor, ejercicio e interior/Euclides. |
| `0a132cc` | Máquina procedural, tablas y cámaras. |
| `de03479` | Perillas, campos, teclado y arrastre capturado. |
| `e1dee06` | Reproducción cancelable y movimiento reducido. |
| `bf14036` | Audio opcional y degradación textual. |
| Commit final que contiene este registro | Verificación integral, revisión, formato y documentación de ejecución. |

Para ver los doce hashes completos: `git log --reverse --oneline main..HEAD`.

## Onboarding y contribuciones · 2026-11-14

Este incremento amplía el setup Linux original según ADR-003. La entrada común
es `node scripts/dev.mjs`; `scripts/dev` conserva su función de alias Unix.
El README contiene el recorrido numerado desde clone hasta ejecución y pruebas,
requisitos por plataforma y diagnóstico. AGENTS incorpora ramas por asignación,
commits pequeños, ruta de lectura de especificaciones y entrega mediante draft PR,
respetando instrucciones de trabajo local. La plantilla está en
[.github/pull_request_template.md](../.github/pull_request_template.md) y la
[matriz CI](../.github/workflows/ci.yml) cubre Linux x64, Windows x64 nativo,
macOS Intel y Apple Silicon. No se modifica el dominio ni las especificaciones.

### Evidencia ejecutada en este incremento

En Linux x86_64 con las versiones exactas ya registradas:

- `node scripts/dev.mjs setup`: repetición correcta, `npm ci`, Rust debug
  (15 pruebas y un doctest), módulo WASM mínimo, build y Chromium/WebGL correctos.
- `node scripts/dev.mjs doctor`: correcto; enlaza pruebas nativas sin ejecutarlas,
  comprueba versiones y target y verifica muestras WebGL sin instalar herramientas.
- `node scripts/dev.mjs cargo test --workspace --release --locked`: 15 pruebas
  y un doctest correctos. Formato Rust y Clippy con `-D warnings`: correctos.
- `node scripts/dev.mjs npm --prefix apps/web run test:tooling`: cuatro pruebas
  correctas; tripletas, sufijos, reglas PATH, aislamiento, argumentos literales y
  directorio con espacios. Las rutas temporales se comparan canónicamente para macOS.
- `typecheck`, `format:check` y `test` mediante el mismo wrapper npm: correctos;
  Vitest conserva 24 pruebas correctas.
- `test:wasm`: contratos del módulo real y 312 round trips correctos.
- `test:e2e`: 17 pruebas correctas con build release/base predeterminada.
- Build `--base=/cryptolab/` y `test:browser` con las variables documentadas:
  17 pruebas correctas. Se restauró después el build con base predeterminada.
- Enlaces Markdown relativos revisados; revisión de diff y exclusión de artefactos
  correctas. El YAML del workflow se revisó manualmente; no había un parser YAML
  instalado localmente. La ejecución remota de GitHub Actions sigue pendiente.

La primera ejecución E2E encontró 4173 ocupado por el preview de esta misma demo;
se detuvo ese preview y se repitió correctamente. No se capturaron imágenes, vídeo
ni trazas. La advertencia conocida de tamaño del bundle permanece.

### Commits del incremento

| Commit | Cambio |
| --- | --- |
| `57e44d7` | Herramientas aisladas portables y pruebas iniciales. |
| `b39a850` | Directorios temporales canónicos en las pruebas. |
| `793fe81` | Guía desde clone, reglas de agentes, ADR-003 y backlog. |
| `24baaac` | Plantilla PR y workflow de cuatro plataformas. |
| `d9996ce` | Reglas de mayúsculas de PATH según el host y regresión. |
| Commit que contiene esta actualización | Registro de verificación y entrega. |

No se han ejecutado Windows ni macOS en este entorno. Su implementación está
preparada, pero su compatibilidad queda pendiente de los jobs correspondientes.
La compilación nativa de wasm-pack en Apple Silicon tampoco se ha ejecutado aquí.
No se ha probado un setup desde cero en un segundo checkout local; CI lo realizará
sin reutilizar `.tools/`. Las revisiones humanas visual y audible siguen pendientes,
registradas en [BACKLOG.md](./BACKLOG.md). Estos commits no se han empujado ni se ha
publicado un PR. Se deja un borrador local de descripción en `.tools/pr-description.md`.

## Siguiente iteración acordada

**Estado: diseño acordado para el equipo; implementación y verificación pendientes.**
Esta sección describe la evolución propuesta a partir de la revisión de la demo.
No forma parte de los resultados ejecutados registrados arriba. El trabajo actual
se limita a documentación: no cambia la aplicación, las APIs Rust/WASM ni las
especificaciones vigentes.

### Observaciones y dirección educativa

La máquina actual muestra dos anillos de correspondencias, sin apertura física.
La revisión del usuario pide letras claramente visibles, como en un candado, y
una separación comprensible entre el alfabeto cifrado y el de referencia.
César será el recorrido principal y conservará el desplazamiento fijo **+8**.
Afín seguirá disponible como modo secundario avanzado, con una explicación visual
propia de sus operaciones. La disconformidad con su representación no se registra
como un fallo matemático demostrado: las pruebas existentes del núcleo son evidencia
distinta de la calidad de la explicación visual.

### Máquina de César y apertura

La propuesta utiliza dos discos o engranajes sobre el mismo eje: delante queda el
alfabeto cifrado desplazado y detrás el alfabeto de referencia A–Z. Al abrir,
los discos se separan sobre ese eje lo suficiente para comparar sus letras sin
ocultamientos. Ambos tendrán etiquetas claras y un indicador para leer la pareja.

En el emisor, la máquina comienza cerrada y ofrece un control explícito para
abrir/cerrar. El mecanismo interno presenta los dos discos abiertos. El interceptor
mantiene su máquina cerrada y utiliza solamente su contexto candidato; al consultar
el interior de un intento, ambos discos representan exclusivamente ese intento,
sin incorporar la configuración ni la traza original. Los datos del contexto
anterior se retiran antes de cualquier apertura o transición.

El desplazamiento relativo entre alfabetos expresa la configuración fija +8.
El giro de selección permite inspeccionar otra letra conservando esa correspondencia;
no cambia la clave. Deben distinguirse visualmente ambas funciones. En descifrado
se recorre la correspondencia inversa. Los resultados y las parejas autorizadas
proceden de Rust; los ángulos y animaciones nunca calculan un cifrado.

### Afín como modo avanzado por etapas

Una rotación uniforme no explica la multiplicación del cifrado afín. Su futura
representación distinguirá multiplicación, desplazamiento y reducción módulo 26.
El descifrado mostrará resta, multiplicación por el inverso y reducción, en el
orden de la traza Rust. No se sugerirá que un simple giro reproduce toda la operación.
Se conservarán la clave suministrada/normalizada, los errores y las explicaciones
matemáticas del contexto autorizado.

### Tareas ordenadas y criterios de aceptación pendientes

| Orden | Tarea | Criterio de aceptación para la futura implementación |
| --- | --- | --- |
| 1 | Actualizar los contratos visuales | Revisar las especificaciones enlazadas abajo para acordar apertura, visibilidad, selección y etapas antes de cambiar código; definir sus pruebas de aceptación. |
| 2 | Mejorar legibilidad de los alfabetos | Letras completas, contrastadas y sin solapamientos en los encuadres de escritorio previstos, incluyendo 1280×720 y 1920×1080; realizar evaluación humana además de comprobaciones automatizadas sin imágenes. |
| 3 | Construir apertura y dos discos | Emisor cerrado inicialmente con control abrir/cerrar; interior abierto; discos distinguibles sobre el mismo eje, con etiquetas y lectura inequívoca bajo el indicador. |
| 4 | Priorizar la explicación de César | Verificar A → I, X → F y los recorridos inversos I → A y F → X; conservar +8 fijo y distinguir selección de letra de desplazamiento entre alfabetos. |
| 5 | Verificar perspectivas y transiciones | Interceptor cerrado y sin datos originales; el interior candidato usa solo su intento; retirar datos anteriores antes de transiciones y conservar las restricciones de solución del ejercicio. |
| 6 | Representar afín por etapas | Cifrado y descifrado siguen sus trazas Rust; distinguir multiplicación/desplazamiento/módulo y no representar la multiplicación como rotación uniforme. |
| 7 | Completar accesibilidad y movimiento | Apertura, cierre y selección tienen controles HTML/teclado; animaciones cancelables y compatibles con movimiento reducido; explicación textual completa sin WebGL. |

Antes de implementar, actualizar conjuntamente [Máquina e interacción](./specs/machine-interaction.md),
[Perspectivas](./specs/perspectives.md), [Animaciones](./specs/animation-system.md)
y los apartados afectados de [Escritorio](./specs/desktop-experience.md).
La especificación actual describe anillos concéntricos y una inspección sin apertura
física: esta propuesta cambia ese contrato y no debe aplicarse silenciosamente.
Consultar también [César](./specs/cipher-caesar.md), [Afín](./specs/cipher-affine.md),
[Recorrido](./specs/learning-flow.md) y [Arquitectura](./ARCHITECTURE.md).
El [backlog](./BACKLOG.md#evolución-acordada-de-la-máquina) enlaza estas tareas.

### Entrega e integración

Esta actualización documental se incorpora en un commit separado a
`feat/first-desktop-demo`, sin push. El orden recomendado para integrar la demo es
subir sus commits locales al único PR de esa rama, esperar las comprobaciones y
fusionarlo en `main`. La implementación de la nueva máquina se hará después en
una rama nueva creada desde ese `main` actualizado, con tareas y commits pequeños.
La recomendación no significa que se haya publicado o fusionado ningún cambio.
