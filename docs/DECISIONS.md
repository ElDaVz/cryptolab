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

**Estado:** implementada; alcance de plataformas actualizado por ADR-005.

### Decisión

Usar `node scripts/dev.mjs` como entrada común para Linux x64 y Windows x64 nativo.
Conservar `scripts/dev` como alias Unix. Compartir rutas, tripletas, sufijos
ejecutables y entorno en `scripts/tooling.mjs`; invocar npm mediante Node y su CLI
JS para preservar argumentos sin interpolación de shell. Mantener las versiones
fijadas y las descargas solo en setup. Rustup y ambos targets usan el mismo Rust.

### Consecuencias

Cada host necesita su compilador nativo antes de setup; Windows usa MSVC y Windows
SDK. Doctor diagnostica y enlaza pruebas sin instalar. CI parte de checkouts limpios,
repite setup y ejecuta las mismas comprobaciones en los dos runners soportados.
Un workflow configurado no constituye evidencia de una ejecución correcta.
La plantilla de PR es Markdown; GitHub Actions comprueba cambios y no crea ni integra PRs.

Referencias: [runners oficiales de GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
y [assets de wasm-pack 0.13.1](https://github.com/wasm-bindgen/wasm-pack/releases/expanded_assets/v0.13.1).

## ADR-004 — npm local explícito y coherencia de versiones en CI

**Estado:** implementada; el usuario confirmó CI correcto en Ubuntu y Windows.

### Contexto y decisión

El primer CI se detuvo al exigir npm 12.2.2 antes de instalarlo: Node 26.13.0
incluye npm 11.20.0. Mantener ambos pins requiere provisionar npm por separado.
Setup valida Node, utiliza el npm del host para instalar npm 12.2.2 sin scripts
bajo una carpeta temporal de `.tools/`, comprueba su versión y lo coloca en
`.tools/npm/`. Las repeticiones conservan una copia correcta o reparan una rota;
un fallo de instalación no reemplaza la anterior. No se cambia npm global.

Los comandos ordinarios invocan el CLI npm local mediante Node y nunca recurren
al npm del host. Su directorio de ejecutables encabeza el PATH de los hijos para
conservar la versión en scripts anidados, incluido Playwright preview. Doctor
solo diagnostica. La preparación requiere Node fijado y un npm del host funcional;
no exige que ese npm tenga ya la versión del proyecto.

CI obtiene Node de `scripts/versions.json`. Setup valida pins contra manifiestos,
lockfiles y wasm-bindgen antes de descargar; después de `npm ci --engine-strict`
valida también versiones instaladas y el Chromium declarado por Playwright.
Doctor repite esas comprobaciones sin instalar. `.gitattributes` mantiene LF en
checkouts de texto para que el formato sea estable entre sistemas; el lector de
contratos Cargo tolera también CRLF. Esta decisión amplía ADR-002/003
para corregir el requisito inicial de proporcionar npm exacto manualmente.

### Consecuencias

El primer setup requiere una descarga adicional pequeña y espacio para una copia
local de npm. Las versiones siguen siendo estrictas y los builds no descargan
herramientas. Las discrepancias se detectan explícitamente; no se rebajan pins ni
se ocultan checks fallidos. La validación de metadatos no sustituye la ejecución
real de compilación, pruebas y navegador en cada sistema.

Referencias: [npm incluido en Node 26.13.0](https://raw.githubusercontent.com/nodejs/node/v26.13.0/deps/npm/package.json)
y [requisitos de npm 12.2.2](https://raw.githubusercontent.com/npm/cli/v12.2.2/package.json).

## ADR-005 — Entorno soportado limitado a Ubuntu y Windows

**Estado:** aprobada por el usuario e implementada.

Mantener únicamente `ubuntu-24.04` y `windows-2022` en CI y sus plataformas x64
en el setup. Se retiran las demás tripletas y la compilación auxiliar de wasm-pack
que requerían. Las plataformas fuera de esta lista se rechazan explícitamente.
El usuario confirmó checks correctos en ambos hosts retenidos. No se cambian pins,
lockfiles ni comprobaciones del resto de la matriz. Esta decisión actualiza ADR-003.
