# Monitoraggio amministrativo Supabase

La pagina `/monitoraggio` della console BetterCallQ usa una sessione Supabase
autenticata e legge esclusivamente le viste `client_*` protette da RLS.

## Dati reali utilizzati

- salone;
- chiamate Vapi;
- conversazioni WhatsApp;
- stato dei canali.

Le metriche giornaliere sono aggregate server-side. Non vengono letti o
mostrati transcript, registrazioni, ID provider o corpi dei messaggi.

## Costi

La stima include soltanto le componenti già configurate nel modello:

- trascrizione;
- modello linguistico;
- sintesi vocale.

Telefonia, costo piattaforma Vapi e conteggio dei messaggi WhatsApp non sono
ancora disponibili nel database e non vengono inventati.

## Selezione del salone

Con un solo salone attivo la console seleziona il primo salone accessibile.
È possibile fissare un salone con:

```env
BETTERCALLQ_ADMIN_DEFAULT_SALON_ID=
```

Un amministratore può anche usare temporaneamente il parametro `salonId`
nell'URL. La policy RLS continua a richiedere il ruolo piattaforma `admin`.

## Limiti della Task 8F.2A

Questa attività collega il Monitoraggio. Le pagine amministrative operative
che prevedono mutazioni, interventi o messaggi manuali restano separate finché
non esistono repository e RPC persistenti dedicati.
