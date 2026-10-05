# Promter Risk — Control de Eventos

Aplicación web publicada con GitHub Pages para conducir eventos técnicos con una experiencia distinta para administrador y panelistas.

## Versión actual
v0.2.1 — multirol con configuración maestra separada.

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