# Promter Risk — Control de Eventos

Aplicación web publicada con GitHub Pages para conducir eventos técnicos con una experiencia distinta para administrador y panelistas.

## Versión actual
v0.13.1 — deck Daniel convertido a PDF maestro y renderizado por página como Kervin.

## Enlace publicado
https://dcoellom2-creator.github.io/cabina-sci-natech-hazmat/crigmpal-control/

## Flujo principal
- Inicio con dos opciones: Administrador de eventos o Panelista.
- El panelista selecciona su nombre y entra a un espacio personal.
- Cada panelista ve su bloque, pregunta, tiempos, alertas, ideas en tarjetas, video, pizarra digital y notas.
- El administrador ve agenda, estado en vivo y accesos individuales.

## Arquitectura actual
- index.html: interfaz y lógica.
- events.json: fuente maestra editable del evento.
- GitHub Pages: publicación.
- localStorage: notas y tarjetas personales por navegador.
- Horarios con zona Ecuador UTC-5 para las alertas.
- La app vuelve a leer events.json al cargar, al pulsar Actualizar y periódicamente durante la sesión.

## Alertas
- Verde: intervención activa con margen.
- Amarillo: quedan 5 minutos.
- Rojo: quedan 2 minutos.
- Rojo pulsante: tiempo cumplido.

## Administración asistida
La configuración maestra se mantiene en GitHub y puede ser administrada por ChatGPT a solicitud del usuario. No se exponen tokens o credenciales en el navegador. Para cambios de agenda, perfiles, preguntas, videos o tarjetas se modifica events.json y se publica en GitHub.

## Limitación deliberada
GitHub Pages es estático. No existe una base de datos compartida ni autenticación segura en esta versión. Las notas y la pizarra son locales a cada dispositivo. Los cambios publicados en GitHub pueden tardar brevemente en reflejarse en GitHub Pages.

## Evolución
L2 Web funcional → L3 PWA instalable → L4 producto comercial → L5 Play Store/SaaS.

## Producción audiovisual
- `control.html`: consola privada del productor. Selecciona panelista/escena, prepara PREVIEW y envía con TAKE.
- `program.html`: salida limpia 16:9 para capturar en Zoom/OBS; no contiene controles.
- `events.json > productionScenes`: secuencia editorial de escenas.
- Sincronización actual CONTROL→PROGRAM: `localStorage` entre ventanas del mismo navegador/equipo.
- Caso piloto integrado: Kervin Chunga / Piñas (entrada, contexto, tabla SF, mitigación y pregunta estratégica).

### Regla de realización
El panelista no presenta PowerPoint. Promter Risk compone la escena: identidad institucional + panelista + evidencia + referencia + pregunta.

### Limitación vigente
La cámara remota y la pizarra de un panelista en otro computador todavía no se sincronizan en PROGRAM. Eso requerirá una capa de estado/streaming en tiempo real.


## Panelista LIVE
- `panelist-live.html`: cámara y micrófono, prueba técnica, confidence monitor, pizarra, notas y emparejamiento WebRTC.
- La pantalla cambia de tono por horario y por instrucciones del operador.
- CONTROL envía al panelista el cue de producción: PREPARA / AL AIRE / alerta 5 min / alerta 2 min.
- La pizarra se transmite como eventos de dibujo a PROGRAM cuando la conexión directa está activa.

## WebRTC beta GitHub-only
Para mantener la arquitectura sin backend, el enlace remoto usa WebRTC punto a punto con STUN público:
1. Panelista activa cámara + micrófono.
2. Panelista genera una oferta y la envía al productor.
3. CONTROL pega la oferta, genera la respuesta y la devuelve al panelista.
4. Panelista aplica la respuesta.
5. CONTROL recibe video y datos de pizarra.
6. PROGRAM puede mostrar la cámara en las escenas y la pizarra en la escena específica.

Limitación: redes corporativas o NAT estrictas pueden bloquear una conexión STUN-only; una versión futura podría añadir TURN/señalización.

