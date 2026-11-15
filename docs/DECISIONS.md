# CriptoLab — Decisiones técnicas

## ADR-001 — Frontera WASM de la primera demo

**Estado:** implementada y verificada en la primera demo.

### Contexto

La primera demo debe consumir los resultados y trazas del núcleo desde TypeScript, sin acoplar `crypto-core` al navegador ni perder exactitud numérica. Debe generar archivos estáticos utilizables en una subruta.

### Decisión

- Usar wasm-bindgen con DTO propios en `crypto-wasm` y Serde/serde-wasm-bindgen solo en ese adaptador. Exponer operaciones de cifrado y normalización mediante objetos y respuestas discriminadas, según [Integración WASM](./specs/wasm-integration.md).
- Transportar objetos planos y números JavaScript comprobados como enteros seguros, sin exponer directamente retornos `i64` como `BigInt`. Las cotas del dominio actualmente expuesto lo permiten; ampliarlo exige revisarlas.
- Generar el módulo ES con wasm-pack, destino `web`, e importar explícitamente el recurso WASM mediante Vite. Distribuir un build estático con base relativa, comprobando además una subruta explícita.
- Inicializar de forma asíncrona y ejecutar las pequeñas operaciones síncronamente después. No introducir un worker en esta entrega. `experience` conserva la responsabilidad de filtrar datos por perspectiva.

### Consecuencias y tradeoffs

Los DTO añaden una conversión explícita y pruebas de contrato, pero mantienen el dominio sin dependencias de transporte. Los números corrientes simplifican formularios y explicaciones; no autorizan convertir futuros enteros grandes con pérdida de precisión. La ejecución síncrona es adecuada para las consultas de 26 letras y mensajes de hasta 256 caracteres de la UI; aumentar el trabajo interactivo requiere reevaluar esa elección. Los binarios generados no se versionan: el build debe regenerarlos con herramientas y lockfiles fijados.

La escena procedural, la interacción y sus límites de producto se detallan en [Máquina](./specs/machine-interaction.md), [Escritorio](./specs/desktop-experience.md) y [Animaciones](./specs/animation-system.md). Su verificación ejecutada está documentada en el [registro de implementación](./IMPLEMENTATION.md).

## ADR-002 — Herramientas aisladas y builds sin instalaciones implícitas

**Estado:** implementada.

### Decisión

Fijar Rust 1.100.0 y targets nativo/WASM coincidentes bajo `.tools/rustup/` y
`.tools/cargo/`. El wrapper `scripts/dev` aplica rutas y variables únicamente al
proceso hijo; comprueba Node 26.13.0/npm 12.2.2. Setup explícito usa los lockfiles,
instala wasm-pack 0.13.1 y wasm-bindgen 0.2.105 y prepara el Chromium de Playwright.
Los builds ordinarios usan Cargo offline y wasm-pack `--mode no-install --no-opt`.
No se requiere Binaryen ni se descarga una herramienta al desarrollar.

### Consecuencias

El setup de binarios está limitado inicialmente a Linux x86_64 y requiere red;
las instalaciones del sistema permanecen intactas. Desactivar wasm-opt evita una
dependencia auxiliar y su instalación implícita, a cambio de no aplicar esa
optimización adicional; Cargo release sigue optimizando el módulo. El runtime
continúa siendo estático, sin backend. Se usa Chromium headless para las pruebas,
sin screenshots, vídeo ni trazas. El renderizado se verifica mediante consultas
WebGL y contadores del renderer; no sustituye una revisión artística/audible.

## ADR-003 — Entrada portable y validación por plataforma

**Estado:** implementada; verificada localmente en Linux. Pendiente de ejecución
CI en Windows y macOS. Amplía la restricción inicial de ADR-002.

### Decisión

Usar `node scripts/dev.mjs` como entrada común para Linux x64, Windows x64 nativo,
macOS Intel y Apple Silicon. Conservar `scripts/dev` como alias Unix. Compartir
rutas, tripletas, sufijos ejecutables y entorno en `scripts/tooling.mjs`; invocar
npm mediante Node y su CLI JS para preservar argumentos sin interpolación de shell.
Mantener las versiones fijadas y las descargas solo en setup. En Apple Silicon,
compilar wasm-pack 0.13.1 con Cargo `--locked` bajo `.tools/` porque esa versión
carece de binario macOS ARM. Rustup y ambos targets usan el mismo Rust fijado.

### Consecuencias

Cada host necesita su compilador nativo antes de setup; Windows usa MSVC y Windows
SDK, macOS las Command Line Tools. El primer setup ARM de macOS tarda más que una
descarga de binario, sin requerir Rosetta ni cambiar la versión de wasm-pack.
Doctor diagnostica y enlaza pruebas sin instalar. CI parte de checkouts limpios,
repite setup y ejecuta las mismas comprobaciones en cuatro runners. Un workflow
configurado no constituye evidencia de una ejecución correcta. La plantilla de
PR es Markdown; GitHub Actions comprueba los cambios y no crea ni integra PRs.

Referencias: [runners oficiales de GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
y [assets de wasm-pack 0.13.1](https://github.com/wasm-bindgen/wasm-pack/releases/expanded_assets/v0.13.1).
