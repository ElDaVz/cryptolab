# Especificación — Integración WebAssembly y distribución

## 1. Alcance y límites

Añadir en un incremento posterior `crypto-wasm` al workspace Cargo y conectar el núcleo al frontend TypeScript estricto mediante wasm-bindgen. Esta especificación define el contrato; no crea todavía el adaptador, dependencias, scripts ni aplicación ejecutable.

`crypto-core` conserva su API y sus dependencias actuales. Los DTO de transporte y su conversión viven en `crypto-wasm`; se usarán Serde y serde-wasm-bindgen allí, sin añadir anotaciones de serialización ni lógica de navegador al dominio. La implementación frontend usa Vite, sin framework adicional ni plugins de carga WASM: importa el módulo generado y la URL del `.wasm` como recurso de Vite.

## 2. Inicialización y superficie pública

El adaptador TypeScript de `apps/web/src/adapters/` expone `initialize(): Promise<void>` y, una vez listo, `executeCipher(request)` y `normalizeAffineKey(request)`. Las dos operaciones son síncronas y retornan `Reply<T>`. La inicialización agrupa llamadas simultáneas en una sola promesa; tras un fallo se permite un nuevo intento sin reutilizar una promesa rechazada. Una llamada antes de estar listo retorna `NotReady`, sin ejecutar ni almacenar la solicitud.

El módulo WASM exporta las dos operaciones con esos mismos nombres y recibe solicitudes como objetos JavaScript, no parámetros `i32` expuestos que puedan sufrir coerción antes de validar. El adaptador TypeScript declara tipos explícitos para consumidores y trata los valores de la frontera como desconocidos hasta validarlos.

```typescript
type Direction = "encrypt" | "decrypt";
type Key = { a: number; b: number };
type PartialKey = { a: number | null; b: number | null };
type CipherRequest =
  | { algorithm: "caesar"; operation: Direction; message: string }
  | { algorithm: "affine"; operation: Direction; message: string; key: Key };
type NormalizeKeyRequest = PartialKey;
type NormalizeKeyValue = { suppliedKey: PartialKey; normalizedKey: PartialKey };
type CipherValue =
  | { algorithm: "caesar"; cipher: CipherData }
  | {
      algorithm: "affine";
      suppliedKey: Key;
      normalizedKey: Key;
      inverse: InverseData;
      cipher: CipherData;
    };
type Reply<T> = { ok: true; value: T } | { ok: false; error: ApiError };
declare function initialize(): Promise<void>;
declare function executeCipher(request: CipherRequest): Reply<CipherValue>;
declare function normalizeAffineKey(request: NormalizeKeyRequest): Reply<NormalizeKeyValue>;
```

`executeCipher` delega a la función Rust del algoritmo y operación indicados. `normalizeAffineKey` llama a `math::modulo(value,26)` para cada parámetro numérico y conserva `null` donde el campo aún no tiene un entero representable. No verifica invertibilidad ni completa campos con valores secretos: `{a:2,b:null}` se normaliza correctamente a `{a:2,b:null}`, aunque no sea una clave válida de cifrado. Esta forma parcial solo se permite en normalización; afín requiere ambos enteros en `executeCipher`.

## 3. Tipos de resultado

Todos los nombres de campos son camelCase; objetos planos, arrays ordinarios, booleanos, strings y números, sin `Map`, `BigInt`, referencias a memoria WASM ni strings JSON que deban analizarse. Se reconstruyen los objetos de transporte a partir de los tipos existentes del dominio.

```typescript
type Arithmetic =
  | { kind: "shift"; input: number; shift: number }
  | { kind: "affineEncrypt"; input: number; multiplier: number; offset: number }
  | { kind: "affineDecrypt"; input: number; inverse: number; offset: number };
type CipherStepData = {
  byteIndex: number;
  inputCharacter: string;
  inputValue: number;
  arithmetic: Arithmetic;
  unreduced: number;
  modulus: number;
  outputValue: number;
  outputCharacter: string;
};
type CipherData = { operation: Direction; output: string; steps: CipherStepData[] };
type EuclideanStepData = {
  dividend: number; divisor: number; quotient: number; remainder: number;
};
type ExtendedGcdData = {
  gcd: number; x: number; y: number; steps: EuclideanStepData[];
};
type InverseData = { inverse: number; derivation: ExtendedGcdData };
```

Cada carácter de una salida válida es una letra ASCII de un solo carácter. `byteIndex` conserva su semántica UTF-8, también en errores. La traza de descifrado conserva la resta antes de multiplicar y su valor negativo sin reducir cuando corresponda. La derivación afín corresponde al multiplicador normalizado, igual que en el núcleo actual.

### Exactitud numérica

