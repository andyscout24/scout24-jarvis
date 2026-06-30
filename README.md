# Social Jarvis Dashboard

Interne Website fuer Angebotsgenerator, Reporting Center, Activity Logs und weitere Automatisierungen.

## Projektueberblick

Social Jarvis ist eine interne Arbeitsoberflaeche fuer Teams aus Sales, Marketing, Management und Admin.

Die App bietet aktuell:

- `Dashboard` mit Status, Ergebnissen und Schnellzugriffen
- `Arbeitsbereiche` fuer interne Automatisierungen
- `Angebotsgenerator`
- `Reports & Details`
- `Datenquellen & Einstellungen`
- `Hilfe & Dokumentation`

## Tech Stack

Das Projekt nutzt bewusst einen schlanken Fullstack-Stack:

- Node.js HTTP Server
- statische SPA aus `public/`
- serverseitige API in `src/server/`
- ESM-Module
- JSON-Fallback fuer lokales MVP
- Supabase / PostgreSQL fuer produktionsnahe Datenhaltung
- optional Cloudflare Worker Deployment

Wichtig:

- kein Next.js
- kein Express
- kein Vite-Frontend-Build

## Wichtige Verzeichnisse

```text
public/
  index.html
  styles.css
  src/
    api.js
    main.js
    router.js
    data/
    components/
    views/

src/
  server/
    api/
    auth/
    config/
    errors/
    logging/
    modules/
    persistence/
    services/
    static/
    worker.mjs

database/
  schema.sql
  seed.sql

docs/
  architecture.md
  auth-model.md
  data-logic.md
  deployment.md
  security-internal-access.md
  supabase-setup.md
```

## Voraussetzungen

- Node.js `>= 20.11`
- optional npm
- optional Supabase / PostgreSQL

## Lokale Startanleitung

### 1. Environment-Datei anlegen

```bash
cp .env.example .env
```

### 2. Minimalkonfiguration

Fuer lokales Starten reicht der JSON-Modus:

```env
NODE_ENV=development
APP_ENV=development
PORT=4173
AUTH_MODE=hybrid
DATA_REPOSITORY=json
DATA_FILE_PATH=data/db.json
PUBLIC_BASE_URL=http://localhost:4173
```

### 3. Server starten

Mit lokaler Node-Installation:

```bash
node --env-file=.env server.mjs
```

Oder ueber npm:

```bash
npm run start:env
```

### 4. App oeffnen

```text
http://localhost:4173
```

Login-Ansicht:

```text
http://localhost:4173/#/auth
```

## Lokaler Start mit Supabase

Wenn du statt JSON direkt Supabase nutzen willst:

```env
AUTH_MODE=hybrid
DATA_REPOSITORY=supabase
SUPABASE_URL=
SUPABASE_SCHEMA=public
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Dann:

```bash
node --env-file=.env server.mjs
```

Mehr dazu in:

- [docs/supabase-setup.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/supabase-setup.md)

## Build-Anleitung

Das Projekt hat keinen klassischen Bundle-Build. `npm run build` fuehrt einen Projektcheck aus:

- Syntaxcheck aller `.js` und `.mjs` Dateien
- Validierung von `data/db.json`

Build ausfuehren:

```bash
npm run build
```

Oder ohne npm:

```bash
node scripts/check.mjs
```

## Start-Skripte

```bash
npm run dev
npm run start
npm run start:env
npm run build
npm run check
npm run health
npm run cf:dev
npm run cf:deploy
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

Der Healthcheck liefert:

- Serverstatus
- Storage-Modus
- Tool-/Fehlerzaehler
- Integrationskontext
- fehlende Variablennamen ohne Secret-Werte

## Benoetigte Umgebungsvariablen

### Pflicht fuer lokalen Start

| Variable | Zweck |
| --- | --- |
| `NODE_ENV` | Laufzeitmodus |
| `APP_ENV` | App-Kontext |
| `PORT` | lokaler Port |
| `PUBLIC_BASE_URL` | Basis-URL |
| `AUTH_MODE` | `hybrid`, `mock_header`, `supabase` |
| `DATA_REPOSITORY` | `json`, `supabase`, `auto` |
| `DATA_FILE_PATH` | JSON-Datei fuer MVP |

