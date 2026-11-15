# CriptoLab

Demo educativa en español de criptografía clásica y matemática discreta: Rust y
WebAssembly realizan los cálculos exactos; TypeScript, Three.js y GSAP presentan
una máquina procedural sobre una mesa. No ofrece seguridad criptográfica moderna.

Incluye una introducción que se puede omitir/repetir, laboratorio del emisor,
intercepción del último cifrado válido, ejercicio afín, trazas por carácter y
Euclides/Bézout. La salida completa aparece inmediatamente; la reproducción se
solicita explícitamente. Hay equivalentes HTML/teclado de las perillas, movimiento
reducido, sonido opcional inicialmente silenciado y funcionamiento textual completo
sin WebGL. La sesión vive en memoria y se pierde al recargar.

## Preparación y ejecución

El instalador de herramientas fijadas soporta **Linux x86_64**. Requiere Node
**26.13.0**, npm **12.2.2**, `curl`, `tar`, un enlazador C nativo y bibliotecas del
host compatibles con Chromium. No cambia instalaciones del sistema, perfiles de
shell ni PATH global. Las descargas ocurren solamente durante setup; requiere
acceso a los servidores oficiales de Rust, GitHub, npm y Playwright.

Desde la raíz:

```sh
./scripts/dev setup
./scripts/dev doctor
./scripts/dev npm --prefix apps/web run dev
```

Vite imprime la URL local (normalmente `http://127.0.0.1:5173`). Cambiar Rust
requiere reiniciar `dev` para regenerar WASM; Vite vigila TypeScript y CSS.

`setup` es seguro de repetir. Instala Rust **1.100.0** y el target
`wasm32-unknown-unknown`, rustfmt/Clippy, wasm-pack **0.13.1** y wasm-bindgen
**0.2.105** bajo `.tools/`; usa `npm ci` y descarga Chromium headless
**159.0.8154.6**, revisión **1255**, de Playwright **1.65.1** en `.tools/browsers/`.
Las versiones están en [scripts/versions.json](./scripts/versions.json), los
manifiestos y los lockfiles. `doctor` informa discrepancias, comprueba compilación
nativa, target WASM y lanzamiento/renderizado WebGL, sin instalar herramientas.

El wrapper aplica el entorno solo a sus procesos hijos. Cargo ordinario trabaja
en modo offline; `predev`/`prebuild` generan bindings con `--mode no-install`,
`--no-opt`, `--locked` y `--offline`. No se necesita wasm-opt/Binaryen. Setup
prepara el CLI wasm-bindgen que wasm-pack necesita. Si falta una dependencia,
ejecutar setup explícitamente.

Si Chromium no arranca, revisar primero el error de `doctor` y las bibliotecas
con `ldd .tools/browsers/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`.
Setup no instala paquetes del sistema. En el host validado funcionó el build
fallback Ubuntu 24.04 de Playwright sin cambios del sistema.

## Build estático y pruebas

```sh
./scripts/dev npm --prefix apps/web run build
./scripts/dev npm --prefix apps/web run preview -- --port 4173

./scripts/dev cargo test --workspace --locked
./scripts/dev cargo test --workspace --release --locked
./scripts/dev cargo fmt --all -- --check
./scripts/dev cargo clippy --workspace --all-targets --locked -- -D warnings
./scripts/dev npm --prefix apps/web run typecheck
./scripts/dev npm --prefix apps/web run test
./scripts/dev npm --prefix apps/web run test:wasm
./scripts/dev npm --prefix apps/web run test:e2e
```

`test:e2e` regenera WASM release y el build, inicia su propio Vite preview en el
puerto 4173 y ejecuta Chromium. Debe estar libre ese puerto. Screenshots, vídeo y
tracing están desactivados; no se usan APIs de captura de imágenes. Las pruebas
comprueban DOM, modelos autorizados, red/MIME, dibujo WebGL y ciclo de recursos.

La salida distribuible es **`apps/web/dist/`**, con base relativa `./` por defecto.
Solo necesita servir archivos estáticos y `.wasm` con MIME `application/wasm`.
Para verificar una subruta explícita:

```sh
./scripts/dev npm --prefix apps/web run build -- --base=/cryptolab/
TEST_BASE_URL=http://127.0.0.1:4173/cryptolab/ TEST_BASE_PATH=/cryptolab/ ./scripts/dev npm --prefix apps/web run test:browser
```

Para volver al build predeterminado: `./scripts/dev npm --prefix apps/web run build`.
No se incluye backend, despliegue ni publicación automática.

## Arquitectura y contratos

| Directorio | Responsabilidad |
| --- | --- |
| `crates/crypto-core/` | Aritmética entera exacta, cifrados, errores y trazas. API original sin dependencias nuevas. |
| `crates/crypto-wasm/` | Validación estricta de objetos JS, DTO y serialización segura. |
| `apps/web/src/adapters/` | Inicialización/reintento, tipos explícitos y validación del transporte. |
| `apps/web/src/experience/` | Sesión, instantáneas, intentos, ejercicio y proyecciones autorizadas. |
| `apps/web/src/ui/` | Vistas HTML, controles y explicaciones en español. |
| `apps/web/src/machine/` | Escena procedural, arrastre, AnimationDirector y audio opcional. |

César usa +8 fijo: `ABCXYZ → IJKFGH`. Afín `(5,8)` transforma `ABC → INS` y
requiere `gcd(a,26)=1`. Ambos rechazan texto vacío y caracteres fuera de A–Z sin
normalizar. Afín conserva la clave i32 suministrada y la normalizada. La UI limita
a 256 puntos de código, sin truncar; el núcleo y la frontera WASM no tienen ese
límite de producto.

El interceptor recibe únicamente ciphertext, reglas públicas y sus candidatos;
la solución del ejercicio se entrega separadamente después de resolver o revelar.
Esto es una separación educativa, no confidencialidad contra quien inspecciona su
navegador. Los anillos consumen tablas alfabéticas Rust; sus ángulos nunca calculan
resultados. Las vistas previas no crean operaciones ni intentos calificados.

Herramientas, dependencias, `pkg/`, `target/`, `dist/` y resultados de pruebas están
ignorados. Se versionan ambos lockfiles. La revisión y los resultados ejecutados
se registran en [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md).

## Documentación

- [Visión](./docs/VISION.md), [arquitectura](./docs/ARCHITECTURE.md) y [decisiones](./docs/DECISIONS.md).
- [Fundamentos](./docs/specs/math-foundations.md), [César](./docs/specs/cipher-caesar.md) y [afín](./docs/specs/cipher-affine.md).
- [Recorrido](./docs/specs/learning-flow.md) y [perspectivas](./docs/specs/perspectives.md).
- [Escritorio](./docs/specs/desktop-experience.md), [máquina](./docs/specs/machine-interaction.md), [animación/audio](./docs/specs/animation-system.md) y [WASM](./docs/specs/wasm-integration.md).
- [Instrucciones para agentes](./AGENTS.md).

Chromium de escritorio es el navegador objetivo desde 1280×720. Ventanas menores
conservan acceso mediante desplazamiento; Firefox/Safari y aceptación móvil no
forman parte de este hito. La verificación automatizada de renderizado no evalúa
calidad artística ni audible: esas revisiones manuales siguen pendientes. Vite
advierte del tamaño del bundle que incluye Three.js/GSAP; la demo no usa assets 3D
externos.
