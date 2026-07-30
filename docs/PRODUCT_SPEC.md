# BetterCallQ Dashboard — Product specification

**Stato:** bozza fondativa  
**Ultimo aggiornamento:** 30 luglio 2026  
**Destinatario principale:** proprietario o responsabile del salone pilota

## 1. Sintesi

BetterCallQ Dashboard è il pannello privato con cui un parrucchiere configura e
controlla la receptionist automatica offerta da BetterCallQ.

La dashboard non è destinata ai clienti e non sostituisce l'agenda del salone.
Il cliente continua a contattare il salone tramite telefono o WhatsApp; il
parrucchiere continua a gestire gli appuntamenti ordinari in Treatwell.

BetterCallQ coordina i canali, applica le regole configurate dal salone, conserva
lo storico operativo necessario e segnala soltanto le situazioni che richiedono
un intervento umano.

## 2. Confini del prodotto

| Sistema | Responsabilità |
|---|---|
| Vapi | Gestione delle chiamate vocali e invio degli eventi di chiamata |
| WhatsApp Cloud API | Ricezione e invio dei messaggi WhatsApp |
| Treatwell | Agenda e gestione ordinaria degli appuntamenti del salone |
| BetterCallQ backend | Coordinamento, regole, persistenza, integrazioni e monitoraggio |
| BetterCallQ Dashboard | Configurazione e controllo da parte del parrucchiere |

L'accesso effettivo a Treatwell deve essere verificato prima di implementare
lettura o scrittura degli appuntamenti. Il prodotto non deve presumere
l'esistenza di un'API pubblica o di operazioni non confermate.

## 3. Utenti

### 3.1 Utente principale

Il proprietario o responsabile del salone:

- usa prevalentemente smartphone, tablet o un computer del salone;
- non deve conoscere Vapi, webhook, prompt o API;
- vuole capire rapidamente se il servizio funziona;
- interviene soltanto nelle richieste non completate automaticamente;
- modifica informazioni e regole con moduli semplici.

### 3.2 Utente amministrativo futuro

Un operatore BetterCallQ potrà in futuro:

- assistere il salone;
- diagnosticare errori;
- configurare integrazioni;
- consultare un audit log.

Questo ruolo non fa parte del primo prototipo frontend e non autorizza, per ora,
una console amministrativa globale.

## 4. Obiettivi

Il prodotto deve permettere al parrucchiere di:

1. vedere immediatamente se telefono, WhatsApp e agenda sono operativi;
2. riconoscere e risolvere le richieste che necessitano di una persona;
3. consultare esito e sintesi delle chiamate;
4. prendere il controllo di una conversazione WhatsApp e restituirla all'IA;
5. configurare informazioni, servizi, FAQ, politiche e regole di escalation;
6. controllare volumi, qualità del servizio, errori e costo stimato;
7. distribuire il canale WhatsApp attraverso numero, link e QR;
8. mantenere Treatwell come agenda ordinaria, senza ricreare un calendario
   parallelo.

## 5. Non-obiettivi dell'MVP

Il primo MVP non include:

- un portale clienti;
- un calendario completo alternativo a Treatwell;
- CRM commerciale completo;
- campagne promozionali;
- pagamenti, fatturazione o programma fedeltà;
- generazione dinamica della dashboard tramite IA;
- modifica diretta dei prompt tecnici di Vapi;
- analisi predittive avanzate;
- supporto completo multi-salone nell'interfaccia;
- automazioni browser non autorizzate su Treatwell;
- conservazione indefinita di audio e trascrizioni.

## 6. Principi di esperienza utente

1. **Eccezioni prima di tutto.** La dashboard evidenzia ciò che richiede
   attenzione, non tutte le attività riuscite.
2. **Linguaggio operativo.** Mostra “WhatsApp non collegato” o “Prenotazione non
   completata”, non codici di errore tecnici come messaggio principale.
3. **Struttura stabile.** Le sezioni e i widget non vengono rigenerati dall'IA.
4. **Uso mobile reale.** Le azioni principali devono essere comode su smartphone.
5. **Conferma delle azioni sensibili.** Cancellazioni, cambio di controllo e
   modifiche importanti richiedono feedback chiaro.
6. **Stati sempre visibili.** Caricamento, assenza di dati, errore e offline
   devono essere distinti.
