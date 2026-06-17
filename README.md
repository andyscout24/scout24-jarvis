# Social Jarvis Dashboard

Interner Automation Hub fuer Angebotsgenerator, Reporting Tool und kommende Automatisierungen.

## Framework und Runtime

Dieses MVP nutzt kein Next.js, Vite oder Express. Es ist eine dependency-freie Node.js App:

- Node-HTTP-Server mit Entry Point `server.mjs`
- Statische SPA im Ordner `public`
- Serverlogik unter `src/server`
- Gemeinsame Contracts unter `src/shared`
- MVP-Persistenz in `data/db.json`
- PostgreSQL/Supabase-Zielschema in `database/schema.sql`

## Projektstruktur

```text
public/src/
  components/       Wiederverwendbare UI-Bausteine
  domain/           Frontend-Konstanten und JSDoc-Domain-Types
  forms/            Form-Payload-Builder
  modules/          Navigation, Automation- und Ergebnis-Metadaten
  ui/               Kleine DOM-Bindings fuer Filter und Monitoring
  views/            Seiten des Dashboards
src/
  shared/           Gemeinsame Contracts fuer Servermodule
  server/
    api/            API-Router
    auth/           Rollen und Permissions
    config/         Pfade und Environment-Status
    errors/         Einheitliche API-Errors
    logging/        Activity-Log Normalisierung und Sanitizing
    modules/        Tool-Adapter
    persistence/    JSON-Repository fuer das MVP
    security/       Public-Payload Sanitizer
    services/       Business Logic
```

## Voraussetzungen

- Node.js 20.11 oder neuer
- Optional npm, wenn die Package-Scripts genutzt werden sollen
- Optional PostgreSQL/Supabase fuer spaetere Produktion

## Lokales Setup

```bash
cp .env.example .env
node --env-file=.env server.mjs
```

Ohne `.env` startet die App ebenfalls mit sicheren Defaults:

```bash
node server.mjs
```

Danach oeffnen:

```text
http://localhost:4173
```

Optionaler Port:

```bash
PORT=4300 node server.mjs
```

## Scripts

```bash
npm run dev
npm run build
npm start
npm run health
npm run cf:dev
npm run cf:deploy
```

Falls npm lokal nicht verfuegbar ist:

```bash
node scripts/check.mjs
node server.mjs
```

## Code Quality

Der MVP hat bewusst keine externen Dev Dependencies. `npm run build` fuehrt deshalb einen pragmatischen Check aus:

- Syntaxcheck aller `.js` und `.mjs` Dateien
- JSON-Validierung von `data/db.json`

Security-relevante Payloads werden serverseitig gefiltert, bevor sie ans Frontend gehen. Blockiert werden u. a. Token-/Secret-Felder, private Keys und lokale Pfadfelder wie `sourcePath`.

## Environment Variables

Siehe `.env.example`. Keine echten API Keys in `.env.example` eintragen.

| Variable | Pflicht lokal | Zweck |
| --- | --- | --- |
| NODE_ENV | nein | Node-Umgebung |
| APP_ENV | nein | App-Umgebung |
| PORT | nein | HTTP-Port |
| SERVICE_NAME | nein | Name im Healthcheck |
| PUBLIC_BASE_URL | nein | Oeffentliche App-URL |
| AUTH_MODE | nein | `hybrid`, `mock_header` oder `supabase` |
| DATA_REPOSITORY | nein | `json`, `supabase` oder `auto` |
| DATA_FILE_PATH | nein | JSON-Datenfile fuer MVP |
| DATABASE_URL | nein | Ziel-DB fuer PostgreSQL/Supabase |
| SUPABASE_URL | nein | Supabase URL |
| SUPABASE_SCHEMA | nein | Supabase Schema, default `public` |
| SUPABASE_ANON_KEY | nein | Supabase Public Client Key |
| SUPABASE_SERVICE_ROLE_KEY | nein | Supabase Serverzugriff, nur serverseitig |
| NEXT_PUBLIC_SUPABASE_URL | nein | Oeffentliche Supabase URL fuer Login im Browser |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | nein | Publishable Key fuer Supabase Sign-In im Browser |
| CAMPAIGN_REVIEW_BASE_URL | nein | Reporting FastAPI |
| SWATIO_BASE_URL | nein | Swat.io API |
| SWATIO_API_KEY | nein | Swat.io API Key |
| META_APP_ID | nein | Meta API |
| META_APP_SECRET | nein | Meta API, nur serverseitig |
| META_ACCESS_TOKEN | nein | Meta API, nur serverseitig |
| GOOGLE_SHEETS_CLIENT_EMAIL | nein | Google Sheets |
| GOOGLE_SHEETS_PRIVATE_KEY | nein | Google Sheets, nur serverseitig |
| OPENAI_API_KEY | nein | Zukuenftige KI-Automationen |

