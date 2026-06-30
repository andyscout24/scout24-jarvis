# Deployment Guide

## Ziel

Dieses Dokument beschreibt, wie Social Jarvis intern veroeffentlicht werden kann.

Empfohlene Zielarchitektur:

- Hosting: Render Web Service
- Zugriffsschutz: Supabase Auth und optional IP-Allowlist
- Datenhaltung: Supabase
- Auth: Supabase

## Build und Start

### Build

```bash
npm run build
```

Das prueft:

- Syntax aller Quell-Dateien
- JSON-Struktur von `data/db.json`

### Lokaler Start

```bash
node --env-file=.env server.mjs
```

Oder:

```bash
npm run start:env
```

### Produktionsstart als Node-Service

```bash
npm start
```

## Healthcheck

```text
GET /api/health
```

Pruefen mit:

```bash
curl https://<deine-url>/api/health
```

Erwartung:

- `success: true`
- `data.status: ok`

## Empfohlene interne Hosting-Variante

### Primaere Empfehlung: Render Web Service

Warum das gut passt:

- das Projekt startet direkt als klassischer Node-Webservice
- Render dokumentiert Web Services mit Environment Variables und Health Checks
- Render unterstuetzt Inbound IP Rules fuer CIDR-Allowlisting
- damit koennt ihr die App fuer interne Netze zusaetzlich einschraenken

### Alternative: Railway

Sinnvoll, wenn ihr:

- klassisches Node-Hosting bevorzugt
- schneller in einen einfachen Webservice deployen wollt

Weniger stark, wenn ihr zusaetzlich Plattform-seitige IP-Einschraenkungen wollt.

## Deployment auf Render

### Voraussetzungen

- Repository in GitHub
- Render-Account
- Supabase-Projekt eingerichtet
- Schema und Seed eingespielt

### Service-Konfiguration

- Runtime: `Node`
- Build Command: `npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`

### Pflicht-Variablen

```env
NODE_ENV=production
APP_ENV=production
SERVICE_NAME=social-jarvis-dashboard
PUBLIC_BASE_URL=https://<deine-internal-url>

AUTH_MODE=supabase
DATA_REPOSITORY=supabase

SUPABASE_URL=
SUPABASE_SCHEMA=public
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### Optionale Integrationen

```env
CAMPAIGN_REVIEW_BASE_URL=
SWATIO_BASE_URL=
SWATIO_API_KEY=
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
OPENAI_API_KEY=
```

### Optional fuer staerkeren internen Schutz

- Inbound IP Rules nur fuer Firmen- oder VPN-CIDRs setzen
- Zugriff ausserhalb dieser Netze blockieren

### Wichtige Regel

- `AUTH_MODE=supabase`
- kein `mock_header`
- kein offener `hybrid`-Fallback

## Deployment auf Railway

### Build Command

```bash
npm run build
```

### Start Command

```bash
npm start
```

### Healthcheck

```text
/api/health
```

### Pflichtvariablen

Gleich wie oben, insbesondere:

- `AUTH_MODE=supabase`
- `DATA_REPOSITORY=supabase`
- Supabase-URL und Service-Role-Key

Hinweis:

- Railway passt gut fuer den einfachen App-Betrieb
- den internen Schutz loest ihr dort vor allem ueber Auth und Freigaben, nicht ueber eine harte Netzgrenze

## Datenbank / Supabase vorbereiten

### Schema ausfuehren

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

Oder in Supabase SQL Editor:

1. `database/schema.sql`
2. `database/seed.sql`

## Start-Checkliste

Vor dem ersten internen Test:

- `.env.example` ist aktuell
- `.env` enthaelt keine Beispielwerte mehr
- Build ist gruen
- Supabase ist erreichbar
- `AUTH_MODE=supabase` gesetzt
- `DATA_REPOSITORY=supabase` gesetzt
- `/api/health` ist gruen
- Login funktioniert

## Go-live-Checkliste

### Runtime

- Build erfolgreich
- Start erfolgreich
- Healthcheck erfolgreich

### Sicherheit

- interner Zugriffsschutz aktiv
- keine Secrets im Frontend
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig
- keine offenen Entwicklungsmodi

### Daten

- Supabase-Schema und Seed oder Produktivdaten vorhanden
- User sind korrekt gemappt
- Reports, Offers und Tools laden

### Fachlicher Smoke Test

- Dashboard laedt
- Angebotsgenerator erreichbar
- Reporting Center erreichbar
- Datenquellenansicht erreichbar
- Activity Logs erreichbar
- Logout/Login funktionieren

## Empfehlung fuer den ersten internen Release

Der sauberste erste Go-live ist:

1. Supabase final konfigurieren
2. `AUTH_MODE=supabase` festziehen
3. Render Web Service deployen
4. optional IP-Allowlist fuer Firmen-/VPN-Netze setzen
5. Healthcheck und Smoke Test durchfuehren