7. **Dettagli progressivi.** Riassunto subito; trascrizione, log e informazioni
   tecniche soltanto su richiesta.

## 7. Navigazione dell'MVP

### 7.1 Panoramica

Risponde a quattro domande:

- il servizio è operativo?
- cosa richiede attenzione?
- cosa ha gestito oggi?
- si sono verificati errori?

Contenuti minimi:

- chiamate ricevute oggi;
- prenotazioni attribuite a BetterCallQ;
- richieste aperte;
- costo mensile stimato;
- stato di Vapi, WhatsApp e provider appuntamenti;
- coda delle richieste urgenti;
- andamento di chiamate e prenotazioni;
- attività recenti;
- riepilogo degli errori di integrazione.

### 7.2 Da gestire

Coda unificata delle eccezioni provenienti da telefono, WhatsApp e integrazioni.

Ogni elemento mostra:

- priorità;
- cliente e recapito, quando disponibili;
- canale di origine;
- motivo dell'intervento;
- breve riepilogo;
- dati già raccolti;
- data e anzianità della richiesta;
- collegamento alla conversazione o chiamata;
- azioni “Chiama”, “Apri WhatsApp” e “Segna come risolta”.

Filtri minimi:

- stato;
- priorità;
- canale;
- motivo;
- intervallo temporale.

### 7.3 WhatsApp

Inbox privata a due pannelli:

- elenco delle conversazioni;
- dettaglio della conversazione selezionata.

Funzioni minime:

- mostrare messaggi del cliente, dell'IA e dell'operatore;
- visualizzare riepilogo e stato;
- mostrare il riferimento all'appuntamento, se presente;
- “Prendi il controllo”;
- invio manuale di un messaggio;
- “Restituisci all'IA”;
- gestione degli stati “IA”, “serve intervento”, “umano”, “in attesa” e
  “completata”.

Nel prototipo frontend tutte le azioni sono simulate. L'invio reale viene
aggiunto soltanto durante l'integrazione WhatsApp.

### 7.4 Chiamate

Storico delle chiamate gestite da Vapi.

Per ogni chiamata:

- numero e nome, se disponibile;
- data e durata;
- esito;
- riepilogo;
- servizio richiesto;
- riferimento all'appuntamento;
- eventuale problema;
- trascrizione espandibile.

Esiti minimi:

- prenotazione completata;
- informazioni fornite;
- modifica o cancellazione richiesta;
- trasferita;
- richiesta incompleta;
- errore tecnico;
- abbandonata.

### 7.5 Impostazioni IA

Moduli comprensibili dal parrucchiere per configurare:

- dati e descrizione del salone;
- servizi, varianti, prezzi e durata;
- operatori abilitati ai servizi, se necessari;
- orari, pause, ferie e chiusure straordinarie;
- FAQ;
- indirizzo, parcheggio e pagamenti;
- politiche di ritardo, modifica e cancellazione;
- tono e stile delle risposte;
- numero per il trasferimento;
- condizioni che richiedono intervento umano;
- anticipo minimo e limite massimo di prenotazione futura.

Le impostazioni sono dati strutturati. Il parrucchiere non modifica direttamente
il prompt di sistema.

Le informazioni già governate da Treatwell non devono essere duplicate senza
una regola esplicita di sincronizzazione e proprietà.

### 7.6 QR e canali

Contenuti minimi:

- numero telefonico della receptionist;
- numero WhatsApp;
- stato delle connessioni;
- link `wa.me`;
- messaggio WhatsApp precompilato;
- QR visualizzabile e scaricabile;
- test del collegamento;
- futura locandina stampabile.

### 7.7 Monitoraggio

Metriche comprensibili, non una console tecnica:

- chiamate e conversazioni gestite;
- durata media delle chiamate;
- prenotazioni attribuite;
- tasso di completamento;
- richieste di intervento umano;
- chiamate interrotte o abbandonate;
- errori di integrazione;
- utilizzo e costo mensile stimato.

## 8. Flussi principali

### 8.1 Controllo giornaliero

1. Il parrucchiere apre la Panoramica.
2. Controlla stato dei canali e numero di richieste aperte.
3. Apre “Da gestire”.
4. Risolve le eccezioni in ordine di priorità.
5. Torna alla Panoramica e verifica che la coda sia aggiornata.

