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
