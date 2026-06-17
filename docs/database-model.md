# Database Model

## MVP-Empfehlung

Aktuell verwendet das Projekt `data/db.json`. Fuer das MVP ist das pragmatisch und lauffaehig. Sobald mehrere Mitarbeiter produktiv arbeiten, sollte die Persistenz auf Supabase oder PostgreSQL migriert werden. Supabase ist sinnvoll, weil Auth, Rollen, Storage fuer PDFs/PPTX und Postgres in einem Setup liegen.

Schema-Dateien:

- `database/schema.sql`
- `database/seed.sql`

## 1. users

Zweck: Mitarbeiter, Rollen und spaetere Auth-Zuordnung.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | uuid | ja | `00000000-0000-4000-8000-000000000001` |
| external_auth_id | text | nein | `azure-ad-123` |
| name | text | ja | `Mira Keller` |
| email | text | ja | `mira.keller@example.internal` |
| role | text | ja | `admin` |
| team | text | nein | `Campaign Success` |
| active | boolean | ja | `true` |
| created_at | timestamptz | ja | `2026-06-08T08:00:00Z` |
| updated_at | timestamptz | ja | `2026-06-08T08:00:00Z` |

Beziehungen: `clients.owner_user_id`, `automations.created_by_user_id`, `automation_runs.actor_user_id`, `reports.created_by_user_id`, `offers.created_by_user_id`, `activity_logs.user_id`, `settings.updated_by_user_id`.

Indizes: `email unique`, `external_auth_id unique`, `(role, active)`.

## 2. tools

Zweck: Tool Registry fuer Angebotsgenerator, Reporting Tool und kommende Module.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | text | ja | `reporting-tool` |
| name | text | ja | `Reporting Tool` |
| description | text | ja | `Erzeugt Kampagnenreviews...` |
| category | text | ja | `Marketing / Reporting` |
| status | text | ja | `in_progress`, `pending_connection` |
| is_active | boolean | ja | `true` |
| owner_team | text | nein | `Campaign Success` |
| route | text | nein | `#/tools/reporting-tool` |
| external_url | text | nein | `http://localhost:8000/app` |
| integration_type | text | ja | `fastapi_service` |
| integration_state | text | ja | `external_reference_detected` |
| config | jsonb | ja | `{"launch_route":"#/reporting","health_endpoint":"/api/health"}` |
| metadata | jsonb | ja | `{}` |
| last_run_at | timestamptz | nein | `2026-06-08T08:12:00Z` |
| created_at | timestamptz | ja | `now()` |
| updated_at | timestamptz | ja | `now()` |

Beziehungen: Parent fuer `automations`, `automation_runs`, `reports`, `offers`, `activity_logs`, `api_connections`, tool-scoped `settings`.

Indizes: primary key `id`, `(status, is_active)`, `integration_type`.

## 3. automations

Zweck: Konfigurierte Jobs pro Tool.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | text | ja | `automation-report-cleanup` |
| tool_id | text | ja | `reporting-tool` |
| name | text | ja | `Reporting-Artefakte pruefen` |
| description | text | nein | `Prueft erzeugte Artefakte` |
| schedule | text | ja | `taeglich 18:30` |
| enabled | boolean | ja | `true` |
| created_by_user_id | uuid | nein | `000...001` |
| config | jsonb | ja | `{}` |
| last_run_at | timestamptz | nein | `2026-06-07T16:30:00Z` |
| next_run_at | timestamptz | nein | `2026-06-08T16:30:00Z` |
| created_at | timestamptz | ja | `now()` |
| updated_at | timestamptz | ja | `now()` |

Beziehungen: `tool_id -> tools.id`, `created_by_user_id -> users.id`, Parent fuer `automation_runs`.

Indizes: `(tool_id, enabled)`.

## 4. automation_runs

Zweck: Historie jeder Ausfuehrung inklusive Fehlerdetails.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | uuid | ja | `20000000-0000-4000-8000-000000000002` |
| automation_id | text | nein | `automation-report-cleanup` |
| tool_id | text | ja | `reporting-tool` |
| client_id | uuid | nein | `100...001` |
| status | text | ja | `succeeded` |
| trigger_source | text | ja | `manual` |
| actor_user_id | uuid | nein | `000...001` |
| input | jsonb | ja | `{"campaign":"Q2 Immobilienkampagne"}` |
| output | jsonb | ja | `{"report_id":"400...001"}` |
| error_code | text | nein | `service_unavailable` |
| error_message | text | nein | `FastAPI health check failed` |
| started_at | timestamptz | ja | `2026-06-08T08:10:00Z` |
| finished_at | timestamptz | nein | `2026-06-08T08:12:00Z` |
| created_at | timestamptz | ja | `now()` |

Beziehungen: `automation_id`, `tool_id`, `client_id`, `actor_user_id`; optional referenziert durch `reports`, `offers`, `activity_logs`.

Indizes: `(tool_id, started_at desc)`, `(status, started_at desc)`.

## 5. reports