## URLs operativas
- CONTROL: `control.html`
- PROGRAM: `program.html`
- PANELISTA LIVE: `panelist-live.html?panelista=<id>`
- `public.html` redirige a PROGRAM para evitar capturar por error una interfaz con controles.


## Correcciones v0.4.1
A partir del primer ensayo con teléfono + computador:
- El panelista transmite solo la pista de video hacia producción; el micrófono queda para prueba/medición local, reduciendo carga y riesgo de congelamiento.
- Cámara móvil limitada a resolución/framerate razonables para estabilidad.
- El canal de pizarra limita frecuencia y descarta movimientos si el buffer se satura.
- CONTROL muestra por separado estado de video y datos.
- PROGRAM anuncia que está listo y CONTROL reinyecta el MediaStream automáticamente.
- La pizarra conserva los trazos aunque la escena todavía no esté al aire y se redibuja al entrar en modo Pizarra.


## Correcciones v0.4.2
Ensayo real teléfono → computador confirmó que `RTCPeerConnection.connectionState=connected` no basta para asegurar video útil ni canal de pizarra. La versión añade:
- video móvil objetivo 640×360 a 15 fps;
- bitrate máximo de video aproximado 300 kbps;
- telemetría en CONTROL: KB recibidos, frames decodificados y mensajes de pizarra;
- versión visible en Panelista LIVE;
- snapshot JPEG de pizarra como respaldo de los eventos vectoriales;
- PROGRAM muestra el snapshot más reciente cuando entra la escena Pizarra.

### Criterio de diagnóstico
- Conectado + 0 KB/0 frames = el enlace WebRTC está negociado, pero no está llegando video.
- Pizarra 0 = el DataChannel no está entregando mensajes.
- Si ambos permanecen en cero con v0.4.2, dejar de insistir con STUN-only y migrar la capa en vivo a un relay/signaling dedicado (TURN/WebRTC service), manteniendo GitHub para código y contenidos.


## Modo de producción estable v0.5
El ensayo real mostró que la cámara WebRTC directa desde teléfono no es suficientemente confiable para producción. La arquitectura operativa cambia:

- **Zoom**: transporte de cámara y audio del panelista.
- **Panelista LIVE**: confidence monitor, guion, alertas, pizarra y notas; cámara directa PR queda experimental.
- **CONTROL**: captura localmente la ventana de Zoom mediante `getDisplayMedia()`, la integra en PREVIEW/PROGRAM y recibe la pizarra.
- **PROGRAM**: salida 16:9 con cámara capturada + contenido técnico.
- **Pizarra**: el panelista puede dibujar y pulsar “Enviar pizarra a producción”; CONTROL confirma la recepción y PROGRAM muestra el snapshot.

### Motivo
La separación reduce carga en el teléfono, evita competir por la cámara con Zoom y elimina la dependencia de STUN-only para el video principal. GitHub sigue siendo la fuente maestra del producto y los contenidos.


## v0.7 — conexión automática sin Firebase
La consola de Firebase no fue accesible de forma operativa, así que Promter Risk deja de depender de ella para el evento.

Arquitectura:
- Zoom: cámara y audio.
- GitHub Pages: interfaz, escenas y configuración.
- PeerJS Cloud: señalización gratuita para un canal WebRTC de datos entre CONTROL y cada panelista.
- Canal de datos: pizarra, alertas, cues y presencia.
- CONTROL y PROGRAM: mismo equipo de producción; sincronización local y captura de la ventana de Zoom.
- No hay códigos de oferta/respuesta ni inicio de sesión para panelistas.

### Moderador
MSc. Diego Delgado — Geólogo / Moderador — se incorpora como usuario MODERAR y participa en aperturas, transiciones, preguntas y cierres.

