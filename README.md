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

1. Instalar Git y **Node 26.13.0 con su npm incluido**. Comprobar `node --version`.
   Setup instalará **npm 12.2.2** dentro de `.tools/npm/`; no hace falta cambiar
   el npm global. Node 26.13.0 incluye npm 11.20.0, válido para este arranque.
2. Preparar el compilador y las utilidades nativas del host:

   | Plataforma prevista | Requisitos previos |
   | --- | --- |
   | Linux x86_64 | `curl`, `tar`, compilador/enlazador C (`cc`) y bibliotecas compatibles con Chromium |
   | Windows x64 nativo | PowerShell, `curl.exe`, `tar.exe`, Visual Studio Build Tools con «Desktop development with C++» y Windows SDK; abrir Developer PowerShell x64 |
   | macOS Intel o Apple Silicon | `curl`, `tar` y Xcode Command Line Tools (`xcode-select --install`) |

   La validación local realizada es Linux. Windows y ambos macOS están configurados
   en CI; requieren resultados correctos allí antes de considerarlos verificados.
3. Clonar **la rama que contiene esta demo**, mientras no se haya integrado a `main`:

   ```sh
   git clone --branch feat/first-desktop-demo https://github.com/ElDaVz/cryptolab.git
   cd cryptolab
   ```

   Después de integrar el PR, usar `git clone https://github.com/ElDaVz/cryptolab.git`
   para obtener `main`. No mezclar instrucciones de esta demo con un checkout anterior.
4. Instalar las herramientas y dependencias fijadas desde la raíz del repositorio:

   ```sh
   node scripts/dev.mjs setup
   ```

   Necesita red hacia Rust, GitHub, npm y Playwright. Es seguro repetirlo. Usa
   el npm del host solo para preparar npm **12.2.2** local, sin scripts de instalación
   ni cambios globales. Repara una instalación local incorrecta o rota. Luego instala
   Rust **1.100.0**, targets nativo/WASM, rustfmt/Clippy, wasm-pack **0.13.1**,
   wasm-bindgen **0.2.105**, dependencias del lockfile y Chromium **159.0.8154.6**
   de Playwright **1.65.1**. En Apple Silicon compila wasm-pack nativamente durante
   setup, porque esa versión no publica binario macOS ARM; puede tardar más.
   Setup termina solo después de pruebas nativas, módulo WASM mínimo, build frontend
   y comprobación de dibujo WebGL en Chromium.
5. Comprobar el entorno sin instalar herramientas:

   ```sh
   node scripts/dev.mjs doctor
   ```

   Deben aparecer correctos los contratos de versiones/dependencias, Node, npm
   local, Rust, target WASM, wasm-pack, wasm-bindgen y Chromium/WebGL. Si falla,
   resolver el diagnóstico antes de continuar.
6. Iniciar la demo:

   ```sh
   node scripts/dev.mjs npm --prefix apps/web run dev
   ```

   Abrir la URL que imprime Vite (normalmente `http://localhost:5173`). Mantener
   abierta la terminal; detener con **Ctrl+C**. TypeScript/CSS se actualizan en vivo.
   Después de cambiar Rust, detener y reiniciar este comando para regenerar WASM.
7. Ejecutar las comprobaciones de la sección siguiente antes de entregar cambios.

Los comandos `node scripts/dev.mjs …` funcionan en PowerShell y shells Unix.
En Unix también existe el alias `./scripts/dev …`. El wrapper aplica el entorno
solo a sus procesos hijos: no cambia perfiles, PATH global ni instalaciones del sistema.
Herramientas en `.tools/`, dependencias y builds permanecen ignorados por Git.
Las versiones están en [scripts/versions.json](./scripts/versions.json), manifiestos y lockfiles.
CI lee la versión Node desde ese mismo archivo. Setup comprueba su coherencia y
usa `npm ci --engine-strict`. El wrapper invoca el CLI npm local con Node; añade
sus ejecutables al PATH hijo para que los scripts npm anidados y el preview de
Playwright usen también npm 12.2.2. Los comandos ordinarios no recurren al npm del host.
Los builds ordinarios usan Cargo offline y wasm-pack `--mode no-install --no-opt
--locked --offline`; si falta una dependencia, ejecutar setup explícitamente.

### Resolver problemas de preparación

