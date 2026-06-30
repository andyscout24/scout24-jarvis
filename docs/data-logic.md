# Datenlogik

## Uebersicht

Das Dashboard ist eine interne Website mit serverseitiger API und einer statischen SPA im Frontend.
Die Daten werden nicht direkt im Frontend zusammengebaut, sondern ueber die API geladen und dort bereits nach Rolle, Tool-Zugriff und Sensitivitaet gefiltert.

## Datenquellen

### Primaere App-Daten

- `data/db.json`
  - lokaler MVP-Fallback
  - enthaelt Tools, Automationen, Reports, Offers, User, Logs, API-Verbindungen und Settings

- `Supabase`
  - produktionsnahe Datenquelle
  - wird ueber `src/server/persistence/supabaseRepository.mjs` angesprochen
  - aktiviert durch `DATA_REPOSITORY=supabase`

### Auth-Daten

- `Supabase Auth`
  - Browser sendet Bearer Token
  - Server loest den User ueber `src/server/auth/authService.mjs` auf

- `X-User-Id` / `X-User-Email`
  - lokaler Fallback fuer `mock_header` oder `hybrid`

### Externe Integrationen

- Reporting Tool / FastAPI
- Swat.io
- Meta API
- Google Sheets
- weitere Datenquellen erscheinen bisher hauptsaechlich als Konfigurations- und Statusobjekte

## Serverseitiger Datenfluss

1. `src/server/app.mjs` erstellt Services
2. `src/server/api/router.mjs` mappt Requests auf Services
3. Services lesen und verarbeiten Daten:
   - `automationService`
   - `resultService`
   - `logService`
   - `adminService`
   - `healthService`
4. Repository liefert Daten aus:
   - JSON Store oder
   - Supabase REST
5. Payloads werden vor der Rueckgabe fuer den Client bereinigt

## Frontend-Datenfluss

Der Frontend-Einstieg ist `public/src/main.js`.

Seit der Ueberarbeitung laeuft das Laden ueber:

- `public/src/data/dashboardData.js`

### Ablauf

1. `getAuthConfig()`
2. `getCurrentUser()`
3. danach rollenbasiertes Laden der erlaubten Datenbereiche:
   - `tools`
   - `automations`
   - `offers`
   - `reports`
   - `logs`
   - `users`
   - `apiConnections`
   - `settings`

### Partielle Robustheit

Frueher:
- ein einzelner API-Fehler konnte das gesamte Dashboard-Laden abbrechen

Jetzt:
- jeder Datenbereich wird separat geladen
- fehlerhafte Bereiche fallen auf sichere Defaults zurueck
- das Dashboard bleibt benutzbar
- Teilfehler werden als Warnung sichtbar gemacht

## API-/Service-Struktur

### Frontend

- `public/src/api.js`
  - low-level API Client
  - HTTP Request, Auth Header, JSON Parsing, Error Mapping

- `public/src/data/dashboardData.js`
  - orchestration layer fuer Dashboard-Daten
  - sammelt Ressourcen, setzt Fallbacks und erzeugt Meta-Informationen

### Backend

- `src/server/api/router.mjs`
  - API-Routing

- `src/server/services/*.mjs`
  - Business Logic pro Bereich

- `src/server/persistence/*.mjs`
  - Datenquelle

## Loading, Empty und Error States

### Loading

- globaler Ladebanner in `Shell`
- API-Status `loading`

### Partial Error

- API-Status `degraded`
- Warning-Banner in `Shell`
- einzelne Datenbereiche zeigen leere, aber stabile Fallback-Ansichten

### Hard Error

- Error-Banner in `Shell`
- Dashboard-Daten werden auf einen sicheren Leerzustand gesetzt

### Empty States

Verbessert fuer:

- Dashboard Arbeitsbereiche
- Dashboard Ergebnisindex
- Activity Log Liste
- Settings-Bereiche fuer fehlende Integrationen, User oder API-Verbindungen

## Aktualisierung der Daten

### Initial

- bei `DOMContentLoaded`

### Manuell

- ueber den Refresh-Button

### Nach Aktionen

- nach Login
- nach Logout
- nach Tool-Status-Aenderung
- nach Offer-Erstellung
- nach Report-Erstellung

Jede dieser Aktionen laedt die Dashboard-Daten neu.

## Bekannte naechste Verbesserungen

- API-Router in fachliche Router aufteilen
- Supabase-Zugriffe weiter optimieren
- Health-Daten gezielt auch im Frontend-Modell nutzbar machen
- View-spezifische Ladezustande einfuehren
- Tests fuer Datenorchestrierung und API-Fehlerfaelle ergaenzen
