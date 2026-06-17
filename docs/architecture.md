# Social Jarvis Dashboard Architektur

## Architekturziel

Das Dashboard ist ein interner Automation Hub. Es soll Mitarbeiter schnell zu den richtigen Tools fuehren, Ergebnisse auffindbar machen und Betriebsstatus transparent zeigen. Die Architektur trennt UI, API, Business Logic, Moduladapter und Datenhaltung, damit neue Automatisierungen ohne Router- oder UI-Sonderlogik ergaenzt werden koennen.

Aktueller Projektrahmen:

- Keine Next.js-App im Workspace, daher aktuell kleine dependency-freie SPA plus Node-HTTP-Backend.
- Frontend liegt unter `public`.
- Backend liegt unter `src/server`; `server.mjs` ist nur noch der Startpunkt.
- Persistenz ist fuer das MVP `data/db.json`; Zielzustand ist Postgres.
- Reporting Tool wurde extern gefunden als Python/FastAPI-Service `campaign_review_tool`.
- Angebotsgenerator ist fachlich `ready`, aber der konkrete Quellcode liegt nicht im Workspace.

## Empfohlene Ordnerstruktur

```text
.
  server.mjs
  data/
    db.json
  docs/
    architecture.md
  public/
    index.html
    styles.css
    assets/
    src/
      api.js
      main.js
      router.js
      components/
      views/
      modules/
        automations/
          registry.js
        results/
          resultTypes.js
  src/
    shared/
      contracts.mjs
    server/
      app.mjs
      api/
        router.mjs
      config/
        paths.mjs
      errors/
        apiError.mjs
      http/
        request.mjs
        response.mjs
      logging/
        auditLogger.mjs
      modules/
        automationModule.mjs
        registry.mjs
      persistence/
        jsonStore.mjs
      services/
        automationService.mjs
        logService.mjs
        resultService.mjs
        userService.mjs
      static/
        staticServer.mjs
      utils/
        collections.mjs
```

Wenn spaeter Next.js eingefuehrt wird, sollte die gleiche Fachstruktur beibehalten werden:

```text
app/
  page.tsx
  tools/
  reporting/
  offers/
  admin/
  api/
components/
lib/
  auth/
  db/
  errors/
modules/
  offer-generator/
  reporting-tool/
  lead-list-generator/
```

## Modul-Konzept

Jede Automatisierung besteht aus zwei Ebenen:

1. Tool Registry Eintrag
   - Name, Beschreibung, Status, Owner, Route, Kategorie, Metriken.
   - Wird in der Datenbank gespeichert und im UI angezeigt.

2. Moduladapter
   - Kapselt technische Anbindung und Faehigkeiten.
   - Beispiel: externer Link, FastAPI-Service, spaeter Job Queue oder direkte Library.
   - Verhindert, dass Tool-Spezifika in API-Routen landen.

Moduladapter beantworten:

- Welche Capabilities hat das Tool?
- Wo liegt die Start-/Launch-Route?
- Wie wird Health geprueft?
- Welche Ergebnisarten erzeugt das Tool?
- Welche Rollen duerfen es nutzen?

Neue Tools werden ergaenzt durch:

1. Datenbankeintrag in `tools`.
2. Adapter in `src/server/modules/registry.mjs`.
3. Optionalen UI-Eintrag in `public/src/modules/automations/registry.js`, falls spezielle Darstellung noetig ist.

## Gemeinsame Interfaces und Types

Aktuell liegen die gemeinsamen Vertragswerte in `src/shared/contracts.mjs`.

Wichtige Konzepte:

- `ToolStatus`: `ready`, `in_progress`, `pending_connection`, `error`, `disabled`
- `LogLevel`: `info`, `success`, `warning`, `error`
- `Role`: `admin`, `sales_user`, `marketing_user`, `management_viewer`
- `ModuleCapability`: `launch`, `status`, `results`, `logs`, `health`, `configure`, `generate`
- `ResultType`: `offer`, `report`, `artifact`

Ziel fuer TypeScript:

```ts
type ToolStatus = "ready" | "in_progress" | "pending_connection" | "error" | "disabled";
type Role = "admin" | "sales_user" | "marketing_user" | "management_viewer";

interface AutomationTool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ToolStatus;
  owner: string;
  route: string;
  externalUrl?: string | null;
  lastRunAt?: string | null;
  metrics: ToolMetrics;
  integration: ToolIntegration;
}

interface AutomationModuleAdapter {
  id: string;
  capabilities: ModuleCapability[];
  requiredRoles: Role[];
  resultTypes: ResultType[];
  getLaunchTarget(tool: AutomationTool): LaunchTarget;
  getHealth?(tool: AutomationTool): Promise<ModuleHealth>;
}
```

## API-Struktur

MVP-Endpunkte:

