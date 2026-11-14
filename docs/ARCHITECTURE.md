# CriptoLab — Arquitectura de software

## 1. Resumen

CriptoLab utilizará una arquitectura modular con separación entre lógica criptográfica, integración WebAssembly, gestión de la experiencia y representación visual.

El núcleo matemático se implementará en Rust y se compilará a WebAssembly para ejecutarse directamente en el navegador.

La interfaz utilizará TypeScript, Three.js y CSS.

No se requiere un servidor de aplicaciones.

## 2. Tecnologías

| Componente              | Tecnología                 |
| ----------------------- | -------------------------- |
| Núcleo matemático       | Rust                       |
| Integración             | WebAssembly y wasm-bindgen |
| Lenguaje del frontend   | TypeScript                 |
| Renderizado 3D          | Three.js                   |
| Estilos e interfaz      | CSS                        |
| Desarrollo frontend     | Vite                       |
| Modelado tridimensional | Blender                    |
| Pruebas Rust            | Cargo Test                 |
| Pruebas frontend        | Vitest                     |
| Animaciones 3D          | GSAP                       |

## 3. Principios arquitectónicos

### 3.1. Independencia del dominio

El núcleo criptográfico no deberá depender de Three.js, del navegador ni de WebAssembly.

Los algoritmos deben poder ejecutarse y probarse como funciones Rust independientes.

### 3.2. Fuente única de verdad

Rust será responsable de realizar las operaciones matemáticas.

TypeScript no deberá implementar versiones alternativas de los algoritmos criptográficos.

### 3.3. Adaptadores explícitos

La comunicación entre Rust y TypeScript se realizará mediante un adaptador WebAssembly.

Este adaptador convertirá los datos de entrada y salida sin alterar las reglas matemáticas.

### 3.4. Separación de representación y cálculo

La escena 3D consumirá resultados y trazas matemáticas producidos por Rust.

Las animaciones no determinarán los resultados criptográficos.

### 3.5. Estado controlado

La aplicación deberá mantener un estado de sesión coherente.

Los cambios de perspectiva no deberán modificar accidentalmente el mensaje, la clave o los resultados de una operación.

## 4. Componentes

### 4.1. crypto-core

Biblioteca Rust responsable de:

- Cifrado y descifrado.
- Validación de parámetros.
- Aritmética modular.
- Cálculo de MCD.
- Cálculo de inversos modulares.
- Generación de trazas matemáticas.
- Representación de errores del dominio.

No deberá contener código relacionado con interfaces gráficas.

### 4.2. crypto-wasm

Adaptador Rust responsable de:

- Exponer operaciones mediante wasm-bindgen.
- Convertir solicitudes y respuestas.
- Traducir errores del dominio a resultados consumibles por TypeScript.
- Mantener una interfaz pública estable.

No deberá duplicar algoritmos criptográficos.

### 4.3. experience

Módulo TypeScript responsable de:

- Gestionar el estado de la simulación.
- Coordinar acciones del usuario.
- Solicitar operaciones al adaptador WASM.
- Gestionar cambios de perspectiva.
- Determinar la información presentada en cada vista.

### 4.4. machine

Módulo responsable de:

- Escena tridimensional.
- Cámaras.
- Modelos y materiales.
- Animaciones.
- Selección e interacción con componentes.
- Representación de transformaciones matemáticas.

### Sistema de animaciones

Las animaciones utilizarán GSAP para transformar propiedades
de objetos Three.js y coordinar transiciones de cámara.

El módulo `AnimationDirector` interpretará las trazas
matemáticas producidas por Rust.

Las animaciones no deberán modificar los resultados
criptográficos ni implementar operaciones matemáticas.

Las secuencias deberán admitir cancelación, reinicio
y control de reproducción.

La [especificación de animaciones y audio](./specs/animation-system.md) concreta reproducción, cancelación y limpieza para la primera demo. La [máquina procedural](./specs/machine-interaction.md) consume tablas alfabéticas Rust y trazas autorizadas; sus consultas de previsualización no son operaciones de mensaje ni modifican la sesión interceptable.

### 4.5. ui

Módulo responsable de:

- Menús.
- Formularios.
- Paneles explicativos.
- Mensajes de error.
- Controles de accesibilidad.
- Presentación de resultados.

## 5. Flujo de una operación