### 8.2 Presa in carico WhatsApp

1. BetterCallQ rileva una richiesta non gestibile con sicurezza.
2. Crea un intervento e porta la conversazione nello stato “serve intervento”.
3. Il parrucchiere apre la conversazione e seleziona “Prendi il controllo”.
4. L'IA interrompe le risposte automatiche.
5. Il parrucchiere risponde manualmente.
6. Quando opportuno, chiude la conversazione oppure la restituisce all'IA.

### 8.3 Aggiornamento delle istruzioni

1. Il parrucchiere modifica un'impostazione.
2. La dashboard valida il modulo.
3. Mostra un riepilogo della modifica.
4. Il backend salva una nuova versione delle impostazioni.
5. La dashboard conferma l'applicazione oppure segnala l'errore.
6. La modifica resta tracciabile nell'audit log futuro.

## 9. Requisiti trasversali

### 9.1 Accesso e isolamento

- tutte le pagine operative richiedono autenticazione;
- ogni dato operativo è associato a `salonId`;
- un utente può leggere e modificare soltanto i saloni autorizzati;
- i segreti delle integrazioni non vengono inviati al browser.

### 9.2 Affidabilità

- i webhook devono essere idempotenti;
- gli eventi duplicati non devono creare doppie chiamate, messaggi o richieste;
- gli errori esterni devono poter essere ritentati;
- la dashboard deve distinguere dato assente, dato vecchio e integrazione offline.

### 9.3 Privacy

- raccogliere soltanto i dati necessari al servizio;
- disattivare le registrazioni audio salvo necessità concordata;
- applicare retention breve e configurabile a trascrizioni e messaggi;
- evitare dati personali nei log tecnici;
- rendere definibili cancellazione ed esportazione dei dati.

### 9.4 Accessibilità e responsive

- navigazione da tastiera;
- contrasto sufficiente;
- etichette associate ai campi;
- indicatori non basati soltanto sul colore;
- layout utilizzabile a partire da 360 px di larghezza.

## 10. Metriche di successo dell'MVP

Le soglie numeriche saranno fissate dopo il periodo pilota. L'MVP deve almeno
misurare:

- percentuale di richieste completate senza intervento umano;
- percentuale di prenotazioni attribuite a BetterCallQ;
- tempo medio di presa in carico delle eccezioni;
- numero e tipo di errori per integrazione;
- chiamate abbandonate;
- costo per chiamata e costo mensile stimato;
- disponibilità dei canali.

## 11. Decisioni già prese

- un solo salone pilota nella prima versione;
- predisposizione tecnica a più saloni tramite `salonId`;
- dashboard privata, senza accesso clienti;
- Treatwell rimane l'agenda ordinaria;
- nessun calendario completo nella dashboard;
- interfaccia stabile e non generata da prompt;
- prototipo frontend completo con fixture prima delle integrazioni reali;
- Vapi è la prima integrazione reale prevista;
- il server webhook Render esistente non viene sostituito durante il prototipo.

## 12. Questioni aperte e gate

| Questione | Impatto | Gate |
|---|---|---|
| API o programma partner Treatwell disponibili al salone | Lettura disponibilità e scrittura appuntamenti | Verificare prima dell'integrazione appuntamenti |
| Numero di operatori e agende separate | Regole di disponibilità e servizi | Definire prima del modello definitivo dei servizi |
| Ruoli oltre al proprietario | Autorizzazioni | Definire prima dell'autenticazione |
| Retention di messaggi e trascrizioni | Privacy e database | Definire prima dei dati reali |
| Provider del database e hosting dashboard | Deploy e costi | Definire prima del backend persistente |
| Ruolo transitorio di Google Calendar | Sincronizzazione e fonte dei dati | Chiarire prima del booking adapter |
| Registrazione audio | Privacy e costi | Disattivata per impostazione predefinita |

## 13. Criteri di accettazione del prototipo frontend

Il prototipo è completo quando:

- tutte le sette sezioni sono navigabili;
- ogni pagina usa il service layer e non importa direttamente fixture;
- ogni pagina gestisce loading, empty ed error state;
- le azioni simulate producono feedback coerente;
- desktop, tablet e smartphone sono verificati;
- nessun componente dipende da Gemini o da dati generati dall'IA;
- lint, test pertinenti e build terminano correttamente.

