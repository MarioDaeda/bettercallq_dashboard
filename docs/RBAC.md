# BetterCallQ Dashboard — Ruoli e permessi

**Stato:** fondazione Task 8A  
**Ultimo aggiornamento:** 1 agosto 2026

## 1. Obiettivo

La dashboard mantiene una sola codebase, ma presenta due esperienze:

- `admin`: operatore BetterCallQ con accesso alla configurazione e alla diagnostica;
- `salon_owner`: proprietario o responsabile del salone, limitato alle funzioni operative.

La Task 8A definisce contratti e navigazione. Login, sessioni e controlli server-side
saranno introdotti nelle Task 8B e 8C.

## 2. Navigazione per ruolo

### Admin BetterCallQ

- Panoramica
- Da gestire
- WhatsApp
- Chiamate
- Impostazioni IA
- QR e canali
- Monitoraggio

### Proprietario del salone

- Panoramica
- Da gestire
- Chiamate
- Dati del salone

## 3. Matrice dei permessi

| Permesso | Admin | Proprietario |
|---|:---:|:---:|
| `overview:view` | sì | sì |
| `interventions:view` | sì | sì |
| `interventions:manage` | sì | sì |
| `calls:view` | sì | sì |
| `transcripts:view` | sì | no |
| `whatsapp:manage` | sì | no |
| `salon-settings:view` | sì | sì |
| `salon-settings:edit` | sì | sì |
| `ai-settings:manage` | sì | no |
| `channels:manage` | sì | no |
| `monitoring:view` | sì | no |
| `diagnostics:view` | sì | no |
| `users:manage` | sì | no |

## 4. Confine di sicurezza

Il filtro della sidebar migliora l'esperienza ma non costituisce autorizzazione.
Task 8C dovrà verificare lato server, per ogni route e mutazione:

1. sessione valida;
2. permesso richiesto;
3. membership attiva;
4. corrispondenza tra utente e `salonId`.

Il browser non è una fonte attendibile per ruolo, permessi o `salonId`.

## 5. Modello dati previsto

```text
profiles
- user_id
- display_name
- platform_role
- status
- created_at
- updated_at

salons
- id
- name
- status
- created_at
- updated_at

salon_memberships
- user_id
- salon_id
- membership_role
- status
- created_at
- updated_at

audit_logs
- id
- actor_user_id
- salon_id
- action
- entity_type
- entity_id
- metadata
- created_at
```

Per il pilota:

- Mario e il collaboratore tecnico: `platform_role = admin`;
- parrucchiere di Forlì: membership `salon_owner` sul solo salone pilota.

## 6. Decisioni rinviate

- provider di autenticazione;
- inviti e recupero password;
- persistenza PostgreSQL;
- middleware e protezione route;
- Row Level Security o equivalente;
- gestione di ruoli ulteriori;
- selettore multi-salone;
- audit persistente.

Queste decisioni appartengono alle Task 8B e 8C.
