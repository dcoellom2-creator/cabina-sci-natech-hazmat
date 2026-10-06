# APP-001 · PROMTER RISK

## Ficha de producto
- Código: APP-001
- Nombre: Promter Risk
- Estado: L2 — web funcional
- Versión: 0.13.0
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

## Módulo de realización
Promter Risk adopta una lógica de producción audiovisual:
- CONTROL: operación privada.
- PREVIEW: escena preparada.
- TAKE: transición deliberada.
- PROGRAM: salida pública limpia.
- Escenas reutilizables: panelista completo, tarjetas, tabla, pregunta y futuras escenas de imagen/pizarra.

El primer paquete nativo es el caso Piñas de Kervin Chunga. La presentación deja de ser un archivo externo y pasa a ser contenido estructurado dentro de Promter Risk.


## v0.4 — producción remota
- Modo LIVE para panelistas.
- Cámara y micrófono con selección de dispositivos.
- Medidor básico de audio.
- Confidence monitor por bloque.
- Cues de producción enviados desde CONTROL.
- Alertas visuales 5 min / 2 min.
- WebRTC directo panelista → productor.
- Pizarra remota basada en eventos de dibujo.
- PROGRAM recibe video remoto y pizarra cuando la sesión WebRTC está activa.
- Escena de pizarra incorporada al caso piloto Piñas.

### Criterio de producto
GitHub sigue siendo la fuente maestra de código, versión y contenido. El video no se almacena en GitHub; viaja punto a punto durante la sesión.


## v0.7 — arquitectura operativa
- Zoom transporta cámara y audio.
- CONTROL captura la ventana de Zoom y compone PREVIEW/PROGRAM.
- PeerJS Cloud se usa solo como señalización gratuita para un canal de datos P2P.
- El canal de datos sincroniza presencia, alertas, cues y pizarra.
- No hay Firebase Console, códigos de oferta/respuesta ni autenticación de panelistas.
- MSc. Diego Delgado se incorpora como Moderador.
- El inicio principal redirige a `index-v070.html`.

### URLs de producción
- `index-v070.html`
- `control-v070.html`
- `panelist-live-v070.html?panelista=<id>`
- `program-v070.html`


## v0.8 — canal de datos MQTT
Arquitectura final para el conversatorio:
- Zoom para media.
- MQTT/WSS para mensajes de control, presencia y pizarra.
- GitHub Pages para interfaz y contenidos.
- Moderator: MSc. Diego Delgado.
- Sin intercambio manual de códigos.
- Sin dependencia operativa de Firebase.


## Estado verificado v0.8.3
- Sin códigos manuales.
- Sin Firebase en la ruta crítica.
- Pizarra remota validada.
- Cues y alertas validados.
- Moderador Diego Delgado integrado.
- Captura Zoom pendiente únicamente de ensayo físico del selector de ventana.


## v0.9 — video web integrado
- Video del panelista: VDO.Ninja.
- Audio/reunión: Zoom.
- Control/pizarra/alertas: MQTT.
- Sin captura de Zoom.
- Sin instalación de OBS.
- Sin Firebase en la ruta crítica.
- Sin intercambio manual de códigos.
- Cámaras vinculadas automáticamente por panelista.


## v0.10 — escenas narrativas
- Single speaker: panelista + contenido técnico.
- Trio: tres cámaras simultáneas + pregunta activa.
- Moderator: moderador + pregunta programada.
- Control narrativo: pregunta objetivo + continuidad + avance RESUELTA → SIGUIENTE.
- Sincronización privada a moderador/panelistas por MQTT.


## v0.11 — presentación técnica nativa
- 10 escenas Piñas 2025 integradas al motor PROGRAM.
- Vista pública 27/73: cámara del panelista + diapositiva nativa.
- Vista privada de Kervin con talking points y puente narrativo.
- La presentación deja de depender de PowerPoint externo durante la transmisión.


## v0.11.2 — fuente PDF
- Sustituye la carga PPTX por PDF.js.
- 10 páginas originales del deck Piñas.
- Render exacto en PROGRAM; sin reinterpretación del contenido.
- Persistencia local del PDF mediante IndexedDB.


## v0.12 — Deck Registry
- Cada panelista tiene carpeta persistente y manifest.
- Las diapositivas se ingieren una sola vez.
- Runtime sin carga de archivos.
- PROGRAM usa asset URL persistente con fallback de preview.
- Guion privado separado del contenido público.
- Misma metodología para Kervin, Daniel, Patricio y futuros panelistas.


## v0.13 — Cue Engine
- Segment clock: controla la intervención completa.
- Scene/question clock: controla la idea o respuesta activa.
- Auto cue 5 min / 2 min de bloque y 30 s de idea.
- Manual advance: el sistema avisa, el productor decide cuándo avanzar.
- Speaker scene filter: preparación por panelista sin perder escenas compartidas.
- Moderator conductor: timeline del día, pregunta, destinatario, transición y siguiente bloque.
- Daniel deck registry: 8 diapositivas persistentes listas.
