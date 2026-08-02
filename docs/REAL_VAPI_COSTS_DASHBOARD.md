# Costi reali Vapi nella dashboard

La pagina amministrativa di monitoraggio legge i costi persistiti nella vista
`client_calls`.

## Unità

Tutti gli importi sono interi in microdollari USD:

```text
1 USD = 1.000.000 microdollari
```

La dashboard formatta i valori in USD e non effettua conversioni automatiche
in euro.

## Copertura

Una chiamata è considerata coperta quando `cost_total_usd_micros` non è `null`.

Le chiamate storiche senza costo:

- restano incluse nei volumi e negli indicatori operativi;
- sono escluse dal totale, dalla media e dal breakdown dei costi;
- sono mostrate esplicitamente come dato non disponibile.

## Componenti

Il breakdown include STT, LLM, TTS, piattaforma Vapi, trasporto, chat,
knowledge base e una quota non classificata.

La proiezione mensile usa esclusivamente il costo disponibile nel periodo:

```text
costo disponibile / giorni del periodo × 30
```
