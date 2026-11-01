# Realización del conversatorio

Entradas principales: `control-v142.html`, `program-v142.html` y `panelist-live-v142.html`. Las páginas sin sufijo se mantienen sincronizadas.

## Operación

1. Abrir CONTROL en observación. Abrir la página no publica una escena ni reclama la cabina.
2. Elegir jornada, escena, composición y participantes. Comprobar PREVIA.
3. Pulsar **Tomar control**. Una segunda cabina solicita confirmación antes de reemplazar a la que anuncia presencia activa. Es coordinación operativa, no autenticación.
4. Pulsar **ENVIAR AL AIRE** para confirmar el cambio. Solo estados confirmados con protocolo 2 y el evento/escena correctos se aceptan en PROGRAM.
5. **PAUSA · PLACA GEOPRO** retira las cámaras del documento público y muestra la placa. El audio continúa en Zoom/mezclador: el operador debe silenciarlo allí. Preparar una escena no quita la pausa; un nuevo TAKE sí.

Los filtros y los cambios de participantes afectan únicamente al borrador. Conversación admite uno, dos o tres participantes, sin columnas vacías. Presentación y herramienta dejan más espacio al material y reducen el rostro. Los sitios que bloquean inserción necesitan un respaldo o captura desde el estudio.

El avance solicitado por un panelista llega a PREVIA. Realización puede habilitar explícitamente el avance directo de sus diapositivas durante su turno. Las solicitudes de pizarra siempre esperan revisión. Las notas permanecen locales.

## Ensayo

`control-v142.html?ensayo=1&sala=MI-SALA` usa BroadcastChannel y almacenamiento local separados. No conecta el transporte MQTT del evento. PROGRAM y el monitor del panelista conservan el mismo parámetro de sala. Es un ensayo del flujo en un mismo navegador/perfil, no una prueba de red remota.

La cámara dedicada es un servicio independiente. No abrirla durante pruebas aisladas salvo ensayo audiovisual autorizado; el modo aislado del control no crea emisores de cámara.

## Pruebas y límites

`node tests/acceptance.cjs`: 34 comprobaciones del modelo de estado, controlador con transporte simulado, referencias del evento y sintaxis de las interfaces. Cubren preparación sin emisión, confirmación, ausencia de participantes, pausa/regreso, orden de paquetes, bloqueo sin canal y URL de herramientas.

El canal compartido público es un prototipo sin autenticación fuerte. No enviar datos personales o contenidos confidenciales. La presencia de canal no demuestra recepción de audio/video ni mide calidad, latencia o pérdida de paquetes.

Queda por ensayar con personas reales: cámaras, permisos de dispositivos, audio de Zoom, captura en el estudio y salida a redes. PROGRAM por sí solo no inicia una transmisión en Facebook.
