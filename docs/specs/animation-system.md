# Especificación — Animaciones y audio

## 1. Responsabilidad

`AnimationDirector`, dentro de `machine`, coordina GSAP para anillos, indicadores, perillas y cámaras. Consume pasos, tablas y permisos derivados de resultados Rust ya calculados. No modifica resultados, claves, estados de ejercicio ni determina caracteres por ángulos o tiempos de animación.

Esta especificación corresponde a la primera demo de escritorio y todavía no está implementada. Se aplica al [recorrido](./learning-flow.md), la [máquina](./machine-interaction.md) y sus [contextos autorizados](./perspectives.md).

## 2. Selección y reproducción

Una operación válida publica inmediatamente su salida completa, selecciona el paso 0 y queda en pausa. Hay un paso por carácter; la ecuación completa del paso se muestra junta. Las divisiones de Euclides se consultan en un panel separado, sin fases animadas obligatorias.

El índice de paso pertenece al estado de presentación del resultado y no es una posición de letra deducida de la escena. Cada contexto conserva su selección mientras su resultado siga vigente, pero cambiar de contexto pausa la reproducción y nunca la reanuda automáticamente al volver. Un cálculo nuevo, aunque repita entradas, sustituye al anterior y comienza en 0.

| Acción | Semántica |
| --- | --- |
| `Reproducir` | Desde una selección pausada avanza hacia el siguiente carácter. Si ya está al final, vuelve primero a 0; con un solo carácter permanece en pausa. Desde una pausa a mitad de transición reanuda esa transición. |
| `Pausar` | Congela la transición en curso; mantiene seleccionado el último paso asentado hasta completar la transición al siguiente. |
| `Anterior` / `Siguiente` | Pausa, descarta una transición parcial y selecciona el vecino del último paso asentado, sin transición. En los extremos el botón correspondiente está deshabilitado. |
| Seleccionar una ocurrencia | Pausa y asienta directamente ese índice, incluso si su letra coincide con otra ocurrencia. |
| `Volver al inicio` | Pausa, descarta la transición parcial y asienta el paso 0. No borra el resultado ni recalcula el mensaje. |
| Fin de secuencia | Asienta el último paso y queda en pausa, sin bucle automático. |

Sin resultado vigente no hay índice seleccionado y los controles están deshabilitados. Una vista previa alfabética no habilita reproducción de mensajes ni crea una selección de carácter.

## 3. Coordinación temporal y cancelación

La cadencia inicial es una transición por segundo: cada segundo lleva de un paso asentado al siguiente, sin esperas adicionales ni selector de velocidad. Los dos anillos giran juntos por el trayecto angular más corto; en empate de media vuelta se usa sentido horario. El ángulo es una coordenada de presentación de la posición Rust, nunca un resultado matemático. Al asentarse el destino cambian el resaltado, índice y ecuación; durante el giro se identifica como transición entre esos pasos.

Las cámaras usan transiciones de 0.6 segundos y las perillas de 0.12 segundos para alcanzar una posición de control ya elegida. Durante arrastre, el valor cambia por muescas; el tween visual puede reemplazarse por el nuevo destino sin acumular transiciones. No se interpolan claves numéricas, tablas de salida ni permisos como si fueran estados válidos intermedios.

Cada resultado/configuración tiene una revisión y un contexto asociados. Antes de ejecutar cualquier callback de GSAP, se comprueba que sigue perteneciendo a la revisión activa. Detener una secuencia mata sus tweens, timelines y callbacks pendientes; una finalización antigua no cambia selección, sonido ni etiquetas.

| Evento | Tratamiento |
| --- | --- |
| Editar mensaje, clave, algoritmo u operación | Cancelar inmediatamente y retirar el resultado invalidado de todos sus consumidores. Actualizar únicamente la previsualización válida que corresponda. |
| Cambiar perspectiva o fuente | Pausar, asentar el último índice vigente y terminar arrastres. Retirar datos no autorizados antes de mover cámara o aplicar el nuevo contexto; nunca hacer fundido de textos privados. |
| Reemplazar instantánea / reiniciar ejercicio | Invalidar solo los contextos afectados según el recorrido y cancelar sus secuencias; retirar una solución abierta si se reinicia el ejercicio. |
| Repetir introducción | Pausar el laboratorio, usar ejemplos aislados y restaurar el contexto sin autoplay al salir. |
| Ocultar la pestaña | Pausar, descartar la transición parcial y asentar el último paso; no avanzar ni reproducir sonidos acumulados al volver. |
| Perder WebGL / destruir escena | Cancelar tweens, liberar recursos y eventos, y detener el bucle de renderizado de esa escena. La selección asentada se conserva para la vista textual. |

