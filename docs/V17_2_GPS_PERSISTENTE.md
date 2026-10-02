# V17.2 — Persistencia GPS y visualización multiusuario

Fecha: 2026-10-02

## Hallazgo
En pruebas operativas, cada colaborador aparecía en el mapa durante aproximadamente 10–15 segundos y luego desaparecía. Además, al ingresar un nuevo colaborador no permanecían visibles simultáneamente las posiciones anteriores.

## Causa técnica
La ubicación del colaborador estaba configurada con borrado automático mediante Firebase Realtime Database `onDisconnect(...).remove()`. Ante una desconexión breve o cambio de estado de conexión, Firebase eliminaba el nodo `locations/{uid}`. El cliente móvil además detenía `watchPosition()` cuando detectaba pérdida temporal de conexión, obligando al usuario a activar nuevamente el GPS.

## Corrección V17.2
- La última posición GPS ya no se elimina por una desconexión temporal.
- El seguimiento `watchPosition()` permanece activo durante pérdidas transitorias de Internet.
- Al recuperar conexión, las nuevas lecturas vuelven a enviarse automáticamente.
- Un fallo puntual al escribir en Firebase no detiene el seguimiento GPS.
- Coordinación conserva y muestra la última posición conocida.
- Los marcadores de varios colaboradores pueden permanecer visibles simultáneamente.
- Cada colaborador tiene control local en coordinación: **Ocultar del mapa / Mostrar en mapa**.
- Al detener voluntariamente el GPS del colaborador se detienen nuevas lecturas, pero se conserva la última posición como referencia.
- Al recargar la página del colaborador se intenta recuperar automáticamente la sesión anónima ya registrada, evitando repetir el registro cuando Firebase conserva la sesión.

## Convención visual
- Verde: GPS reciente (lectura menor a 90 s).
- Amarillo: última ubicación conocida; no confirma presencia actual.
- Oculto: el coordinador decidió no mostrar ese marcador en su mapa. El dato no se elimina de Firebase.

## Prueba operativa mínima
1. Abrir un incidente.
2. Registrar colaborador A y activar ubicación.
3. Esperar al menos 30 segundos y confirmar que el punto continúa.
4. Registrar colaborador B y activar ubicación.
5. Confirmar que A y B aparecen simultáneamente.
6. Desactivar y reactivar datos móviles de A durante unos segundos.
7. Confirmar que A no desaparece y queda como última posición; al volver Internet debe actualizarse automáticamente.
8. Recargar la cabina de coordinación y confirmar que las últimas posiciones vuelven a cargarse.
9. Probar **Ocultar del mapa** y **Mostrar en mapa**.
10. Detener ubicación desde el teléfono de B y confirmar que el punto permanece como última ubicación y deja de actualizarse.

## Limitación conocida
Los navegadores móviles pueden suspender la geolocalización cuando la pestaña queda en segundo plano, el teléfono entra en ahorro de energía o el sistema operativo bloquea el proceso. La V17.2 conserva la última posición para evitar perder la referencia, pero no puede obligar al sistema operativo a producir nuevas lecturas GPS mientras el navegador está suspendido.
