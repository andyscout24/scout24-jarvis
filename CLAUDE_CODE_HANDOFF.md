# Claude Code Handoff

Dieses Dokument ist die zentrale Projektuebergabe fuer Claude Code.
Es beschreibt den aktuellen Stand des Social Jarvis Dashboards, die Architektur, bekannte Probleme, naechste Schritte und die wichtigsten Dateien.

## 1. Projektziel

Social Jarvis ist ein internes Automation Dashboard fuer Mitarbeiter.

Aktuell integrierte bzw. vorbereitete Module:

- Angebotsgenerator
- Reporting Tool
- Automation Hub
- Activity Logs
- Admin/Settings Basis
- Supabase Auth und Supabase Persistenz

Ziel des MVP:

- klare interne Arbeitsoberflaeche
- zentrale Navigation fuer alle Tools
- Tool-Status und letzte Aktivitaeten sichtbar
- Reports und Angebote abrufbar
- neue Automationen spaeter ueber Tool-Konfiguration erweiterbar

## 2. Tech Stack

Das Projekt nutzt bewusst keinen schweren Framework-Stack.

- Runtime: Node.js 20+
- Server: nativer Node HTTP Server
- Entry Point: `server.mjs`
- Frontend: statische SPA in `public/`
- Servercode: `src/server/`
- Shared Contracts: `src/shared/`
- Cloudflare Worker Support: vorhanden
- Persistenz:
  - lokal/moeglich: JSON in `data/db.json`
  - produktionsnah: Supabase / PostgreSQL

Wichtige Folge:

- kein Next.js
- kein Express
- kein Vite
- keine Frontend-Build-Pipeline

## 3. Wichtige Dateien und Ordner

### Root

- `server.mjs`  
  Startet die App lokal als Node-Server.

- `package.json`  
  Enthaltene Scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run health`
  - `npm run cf:dev`
  - `npm run cf:deploy`

- `wrangler.jsonc`  
  Cloudflare Worker Konfiguration.

- `.env.example`  
  Beispiel fuer alle benoetigten Umgebungsvariablen.

- `README.md`  
  Projektuebersicht und Setup.

- `docs/deployment.md`  
  Deployment-Hinweise.

- `docs/supabase-setup.md`  
  Supabase Setup und Auth-/Storage-Hinweise.

### Frontend

- `public/index.html`
- `public/styles.css`
- `public/src/main.js`
- `public/src/api.js`
- `public/src/components/`
- `public/src/views/`
- `public/src/modules/`
- `public/src/ui/`

### Backend

- `src/server/api/router.mjs`
- `src/server/auth/`
- `src/server/config/`
- `src/server/errors/`
- `src/server/logging/`
- `src/server/modules/`
- `src/server/persistence/`
- `src/server/security/`
- `src/server/services/`

### Datenbank

- `database/schema.sql`
- `database/seed.sql`

## 4. Architekturstatus

### Frontend

Die App ist eine statische SPA mit Hash-Routing.

Relevante Views:

- Home Dashboard
- Automation Hub
- Angebotsgenerator
- Reporting Center
- Activity Logs
- Settings / Admin
- Auth View

Der Frontend-Status ist fuer das MVP brauchbar, aber noch recht zentral in `public/src/main.js` organisiert.

### Backend

Alle API-Endpunkte laufen aktuell ueber einen zentralen Router in:

- `src/server/api/router.mjs`

Das funktioniert fuer das MVP, ist aber fuer die naechste Phase zu monolithisch.

### Datenhaltung

Es gibt zwei Modi:

- `DATA_REPOSITORY=json`
- `DATA_REPOSITORY=supabase`

Lokal laeuft das Projekt jetzt mit Supabase bereits erfolgreich.

## 5. Aktueller Funktionsstand

### Bereits umgesetzt

- Dashboard-Home mit Kennzahlen, Quick Actions und Aktivitaeten
- Automation Hub mit Status Badges und Tool Cards
- Angebotsgenerator-Ansicht
- Reporting Center mit Filter-UI
- Activity Logs Ansicht
- Admin/Settings Basis
- standardisierte API Responses
- zentrales Error Handling
- Health Check Endpoint
- Supabase Storage Integration
- Supabase Login Grundlagen
- Cloudflare Worker Deployment Support
- Agent-Konfigurationsdatei fuer Codex: `.codex/agents.toml`

### Wichtige letzte Aenderungen

Neueste Commits:

- `0b91b9b` Improve auth feedback and reporting filters
- `c651973` Add Codex agent role configuration
- `53cacf6` Fix Supabase auth route redirect
- `d690d3a` Fix Cloudflare worker path fallback
- `846a9ce` Add Cloudflare Workers deployment support
- `b13def6` Initial commit: Social Jarvis Dashboard MVP

## 6. Lokal getesteter Ist-Stand

Lokal ist die API aktuell gesund.

Verifizierter Check am 2026-06-18:

- `GET http://localhost:4173/api/health`
- Ergebnis:
  - `success: true`
  - `status: ok`
  - `authMode: hybrid`
  - `storage.mode: supabase`

