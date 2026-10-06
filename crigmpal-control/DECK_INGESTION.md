# Promter Risk — Método de ingestión de presentaciones

## Objetivo
Integrar cada presentación una sola vez antes del evento. Durante la transmisión no se seleccionan ni cargan archivos.

## Fuente maestra
- Aceptar PDF, PPTX u ODP.
- Para producción, renderizar cada diapositiva/página a una imagen estática conservando el contenido visual tal cual.
- No reescribir, resumir, corregir ni rediseñar la diapositiva pública.
- El guion privado se maneja como metadatos separados.

## Estructura
```
05_PROMTER_RISK_DECKS/
  Kervin_Chunga_Pinas_2025/
    slide_01 ... slide_10
  Daniel_Coello_Deck/
    ...
  Patricio_Cobos_Deck/
    ...
```

## Registro del deck
Cada deck se declara en `events-v120.json > event.presentationDecks`:
```json
{
  "id": "pinas2025",
  "speaker": "kervin",
  "slideCount": 10,
  "sourceType": "persistent-static-images",
  "runtimeUploadRequired": false,
  "slides": [
    {
      "page": 1,
      "assetUrl": "...",
      "previewUrl": "..."
    }
  ]
}
```

## Escena
Cada escena de diapositiva incluye:
- `deckId`
- `slideNo`
- `leadSpeaker`
- `talkingPoints` — solo vista privada
- `producerCue` — solo CONTROL / panelista
- `bridge` — continuidad narrativa
- `layout: presentation`

## QA obligatorio
1. Confirmar número de páginas.
2. Comparar cada activo con la fuente maestra.
3. Verificar orden 1…N.
4. Revisar legibilidad en 1920×1080.
5. Verificar cámara + diapositiva en PREVIEW.
6. TAKE y comprobar PROGRAM.
7. Comprobar guion privado del panelista.
8. Confirmar que no existe ningún botón de carga de archivo en runtime.

## Operación en vivo
`CONTROL → escena → PREVIEW → TAKE → PROGRAM`

El operador nunca carga el PDF/PPTX en vivo.

## Estado actual
- Kervin / Piñas 2025: 10/10 integrado.
- Daniel Coello: carpeta creada; pendiente de fuente.
- Patricio Cobos: carpeta creada; pendiente de fuente.
