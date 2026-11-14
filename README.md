# CriptoLab

Proyecto académico de Matemática Discreta: una aplicación web educativa para explorar la criptografía clásica y la teoría de números mediante una máquina de cifrado tridimensional e interactiva.

El objetivo es comprender las transformaciones matemáticas, experimentar con mensajes y claves y analizar las limitaciones de los cifrados clásicos. La experiencia visual estará inspirada en mecanismos antiguos, con madera, papel, metal e iluminación cálida.

## Estado actual

El repositorio contiene la visión, la arquitectura, la especificación del cifrado afín y la estructura inicial de directorios. Todavía no hay código de aplicación, manifiestos de compilación ni pruebas ejecutables; las funcionalidades descritas a continuación corresponden al alcance previsto.

La especificación detallada de César y los contratos de información de las perspectivas están pendientes. El registro de decisiones y la especificación del sistema de animaciones se completarán cuando corresponda.

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

**César:** el desplazamiento acordado para el cifrado es de ocho letras. Los contratos de entrada, salida, errores y trazas se definirán en su especificación antes de implementarlo.

**Afín:** utiliza el alfabeto ASCII `A`–`Z`, representado por los enteros de `0` a `25`, con las operaciones:

```text
Cifrado:    E(x) = (a × x + b) mod 26
Descifrado: D(y) = a⁻¹ × (y − b) mod 26
Condición:  gcd(a, 26) = 1
```

La clave `(5, 8)` transforma `ABC` en `INS`. Las claves no invertibles y los caracteres fuera del alfabeto admitido deberán producir errores explícitos. No se normalizarán automáticamente minúsculas, espacios, signos ni caracteres acentuados en esta primera versión. Las claves enteras equivalentes podrán normalizarse módulo 26, conservando resultados consistentes.

Cada carácter procesado tendrá una traza con su representación numérica, los parámetros, la operación modular y el resultado. Los requisitos y criterios de aceptación completos están en la [especificación del cifrado afín](./docs/specs/cipher-affine.md).

### Perspectivas educativas

| Perspectiva | Información y propósito previstos |
| --- | --- |
| Emisor | Introducir el mensaje, configurar la máquina y consultar la clave y el resultado cifrado. |
| Interceptor | Consultar el mensaje cifrado y explorar técnicas de criptoanálisis sin recibir directamente la clave original ni las trazas privadas. |
| Mecanismo interno | Inspeccionar las operaciones matemáticas mediante las trazas generadas por Rust. |

Las vistas serán proyecciones de una misma sesión; cambiar de perspectiva deberá conservar el mensaje, la clave y los resultados. Los contratos detallados de información se especificarán posteriormente. Esta separación tiene un propósito educativo y no garantiza confidencialidad frente a quien inspeccione su propio navegador.

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

### Estructura inicial

```text
cryptolab/
├── AGENTS.md
├── README.md
├── docs/
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   └── specs/
│       ├── cipher-affine.md
│       └── animation-system.md
├── crates/
│   ├── crypto-core/
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

Los directorios de implementación aún están vacíos. Las instrucciones de instalación, compilación y ejecución se añadirán junto con los manifiestos y la aplicación ejecutable.

## Desarrollo y verificación

El proyecto sigue desarrollo guiado por especificaciones (SDD). Antes de implementar una funcionalidad se consultan la visión, la arquitectura, las decisiones aceptadas y la especificación correspondiente. Los contratos y las pruebas de aceptación deben definirse antes de la implementación.

La verificación prevista incluye:

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
- [Especificación del cifrado afín](./docs/specs/cipher-affine.md).
- [Decisiones técnicas](./docs/DECISIONS.md) — pendiente de contenido.
- [Sistema de animaciones](./docs/specs/animation-system.md) — pendiente de contenido.
- [Instrucciones de desarrollo para agentes](./AGENTS.md).