- **Node incorrecto:** activar Node 26.13.0 antes de setup.
- **npm local ausente, incorrecto o roto:** ejecutar `node scripts/dev.mjs setup`.
  `doctor` muestra la ruta y versión local; no instala ni repara herramientas.
  No intentar resolverlo actualizando npm global: el proyecto usa su propia copia.
- **Declaraciones de versiones incompatibles:** revisar los pins, manifiestos y
  lockfiles indicados por el diagnóstico; no rebajar versiones para ocultar el fallo.
- **Compilador o enlazador ausente:** instalar los requisitos de la tabla. En Windows,
  comprobar que la terminal tenga el entorno de Visual Studio x64. `doctor` enlaza
  los ejecutables de pruebas nativas sin ejecutarlos.
- **Chromium no arranca:** leer su error en `doctor`. En Linux, localizar el binario
  bajo `.tools/browsers/` y consultar sus bibliotecas con `ldd <ruta-del-binario>`.
  Diagnosticar las bibliotecas ausentes antes de proponer paquetes del sistema.
  Setup no instala paquetes del sistema.
- **Falta un tool/target o dependencia offline:** repetir `node scripts/dev.mjs setup`.
- **Puerto ocupado:** abrir la URL alternativa de Vite en desarrollo. Para las pruebas,
  detener el preview propio que use 4173; no terminar procesos de otros proyectos.

## Build estático y pruebas

```sh
node scripts/dev.mjs npm --prefix apps/web run build
node scripts/dev.mjs npm --prefix apps/web run preview -- --port 4173

node scripts/dev.mjs cargo test --workspace --locked
node scripts/dev.mjs cargo test --workspace --release --locked
node scripts/dev.mjs cargo fmt --all -- --check
node scripts/dev.mjs cargo clippy --workspace --all-targets --locked -- -D warnings
node scripts/dev.mjs npm --prefix apps/web run format:check
node scripts/dev.mjs npm --prefix apps/web run test:tooling
node scripts/dev.mjs npm --prefix apps/web run typecheck
node scripts/dev.mjs npm --prefix apps/web run test
node scripts/dev.mjs npm --prefix apps/web run test:wasm
node scripts/dev.mjs npm --prefix apps/web run test:e2e
```

`test:e2e` regenera WASM release y el build, inicia su propio Vite preview en el
puerto 4173 y ejecuta Chromium. Debe estar libre ese puerto. Screenshots, vídeo y
tracing están desactivados; no se usan APIs de captura de imágenes. Las pruebas
comprueban DOM, modelos autorizados, red/MIME, dibujo WebGL y ciclo de recursos.

La salida distribuible es **`apps/web/dist/`**, con base relativa `./` por defecto.
Solo necesita servir archivos estáticos y `.wasm` con MIME `application/wasm`.
Para verificar una subruta explícita:

```sh
node scripts/dev.mjs npm --prefix apps/web run build -- --base=/cryptolab/
TEST_BASE_URL=http://127.0.0.1:4173/cryptolab/ TEST_BASE_PATH=/cryptolab/ node scripts/dev.mjs npm --prefix apps/web run test:browser
```

En PowerShell, las variables de la prueba de subruta se asignan así:

```powershell
$env:TEST_BASE_URL = "http://127.0.0.1:4173/cryptolab/"
$env:TEST_BASE_PATH = "/cryptolab/"
node scripts/dev.mjs npm --prefix apps/web run test:browser
Remove-Item Env:TEST_BASE_URL
Remove-Item Env:TEST_BASE_PATH
```

Para volver al build predeterminado: `node scripts/dev.mjs npm --prefix apps/web run build`.
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
- [Instrucciones para agentes](./AGENTS.md), [plantilla de PR](./.github/pull_request_template.md), [CI](./.github/workflows/ci.yml) y [pendientes del equipo](./docs/BACKLOG.md).

Chromium de escritorio es el navegador objetivo desde 1280×720. Ventanas menores
conservan acceso mediante desplazamiento; Firefox/Safari y aceptación móvil no
forman parte de este hito. La verificación automatizada de renderizado no evalúa
calidad artística ni audible: esas revisiones manuales siguen pendientes. Vite
advierte del tamaño del bundle que incluye Three.js/GSAP; la demo no usa assets 3D
externos.