### Pflicht fuer Supabase-Betrieb

| Variable | Zweck |
| --- | --- |
| `SUPABASE_URL` | Supabase-Projekt-URL |
| `SUPABASE_SCHEMA` | Schema, meist `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | serverseitiger Zugriff |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-Login |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-Login |

### Optional / Integrationen

| Variable | Zweck |
| --- | --- |
| `DATABASE_URL` | Postgres / Tooling |
| `CAMPAIGN_REVIEW_BASE_URL` | Reporting FastAPI |
| `SWATIO_BASE_URL` | Swat.io |
| `SWATIO_API_KEY` | Swat.io |
| `META_APP_ID` | Meta |
| `META_APP_SECRET` | Meta serverseitig |
| `META_ACCESS_TOKEN` | Meta serverseitig |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Google Sheets |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Google Sheets serverseitig |
| `OPENAI_API_KEY` | spaetere KI-Funktionen |

Wichtig:

- `.env.example` enthaelt nur Platzhalter
- `.env` bleibt uncommitted
- Service-Role- und API-Secrets duerfen nie im Client-Code landen

## Empfohlene Hosting-Variante fuer interne Nutzung

### Empfehlung

Fuer dieses Projekt ist am sinnvollsten:

- **Render Web Service**
- plus **Supabase** als Datenquelle
- plus **`AUTH_MODE=supabase`**
- optional **IP-Allowlist** fuer Firmen- oder VPN-Netze

Warum:

- die App startet direkt als klassischer Node-Webservice
- Render unterstuetzt offizielle Web-Service-Deployments mit Environment Variables und Health Checks
- wenn ihr feste Firmen- oder VPN-IP-Ranges habt, koennt ihr den Zugriff zusaetzlich per Inbound IP Rules eingrenzen

### Alternative

Wenn ihr bewusst klassisch hosten wollt:

- Railway als Node-Webservice

Das ist okay, aber wenn ihr ohne Cloudflare arbeitet und zusaetzlich Netzwerkgrenzen setzen wollt, ist Render aktuell die staerkere Standardempfehlung.

## Deployment-Anleitung

Die ausfuehrliche Anleitung steht in:

- [docs/deployment.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/deployment.md)

Kurzfassung:

1. Build pruefen
2. Environment Variables setzen
3. Storage auf Supabase stellen
4. Auth fuer Deployment auf `supabase`
5. `/api/health` pruefen
6. optional IP-Allowlist oder internen Netzschutz aktivieren

## Auth fuer internes Deployment

### Lokal

- `AUTH_MODE=hybrid`

### Internes Deployment

- `AUTH_MODE=supabase`

Nicht empfohlen fuer Produktion:

- `mock_header`
- `hybrid` mit offenem Browser-Zugriff

Mehr dazu:

- [docs/security-internal-access.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/security-internal-access.md)

## Go-live-Checkliste

### Build & Runtime

- `npm run build` ist gruen
- App startet lokal ohne Fehler
- `/api/health` antwortet mit `success: true`

### Daten

- Supabase Schema eingespielt
- Seed-Daten oder Produktivdaten verfuegbar
- `DATA_REPOSITORY=supabase`

### Auth & Security

- `AUTH_MODE=supabase`
- kein produktiver `X-User-Id`-Fallback
- interne Zugriffsbeschraenkung aktiv
- keine Secrets im Frontend
- `.env` nicht committet

### Integrationen

- benoetigte URLs und Keys gesetzt
- fehlende Integrationen bewusst als `pending` akzeptiert oder konfiguriert

### Fachlich

- Dashboard laedt
- Angebotsgenerator laeuft
- Reporting Center laeuft
- Datenquellenansicht laedt
- Activity Logs sind sichtbar

## Weitere Dokumentation

- [docs/architecture.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/architecture.md)
- [docs/auth-model.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/auth-model.md)
- [docs/data-logic.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/data-logic.md)
- [docs/internal-release-runbook.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/internal-release-runbook.md)
- [docs/security-internal-access.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/security-internal-access.md)
- [docs/supabase-setup.md](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docs/supabase-setup.md)
