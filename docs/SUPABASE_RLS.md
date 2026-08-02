# Row Level Security — Task 8C.3

## Obiettivo

Le letture tramite publishable key devono rispettare contemporaneamente:

```text
utente autenticato
→ profilo applicativo
→ membership attiva
→ salone attivo o in prova
→ riga con lo stesso salon_id
```

Un amministratore BetterCallQ può leggere tutti i saloni. Un proprietario vede
soltanto le righe del salone associato alla propria membership.

## Funzioni private

Le policy usano funzioni `security definer` collocate nello schema `private`:

- `private.is_platform_admin()`;
- `private.current_user_salon_ids()`;
- `private.current_user_plan_ids()`.

Lo schema non deve essere aggiunto agli schemi esposti da PostgREST. Le funzioni
usano `auth.uid()` e non accettano identificatori utente dal client.

## Accesso read-only

Il ruolo `authenticated` riceve soltanto `SELECT`. Non esistono policy di:

- inserimento;
- aggiornamento;
- cancellazione.

Webhook, sincronizzazioni e operazioni amministrative useranno repository
server-side distinti.

## Colonne sensibili

Il cliente vede il numero telefonico completo, ma non può leggere:

- `calls.transcript`;
- `calls.recording_url`;
- `calls.external_call_id`;
- `whatsapp_conversations.external_conversation_key`;
- `whatsapp_messages.body`;
- identificatori tecnici non necessari.

RLS protegge le righe, mentre i privilegi di colonna proteggono i campi interni.

## Viste cliente

Le query applicative useranno viste `security_invoker`:

- `client_salons`;
- `client_usage_periods`;
- `client_calls`;
- `client_whatsapp_conversations`;
- `client_channel_statuses`.

Le viste rispettano le policy delle tabelle sottostanti e definiscono una
superficie stabile priva delle colonne sensibili.

## Verifica locale

Dopo aver inizializzato il local stack Supabase:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

I test creano due saloni e tre utenti temporanei e verificano che:

- il proprietario A non legga il salone B;
- il proprietario B non legga il salone A;
- l'admin legga entrambi;
- `anon` non abbia accesso;
- transcript, registrazioni e messaggi restino non leggibili.

## Stato della transizione

La dashboard continua a usare le fixture. La Task 8C.4 introdurrà repository
read-only sulle viste cliente. I dati reali non vanno mostrati prima
dell'esecuzione positiva dei test RLS.
