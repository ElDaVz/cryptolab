# CriptoLab — Decisiones técnicas

## ADR-001 — Frontera WASM de la primera demo

**Estado:** acordada para implementación futura; adaptador y build todavía pendientes.

### Contexto

La primera demo debe consumir los resultados y trazas del núcleo desde TypeScript, sin acoplar `crypto-core` al navegador ni perder exactitud numérica. Debe generar archivos estáticos utilizables en una subruta.

### Decisión

- Usar wasm-bindgen con DTO propios en `crypto-wasm` y Serde/serde-wasm-bindgen solo en ese adaptador. Exponer operaciones de cifrado y normalización mediante objetos y respuestas discriminadas, según [Integración WASM](./specs/wasm-integration.md).
- Transportar objetos planos y números JavaScript comprobados como enteros seguros, sin exponer directamente retornos `i64` como `BigInt`. Las cotas del dominio actualmente expuesto lo permiten; ampliarlo exige revisarlas.
- Generar el módulo ES con wasm-pack, destino `web`, e importar explícitamente el recurso WASM mediante Vite. Distribuir un build estático con base relativa, comprobando además una subruta explícita.
- Inicializar de forma asíncrona y ejecutar las pequeñas operaciones síncronamente después. No introducir un worker en esta entrega. `experience` conserva la responsabilidad de filtrar datos por perspectiva.

### Consecuencias y tradeoffs

Los DTO añaden una conversión explícita y pruebas de contrato, pero mantienen el dominio sin dependencias de transporte. Los números corrientes simplifican formularios y explicaciones; no autorizan convertir futuros enteros grandes con pérdida de precisión. La ejecución síncrona es adecuada para las consultas de 26 letras y mensajes de hasta 256 caracteres de la UI; aumentar el trabajo interactivo requiere reevaluar esa elección. Los binarios generados no se versionan: el build debe regenerarlos con herramientas y lockfiles fijados.

La escena procedural, la interacción y sus límites de producto se detallan en [Máquina](./specs/machine-interaction.md), [Escritorio](./specs/desktop-experience.md) y [Animaciones](./specs/animation-system.md). Esta decisión no implica que esas funcionalidades ya estén implementadas.
