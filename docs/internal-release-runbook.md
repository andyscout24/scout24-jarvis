# Internal Release Runbook

## Zielbild

Empfohlener erster interner Release:

- Hosting: Render Web Service
- Zugriffsschutz: Supabase Auth und optional IP-Allowlist
- Datenhaltung: Supabase
- Auth: Supabase
- App Mode: `AUTH_MODE=supabase`

## 1. Vorbereitungen

### Repository

- aktueller Stand ist auf `main`
- `npm run build` ist gruen
- keine lokalen Secrets im Git

### Supabase

- Projekt existiert
- `database/schema.sql` ist ausgefuehrt
- `database/seed.sql` ist ausgefuehrt oder Produktivdaten sind vorbereitet
- freigeschaltete interne User sind in Auth und `users` gemappt

## 2. Produktionsvariablen

Nutze als Vorlage:

- [.env.internal.example](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/.env.internal.example)

Pflicht:

- `NODE_ENV=production`
- `APP_ENV=production`
- `SERVICE_NAME=social-jarvis-dashboard`
- `PUBLIC_BASE_URL=...`
- `AUTH_MODE=supabase`
- `DATA_REPOSITORY=supabase`
- `SUPABASE_URL=...`
- `SUPABASE_SCHEMA=public`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...`

## 3. Sicherheitsregeln vor Deployment

- kein `mock_header` in Produktion
- kein offener `hybrid`-Fallback
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig
- nur interne Nutzer duerfen die App erreichen
- keine Secrets in Logs, Healthcheck oder UI

## 4. Build-Check

```bash
npm run build
```

Oder ohne npm:

```bash
node scripts/check.mjs
```

Erwartung:

- keine Syntaxfehler
- `data/db.json` validiert

## 5. Deploy auf Render

### Service-Kontext

- Runtime: `Node`
- Build Command: `npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`

### Environment Variables setzen

Setze alle Pflichtvariablen aus `.env.internal.example` im Render Service.

### Optional: Netzgrenzen aktivieren

Wenn ihr feste Firmen- oder VPN-IP-Ranges habt:

- Inbound IP Rules auf diese CIDR-Ranges setzen
- Zugriff ausserhalb dieser Netze blockieren

## 6. Smoke Test nach Deployment

### Technisch

1. `GET /api/health`
2. Login testen
3. API-Status in der UI pruefen

### Fachlich

1. Dashboard laedt
2. Arbeitsbereiche laedt
3. Angebotsgenerator laedt
4. Reporting Center laedt
5. Datenquellenansicht laedt
6. Help/Doku laedt

### Rollen

Mindestens testen mit:

- Admin
- Sales User
- Marketing User
- Management Viewer

## 7. Abnahmekriterien fuer internen Go-live

- Login funktioniert
- Rollenrechte greifen serverseitig
- Dashboard bleibt auch bei Teilfehlern stabil
- keine Secrets im Browser sichtbar
- `/api/health` ist gruen oder nachvollziehbar `degraded`
- kritische Kernmodule sind nutzbar

## 8. Falls etwas schiefgeht

### Typische Ursachen

- `SUPABASE_URL` fehlt
- `SUPABASE_SERVICE_ROLE_KEY` fehlt
- `NEXT_PUBLIC_SUPABASE_*` fehlt
- `AUTH_MODE` falsch gesetzt
- User nicht in `users` gemappt

### Erste Checks

1. `/api/health`
2. Browser-Konsole
3. Deployment-Umgebungsvariablen
4. Supabase Auth User Mapping

## 9. Empfohlene naechste Schritte nach erstem Go-live

1. `hybrid` nur noch lokal verwenden
2. Token-Speicherung spaeter in sichere Session/Cookie-Strategie ueberfuehren
3. API-Router fachlich aufteilen
4. Monitoring und Access Audits erweitern