Fehlende optionale API Keys blockieren das MVP nicht. Der Healthcheck und pending Reporting-Laeufe zeigen nur fehlende Variablennamen, keine Secret-Werte. Fuer aktive Supabase-Persistenz muessen `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` gesetzt sein.

## Auth-Modi

- `mock_header`: aktueller MVP-Fallback ueber `X-User-Id`
- `hybrid`: bevorzugt Supabase Bearer Tokens, akzeptiert lokal weiter `X-User-Id`
- `supabase`: erzwingt Login ueber Supabase Auth

Der aktuelle Stand fuer internes Testen ist `AUTH_MODE=hybrid`. Damit bleibt das Dashboard lokal benutzbar, waehrend Supabase Auth schon serverseitig validiert werden kann.

## Healthcheck

```text
GET /api/health
```

Der Endpoint prueft:

- Serverstatus
- JSON-Datenzugriff
- Tool-/API-Verbindungszaehler
- Env-Konfigurationsstatus
- fehlende Integrationsvariablen als Namen, ohne Werte

Beispiel:

```bash
curl http://localhost:4173/api/health
```

## Datenbank und Migrationen

Fuer das lokale MVP sind keine Migrationen noetig. Die aktive Persistenz ist standardmaessig `data/db.json`.

Fuer Supabase/PostgreSQL:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

Oder in Supabase beide Dateien im SQL Editor ausfuehren. Danach:

```bash
DATA_REPOSITORY=supabase node --env-file=.env server.mjs
```

Details stehen in `docs/supabase-setup.md`.

## Relevante API-Endpunkte

- `GET /api/health`
- `GET /api/auth/config`
- `GET /api/auth/me`
- `GET /api/modules`
- `GET /api/tools`
- `GET /api/tools/:id`
- `PATCH /api/tools/:id/status`
- `GET /api/activity-logs`
- `POST /api/activity-logs`
- `GET /api/automations`
- `GET /api/automations/status`
- `GET /api/offers`
- `GET /api/offers/:id`
- `POST /api/offers/generate`
- `GET /api/reports`
- `GET /api/reports/:id`
- `POST /api/reports/generate`
- `GET /api/users`
- `GET /api/api-connections`
- `GET /api/settings`

## Deployment

Das Projekt ist jetzt fuer zwei Wege vorbereitet:

- klassischer Node-Deploy, z. B. Render oder Railway
- Cloudflare Workers mit GitHub Deploy

Build Command:

```bash
npm run build
```

Start Command:

```bash
npm start
```

Health Check Path:

```text
/api/health
```

Cloudflare-relevante Dateien:

- `wrangler.jsonc`
- `src/server/worker.mjs`

Cloudflare braucht fuer einen funktionierenden API-Deploy dieselben Supabase- und Auth-Variablen wie lokal.

Weitere Details stehen in `docs/deployment.md`.

## Deployment Checklist

- `.env.example` ist aktuell und enthaelt keine echten Secrets.
- `.env` ist nicht committet.
- `npm run build` oder `node scripts/check.mjs` ist gruen.
- `npm start` oder `node server.mjs` startet ohne Fehler.
- `/api/health` antwortet mit `success: true`.
- Hosting-Provider setzt `PORT`.
- Secrets sind nur serverseitig als Environment Variables gesetzt.
- Keine Secret-Werte erscheinen im Frontend oder Healthcheck.
- Datenbankstrategie ist entschieden: MVP JSON oder PostgreSQL/Supabase.
