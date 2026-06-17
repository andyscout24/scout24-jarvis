# Deployment Guide

## Zielruntime

Das Social Jarvis Dashboard ist aktuell eine dependency-freie Node.js App:

- Runtime: Node.js 20 oder neuer
- Server: `server.mjs`
- Frontend: statische SPA in `public`
- Persistenz im MVP: `data/db.json`
- Produktionsziel: PostgreSQL/Supabase mit `database/schema.sql` und `database/seed.sql`

## Empfohlener Anbieter

Fuer dieses MVP ist Railway oder Render am sinnvollsten, weil beide einen klassischen Node-HTTP-Server mit Healthcheck und Port-Binding sauber unterstuetzen.

Vercel und Netlify sind fuer dieses Projekt weniger passend, solange der Server als eigener Node-HTTP-Prozess laeuft. Sie waeren besser, wenn das Projekt spaeter auf Next.js, serverless functions oder reine Static/API-Splits umgebaut wird.

## Build und Start

Build Command:

```bash
npm run build
```

Start Command:

```bash
npm start
```

Ohne npm kann lokal direkt geprueft und gestartet werden:

```bash
node scripts/check.mjs
node server.mjs
```

## Healthcheck

Endpoint:

```text
GET /api/health
```

Beispiel:

```bash
curl http://localhost:4173/api/health
```

Der Healthcheck gibt nur Konfigurationsstatus und fehlende Variablennamen aus. Secret-Werte werden nicht ausgegeben.

## Environment Variables

Pflicht fuer lokalen MVP-Start:

| Variable | Zweck | Beispiel |
| --- | --- | --- |
| PORT | HTTP-Port | `4173` |
| NODE_ENV | Node-Umgebung | `development` |
| APP_ENV | App-Umgebung | `development` |
| DATA_FILE_PATH | JSON-Datenfile fuer MVP | `data/db.json` |

Empfohlen fuer Deployment:

| Variable | Zweck |
| --- | --- |
| SERVICE_NAME | Name im Healthcheck |
| PUBLIC_BASE_URL | Oeffentliche App-URL |
| DATABASE_URL | PostgreSQL/Supabase Ziel-DB |
| AUTH_MODE | Auth-Modus, empfohlen `hybrid` |
| DATA_REPOSITORY | `json`, `supabase` oder `auto` |

Optionale Integrationen:

| Variable | Integration |
| --- | --- |
| CAMPAIGN_REVIEW_BASE_URL | Reporting FastAPI |
| SWATIO_BASE_URL | Swat.io |
| SWATIO_API_KEY | Swat.io |
| META_APP_ID | Meta API |
| META_APP_SECRET | Meta API |
| META_ACCESS_TOKEN | Meta API |
| GOOGLE_SHEETS_CLIENT_EMAIL | Google Sheets |
| GOOGLE_SHEETS_PRIVATE_KEY | Google Sheets |
| OPENAI_API_KEY | Zukuenftige KI-Automationen |
| SUPABASE_URL | Supabase |
| SUPABASE_ANON_KEY | Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Supabase serverseitig |
| NEXT_PUBLIC_SUPABASE_URL | Supabase Login im Browser |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Supabase Publishable Key im Browser |

## Datenbankmigration

Fuer das MVP sind keine Migrationen noetig, solange `data/db.json` genutzt wird.

Fuer Produktion:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

Danach Supabase als aktive Persistenz setzen:

```bash
DATA_REPOSITORY=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

## Railway

1. Repository verbinden.
2. Node.js Runtime erkennen lassen.
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Environment Variables aus `.env.example` setzen.
6. Healthcheck Path: `/api/health`
7. Nach Deployment `npm run health` lokal gegen die Live-URL ausfuehren:

```bash
DASHBOARD_HEALTHCHECK_URL=https://example.up.railway.app/api/health npm run health
```

## Render

1. New Web Service anlegen.
2. Runtime: Node.
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Health Check Path: `/api/health`
6. Environment Variables setzen.

## Deployment Checklist

- `.env.example` ist aktuell und enthaelt keine echten Secrets.
- `.env` ist nicht committet.
- `npm run build` bzw. `node scripts/check.mjs` ist gruen.
- `npm start` bzw. `node server.mjs` startet ohne Fehler.
- `/api/health` antwortet mit `success: true`.
- Hosting-Provider setzt `PORT` automatisch oder passend.
- Produktions-Secrets sind nur serverseitig gesetzt.
- Keine Secret-Werte werden im Frontend oder Healthcheck angezeigt.
- Datenbankstrategie ist entschieden: MVP JSON oder PostgreSQL/Supabase.
