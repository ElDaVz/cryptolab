# CriptoLab

Proyecto académico de Matemática Discreta: una aplicación web educativa para explorar la criptografía clásica y la teoría de números mediante una máquina de cifrado tridimensional e interactiva.

El objetivo es comprender las transformaciones matemáticas, experimentar con mensajes y claves y analizar las limitaciones de los cifrados clásicos. La experiencia visual estará inspirada en mecanismos antiguos, con madera, papel, metal e iluminación cálida.

## Estado actual

El repositorio incluye un workspace Cargo con la biblioteca `crypto-core`: aritmética modular, MCD, Euclides extendido, inverso modular y cifrado/descifrado César y afín, con errores tipados, trazas estructuradas y pruebas automatizadas. El núcleo usa entradas numéricas `i32` e intermedios exactos `i64`, sin dependencias externas.

Ya están especificados el recorrido de aprendizaje, las perspectivas, la máquina e interacción, la experiencia de escritorio, las animaciones/audio y la integración WebAssembly. La aplicación web, las proyecciones, el adaptador WASM y la escena siguen pendientes de implementación; el alcance visual descrito a continuación es el previsto. El registro de decisiones recoge el contrato de integración acordado para esta primera demo.

## Alcance inicial

- Máquina de cifrado 3D simplificada con cámaras predefinidas.
- Cifrado y descifrado César con un desplazamiento fijo de ocho letras.
- Cifrado y descifrado afín.
- Aritmética modular, máximo común divisor e inverso modular.
- Trazas matemáticas estructuradas y visualización paso a paso.
- Perspectivas de emisor, interceptor y mecanismo interno.
- Un ejercicio introductorio de criptoanálisis.
- Pruebas automatizadas de corrección matemática y del comportamiento de la aplicación.

### Cifrados

**César:** usa un desplazamiento fijo de ocho letras sobre `A`–`Z`, con vuelta al inicio del alfabeto: `ABC → IJK`, `XYZ → FGH`. El descifrado resta ocho. El contrato completo está en su [especificación](./docs/specs/cipher-caesar.md).

**Afín:** utiliza el alfabeto ASCII `A`–`Z`, representado por los enteros de `0` a `25`, con las operaciones:

```text
Cifrado:    E(x) = (a × x + b) mod 26
Descifrado: D(y) = a⁻¹ × (y − b) mod 26
Condición:  gcd(a, 26) = 1
```

La clave `(5, 8)` transforma `ABC` en `INS`. Ambos cifrados rechazan mensajes vacíos y caracteres fuera de `A`–`Z`, sin normalizar minúsculas, espacios, signos ni caracteres acentuados. Afín normaliza ambos parámetros enteros módulo 26, incluidos los negativos, y rechaza multiplicadores no invertibles antes de validar el mensaje. Los errores son explícitos y no devuelven resultados parciales.

Cada carácter procesado tiene una traza con su representación numérica, los operandos, el valor antes de la reducción modular y el resultado. Afín conserva la clave suministrada, la normalizada y la derivación del inverso mediante Euclides extendido. Los requisitos y criterios de aceptación completos están en la [especificación del cifrado afín](./docs/specs/cipher-affine.md).

### Perspectivas educativas

| Perspectiva | Información y propósito previstos |
| --- | --- |
| Emisor | Cifrar o descifrar con César y afín, configurar su clave y consultar su propio resultado. |
| Interceptor | Examinar el último cifrado válido de la sesión o un ejercicio preparado; probar claves afines sin recibir la clave original ni sus trazas privadas. César utiliza el desplazamiento público +8. |
| Mecanismo interno | Inspeccionar las trazas Rust de la operación del emisor o del intento candidato. La solución original del ejercicio solo está disponible tras resolverlo o revelarlo explícitamente. |

Las vistas serán proyecciones de una misma sesión; cambiar de perspectiva conservará el trabajo de cada contexto. Los campos permitidos y excluidos se definen en [Perspectivas](./docs/specs/perspectives.md). Esta separación tiene un propósito educativo y no garantiza confidencialidad frente a quien inspeccione su propio navegador.

### Recorrido de aprendizaje previsto

La aplicación comenzará con una introducción en español que se puede omitir y repetir: letras y números, César con vuelta al inicio del alfabeto, cifrado afín y descifrado mediante el inverso modular. Después abrirá el laboratorio libre. Repetir la introducción no modificará el trabajo del laboratorio.

El ejercicio afín permitirá probar candidatos manualmente y enviar una clave para calificarla. Ofrecerá una pista que revela el multiplicador y una acción explícita para revelar la solución; distinguirá entre `Sin resolver`, `Resuelto` y `Revelado`. Sus datos y candidatos permanecerán separados de los del emisor. Todo el progreso será en memoria y se descartará al recargar.