Das bedeutet:

- lokale `.env` greift
- Supabase Verbindung lokal funktioniert
- API kann Tools und Daten lesen

## 7. Cloudflare Deployment Status

Das Projekt ist deployed, aber die Live-Umgebung ist aktuell **nicht korrekt konfiguriert**.

Live URL:

- `https://scout24-jarvis.andreas-will.workers.dev`

Aktueller Live Health Check am 2026-06-18:

- `GET /api/health` liefert HTTP `503`

Die Antwort zeigt:

- `authMode: mock_header`
- `storage.mode: json_file`
- `SUPABASE_URL` fehlt in Cloudflare
- `PUBLIC_BASE_URL` fehlt in Cloudflare
- dadurch kann die Live-API nicht korrekt auf Supabase zugreifen

Wichtig:

Das Frontend kann geladen werden, aber die API wirft deshalb Fehler wie:

- "Der Server konnte die Anfrage nicht verarbeiten."

## 8. Cloudflare Fix Checkliste

In Cloudflare muessen fuer den Worker mindestens diese Variablen gesetzt sein:

- `AUTH_MODE=hybrid`
- `DATA_REPOSITORY=supabase`
- `SUPABASE_URL=<deine-supabase-projekt-url>`
- `SUPABASE_SERVICE_ROLE_KEY=<dein-service-role-key>`
- `SUPABASE_SCHEMA=public`
- `NEXT_PUBLIC_SUPABASE_URL=<deine-supabase-projekt-url>`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<dein-publishable-key>`
- `PUBLIC_BASE_URL=https://scout24-jarvis.andreas-will.workers.dev`
- `SERVICE_NAME=social-jarvis-dashboard`

Danach:

1. neuen Deploy ausloesen
2. `GET /api/health` pruefen
3. Login und Dashboard erneut testen

## 9. Auth-Status

Unterstuetzte Modi:

- `mock_header`
- `hybrid`
- `supabase`

Empfohlener Modus aktuell:

- `AUTH_MODE=hybrid`

Warum:

- Supabase Login ist nutzbar
- lokaler Fallback bleibt fuer Entwicklung erhalten

Wichtig fuer die naechste Phase:

- Rollen-/Rechtepruefung backendseitig weiter haerten
- Header-Fallback spaeter fuer Produktion entfernen
- `AUTH_MODE=supabase` aktivieren, sobald alle Nutzer sauber ueber Supabase Auth gemappt sind

## 10. Bekannte technische Schwachstellen

### Architektur

- `src/server/api/router.mjs` ist zu gross und linear aufgebaut
- `public/src/main.js` ist zu zentral und uebernimmt zu viele Aufgaben
- Tool-Metadaten sind server- und clientseitig doppelt gepflegt

### Datenzugriff

- `src/server/persistence/supabaseRepository.mjs` laedt an einigen Stellen zu breit
- `incrementToolMetrics` ist potenziell nicht atomar

### UX / Produkt