No se exponen directamente funciones wasm-bindgen cuyo retorno `i64` imponga `BigInt`. El serializador se configura para objetos compatibles con JSON y números normales, manteniendo la comprobación de rango seguro; un valor fuera de `Number.MIN_SAFE_INTEGER..Number.MAX_SAFE_INTEGER` produce `InternalError`, nunca redondeo.

La garantía de este contrato procede del dominio actual: claves suministradas `i32`; letras/residuos 0–25; cifrado afín sin reducir como máximo 650; descifrado entre −625 y 625; derivación del inverso sobre operandos de 0–26; índices del destino wasm32. Todos son enteros exactamente representables como `number`. Las pruebas incluyen extremos `i32` y todos los factores válidos. Ampliar algoritmos, tipos o exportar ayudantes matemáticos generales exige revisar estas cotas y el contrato antes de hacerlo.

## 4. Validación y errores

La frontera Rust valida el objeto real aunque el llamador evite el adaptador TypeScript. No convierte números decimales, `NaN`, infinitos, strings numéricos, booleanos o enteros fuera de `i32`; tampoco convierte una clave ausente a cero. Se rechazan campos desconocidos, discriminantes no admitidos, arrays y valores nulos donde se requiere objeto/string/número. Las solicitudes de César no aceptan `key`.

El mensaje debe ser un string Unicode bien formado; se rechazan sustitutos UTF-16 aislados como `InvalidRequest`, antes de cualquier conversión que pudiera reemplazarlos. Los pares válidos se preservan: Rust rechaza su carácter si no pertenece a A–Z. La frontera no normaliza texto ni limita su longitud a 256: ese límite se aplica en la UI según [Escritorio](./desktop-experience.md), antes de invocar el mensaje completo.

```typescript
type ApiError =
  | { code: "NotReady" }
  | { code: "InvalidRequest"; field: string; reason: string }
  | { code: "EmptyMessage" }
  | { code: "InvalidCharacter"; character: string; byteIndex: number }
  | { code: "InvalidAffineKey"; suppliedA: number; normalizedA: number; gcd: number }
  | { code: "InternalError" };
```

`NotReady` lo produce el adaptador TypeScript. `InvalidRequest` identifica un campo como `request`, `algorithm`, `operation`, `message`, `key.a` o `key.b`; sus razones son `missing`, `unknownField`, `invalidType`, `unsupportedValue`, `notInteger`, `outOfRange` o `invalidUnicode`. No se utiliza el texto de `Display` como contrato. Una vez válida la forma de la solicitud, la prioridad de errores de dominio permanece en Rust: clave inválida antes de mensaje inválido en afín.

Los errores de dominio esperados nunca usan excepciones. Las fallas de transporte, conversión o runtime inesperadas se presentan como `InternalError` por el adaptador, sin filtrar detalles internos ni fabricar un resultado. Los errores de descarga/compilación del módulo rechazan `initialize()` y activan el estado de carga fallida. La UI traduce códigos y razones al español; no ejecuta un algoritmo alternativo.

## 5. Consumo y proyecciones

Tras inicializar, las operaciones de esta demo son pequeñas y síncronas; no se añade worker ni paralelismo. Las respuestas recibidas después de cambiar contexto o revisión no se publican como resultados vigentes. `experience` aplica el [recorrido](./learning-flow.md), construye las [proyecciones](./perspectives.md) y solicita las tablas alfabéticas como consultas de previsualización independientes.

`crypto-wasm` no conoce roles, cámaras, estados de ejercicio ni permisos. Su respuesta afín completa contiene información privada; no se entrega íntegra al interceptor. Los DTO del candidato y la solución original se mantienen asociados a sus contextos de origen.

## 6. Construcción reproducible y build estático

La futura implementación añadirá `crypto-wasm` como miembro del workspace y biblioteca `cdylib`/`rlib`. Requiere el target `wasm32-unknown-unknown`, wasm-pack, Node/npm y un Chromium de pruebas. Registrar y fijar las versiones exactas de herramientas verificadas al implementar la integración; mantener `Cargo.lock` y `apps/web/package-lock.json` en Git, usando `npm ci` en instalaciones repetidas. No se elige una versión de dependencias sin probar su compatibilidad ni se instala una herramienta como parte de este cambio documental.

Generar el módulo desde la raíz, con archivos bajo `crates/crypto-wasm/pkg/` ya excluidos de Git:

```sh
wasm-pack build crates/crypto-wasm --target web --out-dir pkg --out-name crypto_wasm --dev
wasm-pack build crates/crypto-wasm --target web --out-dir pkg --out-name crypto_wasm --release
```