Zweck: Erzeugte Kampagnenreviews und Report-Artefakte.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | uuid | ja | `40000000-0000-4000-8000-000000000001` |
| tool_id | text | ja | `reporting-tool` |
| client_id | uuid | nein | `100...001` |
| automation_run_id | uuid | nein | `200...002` |
| campaign_name | text | ja | `Q2 Immobilienkampagne` |
| report_type | text | ja | `campaign_review` |
| reporting_period | text | nein | `Q2 2026` |
| channel | text | nein | `Google Ads` |
| data_source | text | nein | `google_ad_manager` |
| data_source_label | text | nein | `Google Ad Manager` |
| status | text | ja | `completed` |
| file_name | text | nein | `musterkunde_q2_review.pptx` |
| file_url | text | nein | `https://...` |
| error_message | text | nein | `Meta API pending connection` |
| created_by_user_id | uuid | nein | `000...001` |
| metadata | jsonb | ja | `{}` |
| created_at | timestamptz | ja | `2026-06-08T08:12:00Z` |
| updated_at | timestamptz | ja | `now()` |

Beziehungen: `tool_id`, `client_id`, `automation_run_id`, `created_by_user_id`.

Indizes: `(tool_id, created_at desc)`, `(client_id, created_at desc)`, `status`, `(data_source, created_at desc)`.

## 6. offers

Zweck: Erzeugte Angebote und Angebots-Artefakte.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | uuid | ja | `30000000-0000-4000-8000-000000000001` |
| tool_id | text | ja | `offer-generator` |
| client_id | uuid | nein | `100...002` |
| automation_run_id | uuid | nein | `200...001` |
| offer_number | text | nein | `OFF-2026-0004` |
| status | text | ja | `sent` |
| amount | numeric(12,2) | nein | `12400.00` |
| currency | char(3) | ja | `EUR` |
| file_name | text | nein | `immonord_angebot_2026_0004.pdf` |
| file_url | text | nein | `https://...` |
| created_by_user_id | uuid | nein | `000...003` |
| metadata | jsonb | ja | `{}` |
| created_at | timestamptz | ja | `2026-06-08T07:58:00Z` |
| updated_at | timestamptz | ja | `now()` |

Beziehungen: `tool_id`, `client_id`, `automation_run_id`, `created_by_user_id`.

Indizes: `offer_number unique`, `(tool_id, created_at desc)`, `(client_id, created_at desc)`, `status`.

## 7. clients

Zweck: Kundenstamm fuer Angebote und Reports.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | uuid | ja | `10000000-0000-4000-8000-000000000001` |
| name | text | ja | `Musterkunde GmbH` |
| external_ref | text | nein | `crm-musterkunde` |
| industry | text | nein | `Real Estate` |
| owner_user_id | uuid | nein | `000...001` |
| created_at | timestamptz | ja | `now()` |
| updated_at | timestamptz | ja | `now()` |

Beziehungen: Parent fuer `offers`, `reports`, `automation_runs`; optional Owner in `users`.

Indizes: `external_ref unique`, `owner_user_id`.

## 8. activity_logs

Zweck: Audit- und Betriebslog fuer UI und Fehleranalyse.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | uuid | ja | `60000000-0000-4000-8000-000000000001` |
| tool_id | text | nein | `reporting-tool` |
| automation_run_id | uuid | nein | `200...002` |
| user_id | uuid | nein | `000...001` |
| timestamp | timestamptz | ja | `2026-06-08T08:12:00Z` |
| actor_label | text | ja | `Mira Keller` |
| action | text | ja | `report.created` |
| status | text | ja | `success` |
| level | text | ja | `success` |
| message | text | ja | `Reporting-Ergebnis gespeichert.` |
| metadata | jsonb | ja | `{"file_name":"..."}` |
| created_at | timestamptz | ja | `2026-06-08T08:12:00Z` |

Beziehungen: Optional zu `tools`, `automation_runs`, `users`.

Indizes: `(tool_id, created_at desc)`, `(level, created_at desc)`, `(status, created_at desc)`.

## 9. api_connections

Zweck: Externe Services und Health-Zustand, z. B. Reporting-FastAPI.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| id | uuid | ja | `50000000-0000-4000-8000-000000000001` |
| tool_id | text | nein | `reporting-tool` |
| name | text | ja | `Campaign Review FastAPI` |
| base_url | text | nein | `http://localhost:8000` |
| health_endpoint | text | nein | `/api/health` |
| auth_type | text | ja | `none` |
| status | text | ja | `unknown` |
| last_checked_at | timestamptz | nein | `2026-06-08T08:12:00Z` |
| last_error | text | nein | `Connection refused` |
| config | jsonb | ja | `{"preview_endpoint":"/api/preview"}` |
| created_at | timestamptz | ja | `now()` |
| updated_at | timestamptz | ja | `now()` |

Beziehungen: Optional `tool_id -> tools.id`.

Indizes: `(tool_id, status)`.

## 10. settings

Zweck: Globale, tool- oder userbezogene Konfiguration.

| Feld | Typ | Pflicht | Beispiel |
|---|---|---:|---|
| key | text | ja | `dashboard.default_timezone` |
| scope | text | ja | `global` |
| tool_id | text | nein | `reporting-tool` |
| user_id | uuid | nein | `000...001` |
| value | jsonb | ja | `"Europe/Berlin"` |
| is_secret | boolean | ja | `false` |
| updated_by_user_id | uuid | nein | `000...001` |
| updated_at | timestamptz | ja | `now()` |

Beziehungen: Optional zu `tools` oder `users`; Scope-Constraint verhindert gemischte Targets.

Indizes: primary key `key`, `(scope, tool_id, user_id)`.
