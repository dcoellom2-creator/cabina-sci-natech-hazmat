# Registro de incidentes — Promter Risk

## INC-PR-001 · WebRTC conectado sin video/pizarra visibles
- **Fecha:** 2026-10-05
- **Versión afectada:** v0.4.0–v0.4.1
- **Entorno:** panelista en teléfono; producción en computador.
- **Síntoma:** la interfaz reporta conexión establecida; el video local del teléfono se congela tras conectar; el rostro no aparece en PREVIEW/PROGRAM; trazos de pizarra no aparecen en PREVIEW/PROGRAM.
- **Interpretación:** `RTCPeerConnection.connectionState=connected` confirma negociación ICE/DTLS, pero no prueba que estén fluyendo frames de video ni mensajes útiles por DataChannel.
- **Controles añadidos v0.4.2:** video 640×360/15 fps, bitrate aprox. 300 kbps, telemetría de KB/frames recibidos, contador de pizarra y snapshot JPEG de respaldo.
- **Criterio de escalamiento:** si CONTROL mantiene 0 KB / 0 frames y pizarra 0 pese a conexión en v0.4.2, abandonar STUN-only para producción y pasar a una capa de relay/señalización dedicada (TURN/WebRTC service). GitHub continúa como repositorio y fuente de contenidos.
- **Estado:** MITIGADO ARQUITECTÓNICAMENTE EN v0.5.
- **Decisión:** no usar WebRTC STUN-only para la cámara principal del evento. Cámara/audio viajan por Zoom; PR integra la ventana localmente y mantiene WebRTC/DataChannel solo como beta para funciones auxiliares.


## INC-PR-002 · Firebase Console inaccesible para despliegue de reglas
- **Fecha:** 2026-10-05
- **Síntoma:** no fue posible completar el acceso operativo a Firebase Console desde Work/TinyFish.
- **Impacto:** la v0.6 no podía depender de reglas RTDB no desplegadas.
- **Decisión:** eliminar Firebase de la ruta crítica del evento.
- **Solución v0.7:** Zoom para media + PeerJS Cloud para señalización de datos + GitHub Pages para interfaz/contenido.
- **Resultado:** conexión automática sin intercambio manual de códigos.
- **Estado:** RESUELTO POR CAMBIO DE ARQUITECTURA.


## INC-PR-003 · PeerJS no localiza al peer de CONTROL
- **Fecha:** 2026-10-05
- **Versión afectada:** v0.7.0
- **Síntoma:** CONTROL registra su canal, pero Panelista devuelve `peer-unavailable`; pizarra no llega.
- **Prueba:** automatización CONTROL + Panelista Kervin + envío de pizarra.
- **Decisión:** retirar PeerJS de la ruta crítica.
- **Solución v0.8:** MQTT sobre WebSocket seguro con broker público EMQX para sincronización automática.
- **Estado:** RESUELTO POR CAMBIO DE TRANSPORTE.


## INC-PR-004 · Alerta 5 min eliminaba estado AL AIRE
- **Fecha:** 2026-10-05
- **Versión afectada:** v0.8.2
- **Síntoma:** después de TAKE, pulsar 5 min publicaba un estado PREPARA y eliminaba AL AIRE.
- **Corrección v0.8.3:** las alertas actualizan solo el campo alert y conservan el estado de programa.
- **Prueba:** panelista recibió “5 MIN · AL AIRE · Concentra la explicación…” desde un navegador independiente.
- **Estado:** RESUELTO Y VERIFICADO.


## INC-PR-005 · Captura de Zoom inestable/negra dentro de PROGRAM
- **Fecha:** 2026-10-05
- **Versiones afectadas:** v0.5–v0.8
- **Síntoma:** captura de Zoom mediante getDisplayMedia alternaba entre pantalla completa, recursión y superficie negra; Zoom reorganizaba su ventana durante compartir/orador.
- **Impacto:** el rostro no permanecía estable dentro de PREVIEW/PROGRAM.
- **Decisión:** retirar captura de Zoom de la ruta principal.
- **Solución v0.9:** VDO.Ninja publica video directamente desde el navegador del panelista; PROGRAM recibe el stream por URL. Zoom queda solo para audio/reunión.
- **Estado:** MITIGADO POR CAMBIO DE ARQUITECTURA.
