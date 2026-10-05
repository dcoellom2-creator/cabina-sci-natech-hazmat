# APP-001 · PROMTER RISK

## Ficha de producto
- Código: APP-001
- Nombre: Promter Risk
- Estado: L2 — web funcional
- Versión: 0.2.1
- Repositorio: dcoellom2-creator/cabina-sci-natech-hazmat
- Ruta pública: /crigmpal-control/

## Problema que resuelve
Centraliza guion, tiempos, alertas, preguntas, ideas y herramientas de apoyo para eventos técnicos. Cada participante trabaja desde su propia computadora y ve únicamente lo que le corresponde.

## Usuarios
- Administrador/moderador.
- Panelistas.
- Futuro: producción y soporte técnico.

## Funciones actuales
### Administrador
- Estado en vivo.
- Agenda maestra.
- Vista de panelistas.
- Acceso al espacio individual de cada panelista.
- Actualización de configuración publicada en GitHub.

### Panelista
- Selección de nombre.
- Guion del bloque.
- Temporizador.
- Alertas por color y sonido.
- Tarjetas de ideas.
- Video personal cuando se configure su URL.
- Pizarra digital.
- Notas locales.

## Fuente maestra
events.json contiene panelistas, perfiles, ideas, videos, agenda, preguntas y bloques. index.html consume esa configuración.

## Código de alertas
- Verde: tiempo suficiente.
- Amarillo: quedan 5 minutos.
- Rojo: quedan 2 minutos.
- Rojo pulsante: tiempo cumplido.

## Administración
ChatGPT puede actuar como administrador de configuración cuando el usuario lo solicite: editar events.json, ajustar agenda, perfiles, preguntas, videos o tarjetas y publicar las modificaciones en GitHub. La operación automática del tiempo y alertas ocurre en cada navegador.

## Seguridad
No almacenar credenciales de GitHub en el frontend. La edición maestra se hace en el repositorio.

## Datos locales
Las notas y tarjetas personales se guardan con localStorage y no se sincronizan entre equipos.

## Roadmap
1. v0.2.1 — multirol, configuración externa, pizarra, video, notas y alertas.
2. v0.3 — varios eventos y selector de evento.
3. v0.4 — PWA offline y exportación de bitácora.
4. v0.5 — sincronización opcional en tiempo real.
5. v1.0 — producto comercial.
6. v2.0 — Play Store si existe demanda validada.

## Monetización potencial
- licencia por evento;
- suscripción para organizadores;
- plan institucional;
- configuración + operación;
- versión SaaS.

## Regla de producto
Documentar → versionar → probar → publicar → medir → mejorar → monetizar.