Las reglas de edición, invalidación de resultados, instantáneas interceptables, ayuda y reinicio están en el [recorrido de aprendizaje y sesión](./docs/specs/learning-flow.md). Estos comportamientos están especificados, pero aún no implementados.

### Primera demo de escritorio prevista

La demo completa se dirigirá inicialmente a Chromium de escritorio, desde 1280×720. Mostrará una máquina procedural sobre una mesa, con anillos concéntricos, indicador fijo, perillas `a`/`b` editables y tres cámaras predefinidas. La correspondencia exterior se obtendrá de Rust; los giros seleccionarán una pareja de letras sin representar la multiplicación afín como una rotación uniforme.

Los formularios y explicaciones estarán en paneles flotantes con equivalentes de teclado para los controles 3D. La UI admitirá hasta 256 caracteres sin truncar ni normalizar el texto; el núcleo Rust conservará su dominio actual. La salida completa aparecerá inmediatamente y la animación de un carácter por segundo empezará solo por solicitud. Habrá movimiento reducido, audio mecánico opcional inicialmente silenciado y uso textual completo si falla WebGL.

La entrega incluirá desarrollo local y build estático, sin publicación automática. Los contratos están en [Máquina e interacción](./docs/specs/machine-interaction.md), [Escritorio](./docs/specs/desktop-experience.md), [Animaciones y audio](./docs/specs/animation-system.md) e [Integración WASM](./docs/specs/wasm-integration.md).

## Tecnologías y arquitectura

| Componente | Tecnología y responsabilidad |
| --- | --- |
| `crypto-core` | Rust: algoritmos, validación, aritmética entera exacta, errores y trazas; independiente del navegador y de WebAssembly. |
| `crypto-wasm` | WebAssembly y wasm-bindgen: adaptación de solicitudes, resultados y errores sin duplicar lógica matemática. |
| `experience` | TypeScript estricto: estado de sesión, acciones, solicitudes a WASM y proyección de información por perspectiva. |
| `machine` | Three.js: escena, cámaras, materiales e interacción con la máquina. |
| `AnimationDirector` | GSAP: coordinación de animaciones a partir de las trazas, con cancelación, reinicio, control de reproducción y limpieza de recursos. |
| `ui` | TypeScript y CSS: formularios, resultados, explicaciones, errores y controles de accesibilidad. |
| Herramientas | Vite para desarrollo frontend, Blender para modelado, Cargo Test y Vitest para pruebas. |

El flujo previsto es: entrada del usuario → `experience` → adaptador WASM → `crypto-core` → resultado y traza → estado de sesión → representación 3D e interfaz.

Rust será la única fuente de los resultados matemáticos. TypeScript y las animaciones consumirán esos resultados sin recalcularlos ni modificarlos. La aplicación ejecutará su lógica en el navegador mediante WebAssembly, sin requerir un servidor de aplicaciones.

### Estructura

```text
cryptolab/
├── AGENTS.md
├── README.md
├── Cargo.toml
├── Cargo.lock
├── docs/
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   └── specs/
│       ├── math-foundations.md
│       ├── cipher-caesar.md
│       ├── cipher-affine.md
│       ├── learning-flow.md
│       ├── perspectives.md
│       ├── machine-interaction.md
│       ├── desktop-experience.md
│       ├── wasm-integration.md
│       └── animation-system.md
├── crates/
│   ├── crypto-core/
│   │   ├── Cargo.toml
│   │   └── src/
│   └── crypto-wasm/
└── apps/
    └── web/
        ├── src/
        │   ├── adapters/
        │   ├── experience/
        │   ├── machine/
        │   └── ui/
        └── public/
```

`crypto-core` es el único miembro del workspace. Los directorios de `crypto-wasm` y del frontend siguen vacíos.

## Compilación y uso del núcleo

Requiere Rust y Cargo 1.85 o posteriores (edición 2024). Desde la raíz del repositorio:

```sh
cargo build --workspace --offline
cargo test --workspace --offline
cargo test --workspace --release --offline
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --offline -- -D warnings
cargo doc --workspace --no-deps --offline
```

Los comandos de formato y lint requieren `rustfmt` y Clippy instalados. El núcleo es una biblioteca, sin ejecutable ni servidor. No requiere descargas de dependencias. Ejemplo desde Rust:

```rust
use crypto_core::{affine, caesar, CryptoError};

fn main() -> Result<(), CryptoError> {
    let key = affine::AffineKey { a: 5, b: 8 };
    let encrypted = affine::encrypt("ABC", key)?;
    assert_eq!(encrypted.cipher.output, "INS");
    assert_eq!(affine::decrypt("INS", key)?.cipher.output, "ABC");
    assert_eq!(caesar::encrypt("XYZ")?.output, "FGH");
    Ok(())
}
```

