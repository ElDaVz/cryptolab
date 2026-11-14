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