En modo textual, el mismo estado de reproducción puede avanzar con la misma cadencia mediante un único temporizador controlado por el director; no requiere un renderer vivo. Debe seguir admitiendo pausa y cancelación. Los resultados y la selección son independientes de los recursos GPU.

## 4. Movimiento reducido

Si el sistema o el usuario solicita movimiento reducido, cámaras, perillas y anillos se colocan directamente en su estado objetivo, sin interpolación. `Reproducir` sigue avanzando selecciones a intervalos de un segundo; no produce movimiento interpolado. Cambiar esa preferencia durante una transición pausa y asienta el último paso seleccionado; reanudar siempre requiere una acción explícita.

Las animaciones de cámara nunca bloquean navegación ni formularios. No se añaden destellos, vibraciones, partículas ni desplazamiento ambiental continuo en esta entrega.

## 5. Sonido opcional

`Sonido` inicia desactivado en cada carga; su preferencia vive solo en memoria. Al activarlo explícitamente se crea/reanuda el contexto Web Audio. Se sintetizan clicks suaves con oscilador y envolvente corta (como máximo 50 ms), sin archivos externos ni música.

Se emite un click por paso de perilla elegido por el usuario o por nuevo carácter asentado durante reproducción automática. No se emite al cargar, normalizar, cambiar de cámara, poblar una vista previa ni seleccionar manualmente un carácter. Limitar clicks a uno cada 100 ms durante arrastre, sin cola pendiente. El sonido confirma una interacción y no comunica corrección de una clave ni éxito del ejercicio.

Silenciar, cancelar reproducción, cambiar de contexto u ocultar la pestaña detiene los sonidos activos y descarta los pendientes. Silenciar impide todos los clicks hasta otra activación explícita. Destruir la aplicación desconecta nodos y cierra su contexto de audio. Un error al habilitar audio muestra el aviso definido en [Escritorio](./desktop-experience.md), deja el sonido desactivado y no afecta resultados ni reproducción textual/visual.

## 6. Criterios de aceptación

Escenarios futuros, a comprobar con reloj controlado, dobles de escena/audio y pruebas Chromium. No están ejecutados como pruebas frontend en este incremento documental.

| ID | Escenario verificable |
| --- | --- |
| AN-01 | Una operación muestra toda la salida y selecciona 0 sin autoplay; una tabla de previsualización no habilita los controles. |
| AN-02 | Reproducir avanza un paso por segundo, termina pausado y desde el final reinicia en 0; una secuencia de un carácter no crea un bucle. |
| AN-03 | Pausar a mitad de transición conserva el último índice asentado; reanudar termina el destino previsto. Anterior/siguiente, selección e inicio descartan esa transición con las reglas de la tabla. |
| AN-04 | Las correspondencias bajo el indicador y las ecuaciones coinciden con sus pasos Rust para cifrado y descifrado, incluso con letras repetidas; GSAP no escribe en los resultados. |
| AN-05 | Editar, cambiar de fuente/vista, reiniciar o reemplazar resultados cancela las secuencias afectadas; ejecutar después sus callbacks antiguos no cambia selección, datos ni sonido. |
| AN-06 | Ningún fotograma de transición a interceptor conserva etiquetas o posiciones privadas del emisor. Cámaras y perillas respetan sus duraciones y no acumulan tweens. |
| AN-07 | Movimiento reducido suprime toda interpolación, incluida una activación durante el giro; controles y reproducción textual mantienen la información. |
| AN-08 | Ocultar la pestaña pausa sin recuperar pasos ni sonidos al volver. Perder WebGL mantiene selección y permite reproducción textual sin bucle GPU. |
| AN-09 | Sin activación de sonido no se crea audio; activarlo habilita únicamente los eventos acordados. Silenciar o cancelar detiene voces y callbacks pendientes; el arrastre respeta el límite de frecuencia. |
| AN-10 | Tras repetidas aperturas, cancelaciones y destrucción no quedan timelines, temporizadores, bucles, nodos de audio ni listeners huérfanos. |

## Documentos relacionados

- [Arquitectura](../ARCHITECTURE.md)
- [Recorrido](./learning-flow.md)
- [Perspectivas](./perspectives.md)
- [Máquina](./machine-interaction.md)
- [Escritorio](./desktop-experience.md)