El destino web produce un módulo ES inicializable, según la [documentación oficial de wasm-pack](https://github.com/wasm-bindgen/wasm-pack/blob/master/docs/src/commands/build.md). Importar su JS y el `.wasm` mediante `?url`; pasar esa URL al inicializador generado según sus declaraciones TypeScript. No reconstruir rutas absolutas a `pkg`, depender de `file://` ni mantener una segunda copia manual en `public/`.

El `package.json` futuro de `apps/web` debe ofrecer estos comandos desde la raíz:

| Comando propuesto | Contrato |
| --- | --- |
| `npm --prefix apps/web ci` | Instalar las dependencias fijadas por el lockfile. |
| `npm --prefix apps/web run dev` | Regenerar WASM en perfil dev mediante `predev` y arrancar Vite. Cambiar Rust requiere reiniciar este comando; no se promete vigilancia automática de Rust. |
| `npm --prefix apps/web run typecheck` | Verificar TypeScript estricto sin emitir archivos. |
| `npm --prefix apps/web run test` | Ejecutar Vitest una vez, incluyendo estado, proyecciones y DOM. |
| `npm --prefix apps/web run build` | Regenerar WASM release mediante `prebuild`, comprobar tipos y generar `apps/web/dist/` con Vite. |
| `npm --prefix apps/web run preview` | Servir el build estático localmente con Vite preview. |
| `npm --prefix apps/web run test:e2e` | Preparar el build y ejecutar Playwright con Chromium sobre su preview, incluyendo las verificaciones del módulo WASM real. |

Configurar `base: "./"` como valor predeterminado de Vite. La [guía oficial de Vite](https://vite.dev/guide/build.html) documenta tanto la salida para hosting estático como las bases relativas. Verificar además un build con `npm --prefix apps/web run build -- --base=/cryptolab/` y su preview con `npm --prefix apps/web run preview -- --base=/cryptolab/`: HTML, JS y WASM deben cargar desde esa subruta, sin accesos a rutas de desarrollo ni a la raíz del host. El host estático sirve `.wasm` con MIME `application/wasm`.

Vite dev/preview son herramientas de desarrollo y comprobación de archivos estáticos, no un backend del producto. Publicar el sitio no forma parte de este hito. La configuración de [Serde para objetos compatibles con JSON y enteros seguros](https://docs.rs/serde-wasm-bindgen/latest/serde_wasm_bindgen/struct.Serializer.html) sirve como referencia para el transporte.

## 7. Criterios de aceptación

Escenarios para la futura integración, no pruebas WASM/navegador ejecutadas en este cambio documental.

| ID | Escenario verificable |
| --- | --- |
| WA-01 | En Chromium, el WASM real cifra/descifra los vectores César, afín y del ejercicio con salida y traza equivalentes a las del núcleo nativo. |
| WA-02 | Solicitudes mal formadas, claves decimales, strings, extremos fuera de `i32`, `NaN`, infinitos y parámetros extra se rechazan sin coerción, wrap ni panic. Un sustituto aislado se rechaza y un par Unicode válido llega intacto a validación de dominio. |
| WA-03 | Extremos `i32`, claves negativas y equivalentes conservan valor suministrado y normalizado; normalizar `{a:2,b:null}` no exige invertibilidad ni inventa `b`. |
| WA-04 | Los objetos recibidos tienen los campos camelCase, discriminantes y tipos especificados; no hay JSON textual, `Map` ni `BigInt`. Todo entero es seguro y toda traza conserva su operación y byteIndex. |
| WA-05 | Vacío, carácter inválido y clave inválida conservan códigos, datos y prioridad Rust. Un error interno no publica resultados parciales. |
| WA-06 | Inicializaciones simultáneas comparten carga; un fallo permite reintentar sin perder borradores. Una llamada prematura da `NotReady`; reintentar no ejecuta solicitudes pasadas. |
| WA-07 | La UI rechaza 257 caracteres, pero una llamada directa con 257 letras válidas llega al núcleo sin imponer ese límite de producto. Una previsualización no crea una operación de usuario. |
| WA-08 | Desde un checkout limpio y herramientas fijadas se regeneran módulo y build sin `pkg` versionado; se ejecutan las pruebas nativas y las de frontera real en Chromium. |
| WA-09 | El build release funciona en raíz y `/cryptolab/`, descargando su propio WASM con MIME correcto; no necesita un servidor de aplicaciones ni archivos fuera de `dist`. |
| WA-10 | La integración mantiene `crypto-core` independiente, filtra por perspectiva en `experience` y no duplica algoritmos en TypeScript ni serializa referencias privadas al interceptor. |

## Documentos relacionados

- [Arquitectura](../ARCHITECTURE.md)
- [Fundamentos matemáticos](./math-foundations.md)
- [César](./cipher-caesar.md)
- [Afín](./cipher-affine.md)
- [Recorrido](./learning-flow.md)
- [Perspectivas](./perspectives.md)
- [Máquina](./machine-interaction.md)
- [Escritorio](./desktop-experience.md)
