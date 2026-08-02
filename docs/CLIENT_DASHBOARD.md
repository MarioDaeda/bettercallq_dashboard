# Dashboard cliente BetterCallQ

**Stato:** prima implementazione con fixture  
**Ruolo:** `salon_owner`

## Obiettivo

L'esperienza cliente è un pannello di monitoraggio, non una console tecnica.
Il proprietario vede soltanto:

- Panoramica;
- Chiamate;
- WhatsApp.

Le pagine amministrative vengono protette anche da un layout server-side e non
soltanto nascoste nella navigazione.

## Panoramica

La home contiene tre blocchi:

1. utilizzo chiamate rispetto ai 300 minuti mensili;
2. stato sintetico di voce e WhatsApp;
3. risultati del mese.

La barra si ferma al 100%. I minuti oltre soglia vengono mostrati separatamente.

## Chiamate

Il cliente vede:

- totale chiamate;
- durata media;
- appuntamenti;
- numero telefonico completo;
- data, durata ed esito.

Non vede trascrizioni, registrazioni, provider, costi o identificatori tecnici.

## WhatsApp

La pagina è read-only e mostra:

- totale conversazioni;
- conversazioni gestite automaticamente;
- conversazioni passate al salone;
- numero completo;
- riepilogo e stato sintetico.

Non permette risposte manuali, modifiche ai template o configurazioni Meta.

## Calcolo dei minuti

Il limite dimostrativo è fissato a 300 minuti per mese solare. Il calcolo usa i
secondi effettivi delle chiamate:

```text
usati = somma durationSeconds
rimanenti = max(300 minuti - usati, 0)
extra = max(usati - 300 minuti, 0)
barra = min(usati / 300 minuti, 100%)
```

Il criterio di arrotondamento commerciale definitivo verrà allineato al
contratto telefonico prima della produzione.

## Sicurezza

Questa versione usa fixture e `app_metadata.salon_id`. Prima di introdurre dati
reali, la Task 8C dovrà applicare membership persistenti, repository filtrati per
salone e Row Level Security o un confine server-side equivalente.
