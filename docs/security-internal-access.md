# Security und Internal Access

## Ziel

Die Website ist fuer interne Nutzung gedacht. Daraus folgen drei zentrale Sicherheitsziele:

1. nur freigeschaltete interne Nutzer duerfen zugreifen
2. keine Secrets oder sensiblen Konfigurationswerte duerfen im Frontend landen
3. Rollen und Berechtigungen muessen serverseitig erzwungen werden

## Aktueller Stand

### Positiv

- `.env` und `.env.*` sind in `.gitignore` ausgeschlossen
- `.env.example` enthaelt nur Platzhalter
- serverseitige Payload-Sanitization filtert typische Secret-Felder
- API-Fehler geben keine Stacktraces an Clients aus
- Settings maskieren Secret-Werte vor der Rueckgabe an den Client

### Kritisch / relevant

- `AUTH_MODE=mock_header` oder `hybrid` erlaubt lokalen Header-Fallback
- `X-User-Id` ist kein produktionsreifes Auth-Verfahren
- Supabase Access- und Refresh-Tokens liegen aktuell im `localStorage`
- `getPublicAuthConfig()` darf bewusst oeffentliche Supabase-Werte ausliefern, aber keine privaten

## Empfohlenes internes Zugriffskonzept

### Empfohlene Zielarchitektur

1. vorgeschalteter interner Zugriffsschutz
   - Cloudflare Access, SSO, oder Workspace-Auth
2. echte Benutzeridentitaet
   - Supabase Auth oder Firmen-SSO
3. serverseitige Rollenpruefung
   - bestehende Permission-Logik weiterverwenden

### Fuer Sites / interne Arbeitsoberflaeche

Wenn die App spaeter als interne Site laeuft:

- Zugriff auf die Site nur fuer interne Nutzer oder definierte Gruppe
- zusaetzlich serverseitig den aktuellen User aus verifizierten Headern oder Tokens ableiten
- keine vertrauensbasierten Custom-Headers aus dem Browser zulassen

## Auth-Empfehlung

### Kurzfristig

- lokal weiter `hybrid`
- deployed intern: `supabase`

### Ziel

- `AUTH_MODE=supabase`
- `allowMockHeader=false`
- kein `X-User-Id`-Fallback in Produktion

### Besser als aktueller Browser-Token-Ansatz

Aktuell werden Tokens in `localStorage` gespeichert. Das ist fuer MVPs haeufig, aber nicht ideal.

Sicherer waere:

- serverseitige Session
- oder `httpOnly`, `secure`, `sameSite` Cookies

Wenn das Projekt bei einem rein clientseitigen Supabase-Login bleibt, muessen mindestens diese Massnahmen gelten:

- sehr restriktive CSP
- keine unsicheren Drittanbieter-Skripte
- keine XSS-Risiken im HTML-Rendering

## Sensible Konfigurationswerte

### Duerfen nur serverseitig existieren

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `SWATIO_API_KEY`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN`
- `GOOGLE_SHEETS_PRIVATE_KEY`
- `OPENAI_API_KEY`

### Duerfen im Client sichtbar sein

Diese Werte sind oeffentlich bzw. bewusst fuer den Browser bestimmt:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- optional `SUPABASE_ANON_KEY`, wenn bewusst als Public Client Key genutzt

## Sichere .env-Struktur

### Lokal

```env
NODE_ENV=development
APP_ENV=development
PORT=4173
SERVICE_NAME=social-jarvis-dashboard
PUBLIC_BASE_URL=http://localhost:4173

AUTH_MODE=hybrid
DATA_REPOSITORY=supabase

SUPABASE_URL=
SUPABASE_SCHEMA=public
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### Internes Deployment

```env
NODE_ENV=production
APP_ENV=production
SERVICE_NAME=social-jarvis-dashboard
PUBLIC_BASE_URL=https://internal.example

AUTH_MODE=supabase
DATA_REPOSITORY=supabase

SUPABASE_URL=
SUPABASE_SCHEMA=public
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Wichtig:

- keine echten Secrets in `.env.example`
- keine Secrets im Frontend-Bundle
- keine Secrets in Logs oder Health-Responses

## Datenschutzrisiken

Folgende Datenarten sind im Projekt sichtbar oder ableitbar:

- interne Mitarbeiterdaten: Name, E-Mail, Rolle, Team
- Aktivitaetsdaten: wer hat welches Tool genutzt
- Kunden-/Angebots-/Report-Metadaten

Risiken:

- zu breite Sichtbarkeit von Logs
- Management- oder Marketing-Nutzer sehen Daten, die nicht fuer sie bestimmt sind
- Dateinamen oder Metadaten enthalten Kundennamen

Empfehlungen:

- Logs weiter rollenbasiert einschränken
- Dateinamen und Result-Listen auf notwendige Felder begrenzen
- sensible Kundendetails nur dort zeigen, wo sie fachlich gebraucht werden
- Retention fuer Logs und historische Resultate definieren

## Deployment-Security-Checkliste

- `AUTH_MODE=supabase` fuer interne Deployments
- `X-User-Id`-Fallback in Produktion deaktivieren
- Zugriff auf Hosting nur fuer interne Nutzer/Gruppen
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig
- keine Secrets in Healthcheck oder Settings ausgeben
- `.env` nie committen
- CSP und Security Headers setzen
- HTTPS erzwingen
- Access Logs und Fehlerlogs ohne Secret-Werte
- Rollen serverseitig pruefen, nicht nur im Frontend
- regelmaessig pruefen, welche APIs wirklich konfiguriert sind

## Naechste konkrete Sicherheitsmassnahmen

1. Produktionsmodus auf `AUTH_MODE=supabase` festziehen
2. `mock_header`/`hybrid` fuer Deployments unterbinden
3. Tokens langfristig aus `localStorage` in sichere Sessions oder Cookies verschieben
4. Hosting auf interne Access-Gruppe beschraenken
5. Security Header und CSP explizit konfigurieren