Los contratos públicos son tipos Rust, sin serialización WASM todavía. Los resultados completos del núcleo contienen información privada de la simulación; los futuros adaptadores de perspectivas deberán proyectar solamente los datos autorizados para cada vista.

## Hoja de ruta de la primera demo

Estas etapas están planificadas, no implementadas. Los comandos futuros de WASM/npm y sus requisitos se definen en [Integración WASM](./docs/specs/wasm-integration.md); todavía no existen el paquete frontend, sus scripts ni el adaptador. Las instrucciones Cargo anteriores sí corresponden al código actual.

| Etapa | Entrega y comprobación para completarla |
| --- | --- |
| 1. Frontera WASM | Añadir `crypto-wasm`, fijar herramientas/dependencias y generar bindings; verificar solicitudes, errores, exactitud y paridad con Rust mediante las pruebas WA. |
| 2. Estado y perspectivas | Implementar `experience` sin depender del renderizado; verificar el recorrido FL y las proyecciones PE, incluidas invalidación, contexto y solución del ejercicio. |
| 3. Interfaz completa | Implementar introducción, ambos cifrados, ejercicio, resultados y trazas textuales con teclado; verificar DE para estado, DOM, límites y errores. |
| 4. Máquina y presentación | Construir escena procedural, cámaras, perillas, reproducción y audio opcional; verificar MI/AN, movimiento reducido, limpieza y degradación textual. |
| 5. Demo distribuible | Ejecutar el recorrido completo con Playwright/Chromium sobre el build release real, también en `/cryptolab/`, y revisar manualmente legibilidad, encuadres y sonido. Registrar versiones y resultados ejecutados. |

La prueba de extremo a extremo debe completar/omitir y repetir la introducción, cifrar y descifrar con César y afín, inspeccionar las trazas, interceptar la sesión y resolver o revelar/reiniciar el ejercicio en sesiones separadas. Debe comprobar también la ausencia de datos privados en el modelo interceptor, cancelación de reproducción, entrada inválida, límite de 256 caracteres y funcionamiento con movimiento reducido o sin WebGL. La inspección visual complementa estas pruebas; no demuestra por sí sola corrección matemática.

## Desarrollo y verificación

El proyecto sigue desarrollo guiado por especificaciones (SDD). Antes de implementar una funcionalidad se consultan la visión, la arquitectura, las decisiones aceptadas y la especificación correspondiente. Los contratos y las pruebas de aceptación deben definirse antes de la implementación.

Las pruebas del núcleo verifican vectores conocidos, casos límite, errores, trazas y reversibilidad para las 312 claves afines normalizadas válidas. La estrategia general incluye:

- **Rust:** vectores conocidos, casos límite, parámetros inválidos, reversibilidad, inversos modulares y consistencia entre resultados y trazas.
- **WebAssembly:** contratos de entrada y salida, resultados y propagación de errores.
- **Frontend:** estado de sesión, cambios de perspectiva, información visible por rol e interacción.
- **Validación visual:** cámaras, animaciones y correspondencia con las trazas matemáticas; esta revisión complementa las pruebas automatizadas.

## Límites del proyecto

Los cifrados clásicos se utilizarán exclusivamente con fines educativos: no ofrecen seguridad moderna ni deben emplearse para proteger información real.

El alcance inicial excluye mundo abierto, multijugador, comunicación real entre usuarios, autenticación, bases de datos, servicios backend remotos, criptografía moderna de producción y simulación física detallada. Nuevos algoritmos, retos avanzados y análisis de frecuencias requerirán especificaciones propias.

## Documentación

- [Visión y alcance del producto](./docs/VISION.md).
- [Arquitectura de software](./docs/ARCHITECTURE.md).
- [Especificación de fundamentos matemáticos](./docs/specs/math-foundations.md).
- [Especificación del cifrado César](./docs/specs/cipher-caesar.md).
- [Especificación del cifrado afín](./docs/specs/cipher-affine.md).
- [Recorrido de aprendizaje y sesión](./docs/specs/learning-flow.md).
- [Perspectivas e información visible](./docs/specs/perspectives.md).
- [Máquina e interacción](./docs/specs/machine-interaction.md).
- [Experiencia de escritorio](./docs/specs/desktop-experience.md).
- [Integración WebAssembly](./docs/specs/wasm-integration.md).
- [Decisiones técnicas](./docs/DECISIONS.md).
- [Animaciones y audio](./docs/specs/animation-system.md).
- [Instrucciones de desarrollo para agentes](./AGENTS.md).