### Riesgo técnico conocido
PeerJS Cloud es un servicio público compartido. Para un evento pequeño es suficiente como señalización de datos, pero no se utiliza para video/audio. Si una red impide la conexión P2P, Zoom sigue funcionando y el evento puede continuar sin pizarra remota.


## v0.8 — MQTT automático
La prueba PeerJS v0.7 devolvió `peer-unavailable` y no entregó la pizarra. La ruta crítica se cambia a MQTT sobre WebSocket seguro.

- Broker público de pruebas: `wss://broker.emqx.io:8084/mqtt`.
- Zoom: cámara y audio.
- MQTT: estado de escena, presencia, alertas y pizarra.
- GitHub Pages: aplicación y contenido.
- No hay códigos de oferta/respuesta, Firebase Console ni cuentas de panelista.
- CONTROL publica el estado; Panelista/Moderador lo reciben automáticamente.
- La pizarra se publica como imagen JPEG comprimida y CONTROL/PROGRAM reciben el último estado.

Importante: el broker público no se usa para datos sensibles. Notas privadas nunca se publican; permanecen en localStorage.


## Verificación v0.8.3
Pruebas automatizadas en navegadores separados confirmaron:
- Panelista: “Producción conectada”.
- Pizarra: envío de 2 KB desde Kervin y recepción en CONTROL con hora.
- CONTROL: presencia de panelista mientras el navegador remoto está activo.
- Cues: escena “Factor de seguridad” recibida por Kervin.
- TAKE + alerta 5 min: el panelista recibió “5 MIN · AL AIRE · …” sin perder el estado AL AIRE.

La única función que requiere ensayo físico es CAPTURAR ZOOM, porque el selector de ventana depende del navegador del operador.


## v0.9 — cámara web VDO.Ninja
Arquitectura:
- VDO.Ninja: video del panelista, integrado como iframe en Panelista LIVE y PROGRAM.
- Zoom: audio y reunión, sin ser capturado por Promter Risk.
- MQTT/WSS: cues, presencia, alertas y pizarra.
- GitHub Pages: aplicación, escenas y configuración.
- Cada panelista tiene un stream ID fijo; CONTROL cambia la cámara automáticamente según el panelista seleccionado.
- Panelista LIVE mantiene la cámara visible dentro de la misma página para reducir suspensión del navegador móvil.
- VDO.Ninja se configura con audio deshabilitado; el audio continúa por Zoom para evitar eco.

### Flujo
Panelista abre su URL PR -> permite cámara -> VDO.Ninja publica video -> CONTROL selecciona panelista -> PREVIEW/PROGRAM cargan automáticamente el view de esa cámara -> TAKE controla la escena y MQTT mantiene cues/alertas/pizarra.


## v0.10 — realización guiada por guion
Promter Risk deja de tratar las escenas como piezas aisladas y las conecta con el hilo del conversatorio.

Funciones:
- Vista TRÍO: hasta tres panelistas simultáneos con cámaras VDO.Ninja.
- Vista MODERADOR: cámara del moderador + pregunta/encuadre programado.
- Cada escena puede definir `participants`, `leadSpeaker` y `questionFlow`.
- CONTROL muestra la pregunta activa, el panelista objetivo y la continuidad.
- Botón `RESUELTA → SIGUIENTE`: avanza la pregunta manteniendo la escena y el estado AL AIRE.
- El panelista objetivo recibe “PREGUNTA PARA TI”.
- El moderador recibe pregunta actual, destinatario y transición siguiente.
- Los demás panelistas reciben instrucción de escucha y el hilo que viene después.

Esto permite conducir el conversatorio como una secuencia narrativa: evidencia → decisión → acción → articulación.


