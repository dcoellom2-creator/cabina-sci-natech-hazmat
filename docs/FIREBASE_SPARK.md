# Firebase — Cabina SCI NaTech/MATPEL
Fecha: 2026-10-02.

## Objetivo y restriccion
Backend Realtime Database y registro web para el frontend existente en GitHub Pages.
Solo Spark, sin tarjeta, sin vincular facturacion ni habilitar servicios de pago.

## Configuracion ejecutada
- Proyecto: cabina-sci-natech-matpel.
- Nombre: Cabina SCI NaTech MATPEL.
- Plan verificado en consola: Spark, USD 0 al mes.
- Realtime Database: https://cabina-sci-natech-matpel-default-rtdb.firebaseio.com
- Region: us-central1.
- App: Cabina SCI NaTech MATPEL - GitHub Pages.
- App ID: 1:1068350353943:web:5168e9531b51bdc3f32252.
- SDK y configuracion publica: /firebase-config.js.
- No se habilitaron Analytics, Gemini, Hosting, Storage, Cloud Functions ni facturacion.

## Seguridad
Reglas iniciales publicadas en modo bloqueado:
```json
{"rules":{".read":false,".write":false}}
```
No abrir lectura/escritura global para probar ubicaciones o telefonos.
La configuracion publica del SDK no concede acceso administrativo.

## Integracion pendiente
El modulo esta preparado para importar desde el frontend:
```js
import { app, database } from "./firebase-config.js";
```
El frontend existente aun no importa este modulo ni sincroniza colaboradores.
Antes de habilitar datos reales: implementar autenticacion, roles y reglas por usuario/incidente; probar escritura propia, denegacion a terceros y lectura autorizada del coordinador.
No se habilito autenticacion telefonica/SMS.
La creacion del backend no equivale a una prueba funcional de seguimiento en el mapa.

## Verificacion
Consola mostro proyecto creado, plan Spark, base vacia en us-central1 y app web registrada.
No se introdujo tarjeta ni se selecciono Blaze.
El limite gratuito puede restringir el servicio; no cambiar a Blaze automaticamente.

## Fuentes oficiales
- https://firebase.google.com/docs/database/usage/billing
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/database/security/quickstart
- https://firebase.google.com/docs/web/setup
