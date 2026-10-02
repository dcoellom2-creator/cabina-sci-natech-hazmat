# Cabina SCI NaTech/MATPEL — V17
Fecha de preparación: 2026-10-02. Repositorio existente conservado.

## Estado de entrega
Frontend integrado y preparado para GitHub Pages. Proyecto y Realtime Database Spark creados.
**Activación completada (2026-10-02):** Google y Anónimo habilitados, dcoellom2-creator.github.io autorizado y reglas privadas publicadas con autorización del usuario. Spark conservado.
Ingreso Google de coordinación, lectura de lista, creación de incidente/enlace y cierre comprobados desde GitHub Pages. Incidente PRUEBA TÉCNICA cerrado. Registro anónimo y GPS real entre dispositivos pendientes; no afirmar validación operativa completa.

## Metodología aplicada
1. Revisar código y distinguir demostraciones de funciones reales.
2. Definir roles, datos, consentimiento y vencimiento por incidente.
3. Implementar sobre Cabina existente.
4. Probar permisos en emulador con datos sintéticos.
5. Publicar frontend, verificar interfaz, activar acceso previa confirmación requerida y probar flujo completo.
6. Registrar evidencia, limitaciones y reversión.

## Cambios
- Registro móvil por enlace privado, nombre, teléfono y función. Teléfono de contacto no verificado por SMS.
- Coordinador: cuenta Google verificada dcoellom2@unemi.edu.ec.
- Colaborador: identidad Firebase anónima ligada al navegador y al enlace del incidente.
- Consentimiento de registro, permiso GPS separado y botón detener ubicación.
- Ubicación enviada como máximo cada 15 segundos; lectura reciente hasta 90 segundos. Una posición antigua no prueba presencia actual.
- Coordinador visualiza equipo; cada colaborador solo sus propios registros y metadatos del incidente.
- Enlace aleatorio de 256 bits en fragmento URL, caducidad 4/12/24 horas, rotación y revocación por participante.
- Reporte de estado y detalle: se conserva el último reporte por colaborador, no una bitácora histórica.
- Salida de conexión retira ubicación con onDisconnect; detener solicita borrado de posición.
- Sustitución de controles que mostraban un técnico/GPS ficticio y PTT local. Taller conserva etiqueta de demostración.
- Corrección de exposición del mapa a módulos para representar ubicaciones.

## Validación realizada
Cinco pruebas de integración de reglas aprobadas en Firebase Realtime Database Emulator v4.11.2, CLI 14.12.0, Java 17:
1. Solo coordinador Google verificado crea incidentes y lista datos; sin acceso público.
2. Invitación correcta y escritura propia, rechazo de token erróneo y acceso ajeno.
3. Ubicación/reporte propios; coordenadas fuera de rango, datos obsoletos y campos extra rechazados.
4. Revocación, cierre y caducidad bloquean nuevos registros, ubicaciones y reportes.
5. Renovación bloquea altas con enlace anterior; miembros existentes conservan acceso.
Comprobación de sintaxis JavaScript aprobada. Acceso Google en producción validado. Prueba de GPS real y registro anónimo desde teléfono pendiente.
Reproducir: npm install; npm run test:rules (requiere Java 17). Solo proyecto demo-cabina local; no modifica producción.

## Configuración aplicada
En Firebase Authentication habilitar Google (coordinación) y Anónimo (colaboradores), sin Teléfono/SMS ni Identity Platform.
Autorizar dcoellom2-creator.github.io.
Publicar el archivo database.rules.json previamente probado. Ninguna regla global pública.
Mantener Spark; no asociar facturación, tarjeta, Blaze, Storage ni Functions.

## Limitaciones
El navegador no garantiza GPS continuo en segundo plano o con pantalla bloqueada. Requiere Internet, HTTPS, permiso y página abierta.
El enlace permite altas a quien lo posea: compartir solo con personal autorizado. Rotar no revoca registros previos; usar Revocar acceso.
Una identidad anónima puede perderse si se borra almacenamiento o cambia navegador. Reingreso puede crear un nuevo registro.
Los nombres y teléfonos son declarados; no acreditan identidad ni pertenencia institucional.
El formulario explica el uso de datos. El usuario decide si enciende GPS; ningún envío automático de ubicación al abrir enlace.
No se cargaron datos reales en las pruebas. Sin PTT de audio remoto, archivos ni historial de movimientos.
El plan gratuito tiene cuotas; no se convierte automáticamente a Blaze por esta implementación.

## Reversión
Frontend anterior: commit 3eccfa8d850aa86325a891c0643985f1b96fe14e.
Para bloqueo inmediato restablecer {"rules":{".read":false,".write":false}} en Firebase; no elimina datos almacenados.
La política de conservación/borrado de incidentes debe definirse antes del uso sostenido; esta versión no elimina incidentes automáticamente.

## Fuentes oficiales
- https://firebase.google.com/docs/database/security/rules-conditions
- https://firebase.google.com/docs/auth/web/anonymous-auth
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/database/web/offline-capabilities
- https://firebase.google.com/docs/database/usage/billing

## Corrección V17.1 — 2026-10-02
- Diagnóstico de la prueba del usuario: el reporte del colaborador se recibió, pero el incidente no tenía posición GPS. Enviar reporte no activa geolocalización.
- Corregida recreación de la capa de personal después de seleccionar de nuevo un incidente: clearMap también reinicia la referencia al mapa.
- Etiquetas permanentes con nombre y vigencia; ajuste inicial de vista y botón Ver equipo en mapa.
- Mostrar mi ubicación: GPS local del dispositivo del coordinador, con permiso explícito y botón de detención. No se envía esta posición a Firebase ni a otros dispositivos. Se detiene al salir de sesión o de página.
- Estado GPS independiente del reporte en el teléfono para evitar confundir envío de texto con posición confirmada.
- Pruebas: node --test tests/map.test.mjs; recreación de capa, etiquetas, ausencia de marcador sin GPS, ubicación local y descarte de lecturas posteriores a detener. Sin cambios de reglas ni plan de Firebase.
- Pendiente: confirmar lectura GPS real de ambos teléfonos con permisos concedidos y página abierta.
