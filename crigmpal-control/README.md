# Promter Risk — Control de Eventos

Aplicación web publicada con GitHub Pages para conducir eventos técnicos con una experiencia diferente para administrador y panelistas.

## Versión actual
v0.2.0 — multirol sobre GitHub Pages

## Enlace publicado
https://dcoellom2-creator.github.io/cabina-sci-natech-hazmat/crigmpal-control/

## Flujo principal
- Inicio con dos opciones: Administrador de eventos o Panelista.
- El panelista selecciona su nombre y entra a un espacio personal.
- Cada panelista ve su bloque, pregunta, tiempos, alertas, ideas en tarjetas, video, pizarra digital y notas.
- El administrador ve agenda, estado en vivo y accesos individuales.

## Arquitectura actual
- index.html: interfaz, configuración y lógica.
- GitHub Pages: publicación.
- localStorage: notas y tarjetas personales por navegador.
- Horarios con zona Ecuador UTC-5 para las alertas.

## Alertas
- Verde: intervención activa con margen.
- Amarillo: 5 minutos.
- Rojo: 2 minutos.
- Rojo pulsante: tiempo cumplido.

## Administración asistida
La configuración maestra se mantiene en GitHub. No se exponen tokens o credenciales en el navegador. Los cambios de agenda, perfil, preguntas, videos o contenidos se realizan desde el repositorio con asistencia de ChatGPT.

## Limitación deliberada
GitHub Pages es estático. No existe una base de datos compartida ni autenticación segura en esta versión. Las notas y la pizarra son locales a cada dispositivo.

## Evolución
L2 Web funcional → L3 PWA instalable → L4 producto comercial → L5 Play Store/SaaS.