- Activity Logs sind noch nicht ideal fuer Nicht-Techniker aufbereitet
- Tool Cards koennten in CTA-Struktur klarer sein
- Home priorisiert aktuell einfach nur die ersten Tools
- einige Copy-/Label-Mischungen sind noch Deutsch/Englisch gemischt

### QA

- keine echte Test-Suite
- kein ESLint
- kein TypeScript
- aktueller Quality Gate ist `scripts/check.mjs`

## 11. Bereits identifizierte Review-Erkenntnisse

### Product

- MVP ist funktional nah dran
- P0: Auth/Login stabilisieren, Live-Deploy stabilisieren, klare Tool-Status
- P1: Admin-Flow, bessere Ergebnis-Nutzung, Handover
- P2: weitere Integrationen und Politur

### UX/UI

- Login Fehleranzeige wurde bereits verbessert
- API Statusanzeige wurde dynamischer gemacht
- Reporting Filter arbeiten jetzt sinnvoller
- Accessibility-Fokus und `aria-current` wurden verbessert
- weitere Vereinheitlichung von CTA-Hierarchie und Log-Darstellung offen

### Architektur

- gemeinsame Tool-Registry waere der wichtigste Refactor
- Frontend-Store/App-Split sinnvoll
- API nach Domänen aufteilen

### Security

- keine Secrets ans Frontend geben
- Service Role nur serverseitig
- echte Produktionssicherheit haengt bei Supabase-Nutzung noch an serverseitiger Autorisierung

## 12. Wichtige API-Endpunkte

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

Standard Response Format:

```json
{
  "success": true,
  "data": {},
  "message": "..."
}
```

Error Format:

```json
{
  "success": false,
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

## 13. Lokales Starten

```bash
cp .env.example .env
node --env-file=.env server.mjs
```

Danach:

- `http://localhost:4173`

Health Check:

```bash
curl http://localhost:4173/api/health
```

Projektcheck:

```bash
node scripts/check.mjs
```

## 14. Empfohlene naechste Aufgaben fuer Claude Code

### Sofort

1. Cloudflare Live-Konfiguration mit den korrekten Supabase Variablen stabilisieren
2. Live `/api/health` validieren
3. Login-End-to-End gegen Live pruefen
4. Dashboard Home live gegen echte API-Daten pruefen

### Kurzfristig

1. gemeinsame Tool-Registry fuer Frontend + Backend extrahieren
2. `src/server/api/router.mjs` in Domänen-Router zerlegen
3. `public/src/main.js` in App, Router, Store und Bootstrap aufteilen
4. Log-Darstellung fuer Nicht-Techniker verbessern

### Danach

1. echtes Rollen-/Rechtemodell weiter haerten
2. Reporting-Datenquellen sauberer anbinden
3. Tests einfuehren
4. Admin Settings ausbauen

## 15. Dinge, die Claude Code nicht kaputt machen sollte

- bestehende Angebotsgenerator-Logik nicht neu schreiben
- bestehende Reporting-Flows nicht unnötig umbauen
- API Response Format konsistent halten
- Supabase Service Role niemals im Frontend verwenden
- `.env` und echte Secrets niemals committen

## 16. Praktischer Arbeitsauftrag fuer Claude Code

Wenn du Claude Code mit diesem Projekt uebernimmst, starte in dieser Reihenfolge:

1. lies `README.md`
2. lies `docs/deployment.md`
3. lies `docs/supabase-setup.md`
4. pruefe `server.mjs`, `src/server/worker.mjs`, `wrangler.jsonc`
5. pruefe `public/src/main.js` und `src/server/api/router.mjs`
6. behebe zuerst die Cloudflare Live-Konfiguration bzw. das Live-API-Problem
7. danach strukturelle Refactors nur schrittweise und ohne MVP-Bruch

## 17. Kurzfassung fuer die Uebergabe

Das Projekt ist lokal funktionsfaehig und an Supabase angebunden.
Die groesste offene Baustelle ist aktuell nicht die Business-Logik, sondern die Live-Konfiguration in Cloudflare.
Sobald die benoetigten Worker-Umgebungsvariablen korrekt gesetzt sind, sollte das Live-Dashboard wieder mit echter API statt Fehlerbanner laufen.