- `GET /api/health`
- `GET /api/modules`
- `GET /api/tools`
- `GET /api/tools/:id`
- `PATCH /api/tools/:id/status`
- `GET /api/logs?toolId=&limit=`
- `POST /api/logs`
- `GET /api/automations`
- `GET /api/offers`
- `GET /api/reports`
- `GET /api/users`

Zielstruktur fuer spaetere Erweiterung:

- `GET /api/modules`: Registry inklusive Capabilities
- `POST /api/modules/:id/run`: Tool-Run starten
- `GET /api/modules/:id/runs`: Run-Historie
- `GET /api/modules/:id/health`: Adapter-/Service-Health
- `GET /api/results?type=&toolId=`
- `GET /api/logs?level=&toolId=&from=&to=`
- `GET /api/admin/tools`
- `PATCH /api/admin/tools/:id`

## Datenbankstruktur

MVP-JSON-Struktur:

- `tools`
- `reports`
- `offers`
- `users`
- `logs`
- `automations`

Ziel-DB, z. B. Postgres:

```text
users
  id, name, email, role, team, active, created_at, updated_at

tools
  id, name, description, category, status, owner, route, external_url,
  integration_type, integration_state, config_json, created_at, updated_at

tool_metrics
  id, tool_id, runs_today, success_rate, stored_results, measured_at

automations
  id, tool_id, name, schedule, enabled, last_run_at, next_run_at

automation_runs
  id, tool_id, automation_id, status, started_at, finished_at,
  actor_user_id, input_json, output_json, error_code, error_message

offers
  id, tool_id, client_name, status, amount, currency, file_url,
  created_by_user_id, created_at

reports
  id, tool_id, client_name, campaign_name, status, file_url,
  created_by_user_id, created_at

logs
  id, tool_id, run_id, level, message, actor, metadata_json, created_at
```

## Logging-Mechanismus

MVP:

- Logs werden in `data/db.json` gespeichert.
- `auditLogger` erzeugt einheitliche Log-Eintraege.
- API-Fehler werden nicht als technische Stacktraces ans UI gesendet.

Ziel:

- Strukturierte Logs mit `level`, `toolId`, `runId`, `actor`, `message`, `metadata`.
- Audit Logs fuer User-Aktionen.
- Operational Logs fuer System- und Adapterfehler.
- Optional: externe Log-Senke, z. B. Datadog, OpenTelemetry oder Cloud Logging.

## Error Handling

Alle API-Fehler folgen diesem Format:

```json
{
  "error": {
    "code": "tool_not_found",
    "message": "Das angeforderte Tool wurde nicht gefunden.",
    "details": {}
  }
}
```

Prinzipien:

- Business-Fehler: kontrollierte `ApiError` mit HTTP-Status und Code.
- Unerwartete Fehler: generische 500-Antwort, Details nur intern loggen.
- UI zeigt verstaendliche Meldungen und bleibt bedienbar.
- Adapterfehler duerfen ein Tool nicht das gesamte Dashboard brechen lassen.

## Authentifizierung und Rollen

MVP fachlich vorbereitet, technisch noch nicht erzwungen.

Zielstrategie:

- Interne SSO-Anbindung, z. B. Google Workspace, Azure AD oder OIDC.
- Session/JWT mit Rollenclaims.
- Rollen:
  - `admin`: Tools konfigurieren, Status aendern, Logs voll sehen.
  - `sales_user`: Angebotsgenerator nutzen, Angebote sehen.
  - `marketing_user`: Reporting Center nutzen, Reports sehen.
  - `management_viewer`: Dashboard und Ergebnisse lesen, keine Ausfuehrung.
- Autorisierung serverseitig pruefen, UI blendet nur zusaetzlich aus.

## Einbindung Angebotsgenerator

Kurzfristig:

- Als `offer-generator` in Tool Registry.
- Status `ready`.
- UI-Route `#/tools/offer-generator`.
- Ergebnisse ueber `offers`.
- Externe URL bleibt `null`, bis der konkrete Servicepfad bekannt ist.

Adapter-Ziel:

- `OfferGeneratorAdapter`
- Capabilities: `launch`, `generate`, `results`, `logs`
- Rollen: `admin`, `sales_user`
- Ergebnisart: `offer`

## Einbindung Reporting Tool

Kurzfristig:

- Als `reporting-tool` in Tool Registry.
- Externe URL `http://localhost:8000/app`.
- Bekannte FastAPI-Endpunkte:
  - `GET /api/health`
  - `POST /api/preview`
  - `POST /api/generate`

Adapter-Ziel:

- `ReportingToolAdapter`
- Capabilities: `launch`, `health`, `generate`, `results`, `logs`
- Rollen: `admin`, `marketing_user`
- Ergebnisart: `report`
- Health Check ruft spaeter den externen FastAPI-Service ab und setzt Toolstatus nicht direkt, sondern schreibt einen Run-/Health-Datensatz.
