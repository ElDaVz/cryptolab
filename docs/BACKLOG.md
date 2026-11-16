# Pendientes para el equipo

Este archivo reúne trabajo por discutir o validar. No autoriza cambios de alcance;
para implementar, seguir [AGENTS.md](../AGENTS.md), la [visión](./VISION.md), la
[arquitectura](./ARCHITECTURE.md) y las especificaciones relacionadas.

| Pendiente | Criterio de cierre | Estado |
| --- | --- | --- |
| Registrar evidencia CI de Ubuntu y Windows x64 nativo | Guardar enlace a la ejecución aprobada de ambos jobs | Checks correctos según confirmación del usuario; falta enlazar la ejecución |
| Revisar calidad visual de escena y cámaras | Evaluación humana de materiales, encuadres y legibilidad, sin capturas | Pendiente |
| Revisar calidad audible | Escucha humana del audio opcional y control de volumen/silencio | Pendiente |

## Evolución acordada de la máquina

Diseño y criterios completos en [Siguiente iteración acordada](./IMPLEMENTATION.md#siguiente-iteración-acordada).
Los contratos de la tarea 1 se actualizan en este incremento; su aprobación documental no equivale a implementar las tareas restantes.
Los contratos vigentes se encuentran en
[máquina](./specs/machine-interaction.md), [perspectivas](./specs/perspectives.md),
[animación](./specs/animation-system.md) y los apartados afectados de
[escritorio](./specs/desktop-experience.md). La apertura ya está especificada y sustituye el contrato de anillos sin apertura; su implementación sigue pendiente.

| Orden | Tarea para el equipo | Cierre esperado |
| --- | --- | --- |
| 1 | Revisar especificaciones y definir aceptación | Contratos actualizados: MI-09–14, PE-12–13, AN-11–12 y DE-11–12. Revisión documental realizada; implementación y pruebas de estos escenarios pendientes. |
| 2 | Hacer legibles las letras del candado | Corrección de texturas, proporción, contraste y rótulos implementada; métricas Canvas verificadas de forma aislada. Pendientes Vitest, typecheck, E2E/recursos y evaluación humana en ambos tamaños; MI-09 no cerrado. |
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