1. El usuario introduce un mensaje y configura una clave.
2. El módulo `experience` construye una solicitud.
3. El adaptador WebAssembly transmite los parámetros al núcleo Rust.
4. `crypto-core` valida los datos y ejecuta el algoritmo.
5. Rust devuelve el resultado y una traza matemática estructurada.
6. `experience` actualiza el estado de la simulación.
7. `machine` representa las transformaciones mediante animaciones.
8. `ui` presenta los resultados y las explicaciones correspondientes.

## 6. Contratos de datos

Los contratos deberán especificarse antes de implementar cada algoritmo.

Una respuesta de cifrado podrá incluir conceptualmente:

- Identificador del algoritmo.
- Resultado del cifrado.
- Parámetros públicos aplicables.
- Secuencia de transformaciones.
- Metadatos educativos.

Las trazas deben ser datos estructurados, no únicamente cadenas de texto.

Esto permitirá generar explicaciones y animaciones sin interpretar expresiones matemáticas arbitrarias.

La estructura definitiva de los contratos se establecerá en las especificaciones funcionales.

La primera frontera pública para navegador se define en [Integración WASM](./specs/wasm-integration.md), con DTO del adaptador y tipos TypeScript explícitos. La decisión de transporte, exactitud numérica y empaquetado se registra en [ADR-001](./DECISIONS.md). La [experiencia de escritorio](./specs/desktop-experience.md) establece el límite de mensaje de la UI sin modificar el dominio Rust.

## 7. Gestión de perspectivas

Las perspectivas serán proyecciones de una misma sesión criptográfica.

### Emisor

Podrá consultar el mensaje original, la configuración de la máquina y el resultado cifrado.

### Interceptor

Recibirá únicamente la información definida como observable para un tercero.

No deberá recibir directamente la clave secreta ni las trazas privadas de la operación.

### Interior

Mostrará las operaciones matemáticas autorizadas para el modo educativo.

**Limitación de seguridad:** al ejecutarse completamente en el navegador, CriptoLab no puede garantizar confidencialidad frente a un usuario que inspeccione su propio entorno de ejecución. La separación de perspectivas es una característica de la simulación educativa.

Los modelos de información permitida, los contextos de las trazas y el acceso explícito a la solución del ejercicio se detallan en [Perspectivas](./specs/perspectives.md). El [recorrido de aprendizaje y sesión](./specs/learning-flow.md) define los borradores, la instantánea del último cifrado válido, la separación del ejercicio y las reglas de invalidación. Estas especificaciones concretan el trabajo de `experience` sin trasladar lógica de interfaz al núcleo Rust.

## 8. Estructura propuesta

```text
cryptolab/
├── AGENTS.md
├── README.md
├── Cargo.toml
├── docs/
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   └── specs/
│       ├── cipher-caesar.md
│       ├── cipher-affine.md
│       └── perspectives.md
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
            └── models/
```

## 9. Estrategia de pruebas

### Núcleo Rust

- Pruebas unitarias de operaciones matemáticas.
- Pruebas de cifrado y descifrado.
- Pruebas de parámetros inválidos.
- Pruebas de propiedades matemáticas.

### Integración WebAssembly

- Validación de tipos y contratos.
- Verificación de resultados.
- Propagación de errores.

### Frontend

- Pruebas del estado de sesión.
- Pruebas de cambio de perspectiva.
- Verificación de información visible por rol.
- Pruebas de interacción independientes del renderizado cuando sea posible.

### Validación visual

- Inspección manual de cámaras.
- Comprobación de animaciones.
- Verificación de correspondencia entre trazas y mecanismos visuales.

## 10. Restricciones

- No introducir un servidor HTTP sin una decisión arquitectónica documentada.
- No duplicar algoritmos matemáticos en TypeScript.
- No acoplar `crypto-core` al navegador.
- No introducir frameworks frontend adicionales sin justificar su necesidad.
- No utilizar los cifrados educativos para proteger información sensible.
- No asumir que una animación visual constituye una prueba de corrección matemática.

Cada decisión relevante deberá documentarse antes de consolidarse en la implementación.

## Documentos relacionados

- [Visión del proyecto](./VISION.md)
- [Especificación del cifrado afín](./specs/cipher-affine.md)
- [Recorrido de aprendizaje y sesión](./specs/learning-flow.md)
- [Perspectivas e información visible](./specs/perspectives.md)
- [Máquina e interacción](./specs/machine-interaction.md)
- [Experiencia de escritorio](./specs/desktop-experience.md)
- [Animaciones y audio](./specs/animation-system.md)
- [Integración WASM](./specs/wasm-integration.md)
- [Decisiones técnicas](./DECISIONS.md)
- [Instrucciones para agentes](../AGENTS.md)