## v0.11 — deck Piñas nativo
Se integró el archivo “Análisis Forense Piñas 2025” como 10 escenas nativas de Promter Risk para Kervin.
- La salida pública mantiene cámara de Kervin a la izquierda y diapositiva nativa a la derecha.
- Cada escena conserva el hilo del deck: caso → lluvia → método → control estructural → FS → cadena de falla → infraestructura → mitigación → síntesis → pregunta puente.
- Kervin recibe en su vista privada: título de diapositiva, instrucción de exposición, 3 puntos de explicación y puente a la siguiente lámina.
- La última lámina activa la pregunta de transición hacia Diego y Daniel.
- Valores actualizados del manuscrito usado como base: FS seco 1.526, FS saturado 0.980, post-falla saturado 0.727 y mitigado alrededor de 1.65–1.71.


## v0.11.2 — PDF exacto
Se retiró el parser PPTX de la ruta de producción del caso Piñas.
- CONTROL carga `Análisis_Forense_Piñas_2025.pdf` y lo guarda localmente en IndexedDB.
- PROGRAM usa PDF.js para renderizar la página original correspondiente a cada escena.
- Se preservan textos, gráficos, fotografías, colores y composición del PDF; Promter Risk no reconstruye la diapositiva.
- El guion privado de Kervin continúa separado de la salida pública.


## v0.12 — metodología de decks persistentes
Objetivo operativo: ningún productor ni panelista carga archivos durante la transmisión.

### Ingestión (una sola vez, antes del evento)
1. Recibir PDF/PPTX del panelista.
2. Renderizar cada página/diapositiva sin alterar su contenido visual.
3. Guardar los activos de forma persistente en la carpeta del panelista.
4. Crear/actualizar el manifest del deck en `events-v120.json`.
5. Vincular cada slide con su `sceneId`, talking points, producer cue y bridge.
6. Ejecutar QA visual en PREVIEW/PROGRAM.
7. Publicar.

### Operación en vivo
CONTROL → seleccionar escena → PREVIEW → TAKE → PROGRAM.
PROGRAM obtiene la diapositiva desde el activo persistente. No usa selector de archivos, IndexedDB ni carga local.

### Estructura de activos
- `05_PROMTER_RISK_DECKS/Kervin_Chunga_Pinas_2025` — 10/10 listo.
- `05_PROMTER_RISK_DECKS/Daniel_Coello_Deck` — preparado para ingestión.
- `05_PROMTER_RISK_DECKS/Patricio_Cobos_Deck` — preparado para ingestión.

La diapositiva pública se conserva tal cual. El guion privado y las transiciones viven como metadatos separados.


## v0.13 — control temporal y guion operativo
- CONTROL incorpora dos relojes: bloque/intervención e idea/pregunta.
- TAKE inicia el reloj de la escena; el primer TAKE de un bloque inicia el reloj del bloque.
- Alertas automáticas por bloque: 5 min y 2 min restantes.
- Aviso automático de cierre de idea/respuesta a 30 s.
- El avance nunca es automático: SIGUIENTE y RESUELTA → SIGUIENTE quedan bajo control del productor.
- En escenas con preguntas, el reloj de idea se convierte en reloj por respuesta.
- Selector de participante filtra las escenas propias y compartidas; Programa completo recupera la secuencia total.
- Los enlaces inferiores son dinámicos: Moderador Diego + vista del participante seleccionado.
- Vista privada abre por defecto en Hilo general; Pizarra es una herramienta opcional.
- Hilo general muestra programa del día, bloque actual, escena/pregunta activa, destinatario y continuidad.
- Deck Daniel “Mitigación y toma de decisiones en el GAD”: 8/8 integrado como activos persistentes.


## v0.13.1 — Daniel por PDF maestro
- Las 8 imágenes de Daniel se consolidaron en `Daniel_Coello_Mitigacion_GAD_v1.pdf`.
- El PDF se verificó renderizando sus 8 páginas.
- Cada página se publicó como activo persistente en `Daniel_Coello_Deck`, siguiendo el mismo patrón usado para Kervin.
- Se corrigió la clave del registro del deck: `daniel-mitigacion-gad` ahora coincide exactamente con `scene.deckId`.
- PROGRAM y PREVIEW resuelven las 8 láminas sin carga manual en runtime.
