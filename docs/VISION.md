# CriptoLab — Visión del proyecto

**Naturaleza:** Proyecto académico de Matemática Discreta

## 1. Descripción

CriptoLab es una aplicación web educativa e interactiva dedicada a explorar los fundamentos matemáticos de la criptografía clásica mediante la simulación tridimensional de una máquina de cifrado.

El proyecto combina teoría de números, programación en Rust y visualización 3D para ofrecer una experiencia inspirada en los videojuegos de exploración, mecanismos y resolución de acertijos.

Su propósito no es únicamente cifrar y descifrar mensajes, sino permitir que el usuario comprenda las transformaciones matemáticas, las limitaciones de los algoritmos y las diferencias entre producir, interceptar y analizar información cifrada.

## 2. Objetivo general

Desarrollar una aplicación interactiva que permita experimentar con algoritmos criptográficos clásicos, visualizar su funcionamiento matemático y explorar diferentes perspectivas de comunicación y criptoanálisis.

## 3. Objetivos específicos

- Implementar algoritmos criptográficos clásicos utilizando Rust.
- Aplicar conceptos de teoría de números, especialmente aritmética modular, congruencias, máximo común divisor e inversos modulares.
- Representar una máquina de cifrado mediante gráficos tridimensionales.
- Ofrecer perspectivas diferenciadas de emisor, interceptor y funcionamiento interno.
- Permitir la experimentación con claves, mensajes y transformaciones.
- Explicar los fundamentos y las limitaciones de cada algoritmo.
- Garantizar la corrección matemática mediante pruebas automatizadas.

## 4. Experiencia del usuario

CriptoLab presentará una máquina criptográfica ficticia en un entorno inspirado en la exploración y los dispositivos mecánicos antiguos.

La interacción principal se realizará mediante cámaras predefinidas, acercamientos, controles y animaciones.

La aplicación tendrá tres perspectivas:

### 4.1. Emisor

Permite manipular la máquina, seleccionar un algoritmo, introducir mensajes y ejecutar operaciones de cifrado.

El usuario observará los controles y la respuesta visual de la máquina con giros de engranajes al estilo de un candado de combinación giratorio.

### 4.2. Interceptor

Simula la perspectiva de un tercero que recibe un mensaje cifrado sin disponer inicialmente de la clave secreta.

El usuario podrá experimentar con métodos de criptoanálisis apropiados para cada algoritmo.

La interfaz deberá distinguir entre información pública, información interceptada e información secreta.

### 4.3. Mecanismo interno

Permite inspeccionar las operaciones matemáticas responsables de las transformaciones criptográficas.

La representación visual deberá corresponder con los resultados y las trazas producidas por el núcleo matemático.

## 5. Alcance

Para esta entrega, esta versión funcional incluirá:

- Una escena tridimensional con una máquina de cifrado simplificada.
- Cámaras predefinidas para las tres perspectivas.
- Implementación del cifrado César.
- Implementación del cifrado afín.
- Operaciones de aritmética modular, MCD e inverso modular.
- Visualización paso a paso de las transformaciones.
- Un ejercicio introductorio de criptoanálisis.
- Pruebas automatizadas del núcleo matemático.

## 6. Fuera del alcance inicial

No se contempla inicialmente:

- Un mundo abierto o desplazamiento libre.
- Multijugador o comunicación real entre usuarios.
- Autenticación, cuentas o bases de datos.
- Servicios backend remotos.
- Criptografía destinada a proteger información real.
- Implementaciones de producción de RSA, AES u otros algoritmos modernos.
- Simulación física detallada de todos los componentes mecánicos.

## 7. Principios del producto

**Rigor matemático:** toda transformación deberá corresponder a una operación verificable.

**Aprendizaje mediante experimentación:** el usuario debe poder modificar parámetros y observar sus consecuencias.

**Coherencia visual:** las animaciones deben representar el comportamiento del algoritmo, no sustituirlo.

**Separación de perspectivas:** cada vista debe respetar la información disponible para el rol correspondiente.

**Simplicidad progresiva:** las funcionalidades se incorporarán mediante incrementos pequeños y comprobables.

**Transparencia educativa:** los cifrados clásicos se presentarán como herramientas de aprendizaje, no como mecanismos seguros para proteger información actual.

**Experiencia del usuario** cada acción (aunque sea limitada) tendrá sus detalles, gestos y sonidos.

## 8. Criterios generales de éxito

CriptoLab será satisfactorio académicamente cuando:

1. Los algoritmos implementados produzcan resultados matemáticamente correctos.
2. El usuario pueda cifrar y descifrar mensajes válidos.
3. Las tres perspectivas permitan comprender aspectos diferentes de una misma operación.
4. La visualización interna explique las transformaciones mediante congruencias y operaciones modulares.
5. El proyecto pueda ejecutarse en un navegador compatible sin depender de un servidor de aplicaciones.
6. Las funcionalidades principales estén documentadas y verificadas mediante pruebas.

## 9. Identidad visual

La dirección artística buscará una estética de exploración, misterio y mecanismos antiguos.

Se priorizarán materiales como madera, papel, oro y metal, junto con iluminación cálida y controles mecánicos.

Las referencias a videojuegos de aventuras servirán como inspiración estética general, sin reproducir personajes, escenarios o recursos protegidos.

## 10. Evolución futura

Las posibles extensiones incluyen:

- Nuevos algoritmos criptográficos.
- Retos progresivos de criptoanálisis.
- Comparación de técnicas de cifrado.
- Estadísticas y análisis de frecuencias.
- Animaciones mecánicas más elaboradas.
- Experimentos de seguridad y complejidad computacional.

Estas extensiones no forman parte del compromiso inicial y deberán especificarse individualmente antes de implementarse.

## Documentos relacionados

- [Arquitectura técnica](./ARCHITECTURE.md)
- [Especificación del cifrado afín](./specs/cipher-affine.md)
- [Instrucciones para agentes](../AGENTS.md)
