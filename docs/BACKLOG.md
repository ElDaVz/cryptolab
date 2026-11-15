# Pendientes para el equipo

Este archivo reúne trabajo por discutir o validar. No autoriza cambios de alcance;
para implementar, seguir [AGENTS.md](../AGENTS.md), la [visión](./VISION.md), la
[arquitectura](./ARCHITECTURE.md) y las especificaciones relacionadas.

| Pendiente | Criterio de cierre | Estado |
| --- | --- | --- |
| Validar instalación desde cero en Windows x64 nativo, macOS Intel y Apple Silicon | Setup repetible, doctor y todos los checks de cada job CI correctos; guardar enlace a la ejecución | Configurado en CI; no ejecutado en estos hosts localmente |
| Revisar calidad visual de escena y cámaras | Evaluación humana de materiales, encuadres y legibilidad, sin capturas | Pendiente |
| Revisar calidad audible | Escucha humana del audio opcional y control de volumen/silencio | Pendiente |

## Evolución acordada de la máquina

Diseño y criterios completos en [Siguiente iteración acordada](./IMPLEMENTATION.md#siguiente-iteración-acordada).
Todas las tareas siguientes están **pendientes de implementación y verificación**.
Antes de cambiar código, actualizar las especificaciones actuales de
[máquina](./specs/machine-interaction.md), [perspectivas](./specs/perspectives.md),
[animación](./specs/animation-system.md) y los apartados afectados de
[escritorio](./specs/desktop-experience.md). La propuesta de apertura sustituye
parte del contrato visual vigente; el registro de diseño no lo modifica por sí solo.

| Orden | Tarea para el equipo | Cierre esperado |
| --- | --- | --- |
| 1 | Revisar especificaciones y definir aceptación | Apertura, visibilidad y etapas documentadas antes de implementar. |
| 2 | Hacer legibles las letras del candado | Letras completas, contrastadas y sin solapamientos en los encuadres previstos. |
| 3 | Separar dos discos sobre el mismo eje al abrir | Cifrado delante, referencia detrás; emisor con abrir/cerrar e interior abierto. |
| 4 | Dar prioridad a César con +8 fijo | A → I y X → F, con sus inversos; selección de letra distinta de configuración. |
| 5 | Proteger la coherencia de perspectivas | Interceptor cerrado; interior candidato sin configuración original ni restos de otro contexto. |
| 6 | Explicar afín como modo avanzado por etapas | Multiplicación, desplazamiento y módulo; descifrado según su propia traza Rust. |
| 7 | Verificar accesibilidad y ciclo de animación | HTML/teclado, cancelación, movimiento reducido y alternativa textual completa. |

## Registrar nuevas observaciones

Para cada observación: describir el comportamiento actual, el esperado, los pasos
para reproducir, la especificación afectada y un criterio verificable de cierre.
Registrar aquí las siguientes observaciones del usuario conforme se discutan.
Distinguir problemas de representación de fallos matemáticos demostrados y evitar
presentar tareas pendientes como comportamiento ya implementado.
