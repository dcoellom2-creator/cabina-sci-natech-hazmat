# Promter Risk — Control de Eventos

Aplicación web publicada con GitHub Pages para conducir eventos técnicos con una experiencia distinta para administrador y panelistas.

## Versión actual
v0.5.0 — modo de producción estable: cámara/audio por Zoom, gráficos y pizarra por Promter Risk.

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
