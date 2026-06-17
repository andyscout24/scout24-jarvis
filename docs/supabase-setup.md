# Supabase Setup

## Ziel

Das Dashboard kann jetzt mit zwei Persistenzmodi laufen:

- `DATA_REPOSITORY=json`: lokales MVP mit `data/db.json`
- `DATA_REPOSITORY=supabase`: Supabase/PostgREST als aktive Datenquelle
- `DATA_REPOSITORY=auto`: Supabase, wenn `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` vorhanden sind, sonst JSON

## Supabase Projekt vorbereiten

1. Supabase Projekt anlegen.
2. SQL Editor oeffnen.
3. `database/schema.sql` ausfuehren.
4. `database/seed.sql` ausfuehren.

Die Seed-User haben `external_auth_id` Werte:

| Rolle | external_auth_id |
| --- | --- |
| Admin | `user-001` |
| Sales User | `user-002` |
| Marketing User | `user-003` |
| Management Viewer | `user-004` |

Damit funktioniert das bestehende MVP-Header-Modell weiter, auch wenn Supabase intern UUIDs verwendet.

## Lokale Env

```bash
cp .env.example .env
```

Dann in `.env` setzen:

```bash
AUTH_MODE=hybrid
DATA_REPOSITORY=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_SCHEMA=public
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`SUPABASE_ANON_KEY` ist optional. Fuer den Browser-Login nutzt das Dashboard den Publishable Key aus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Starten

```bash
node --env-file=.env server.mjs
```

Healthcheck:

```bash
curl http://localhost:4173/api/health
```

Erwartung:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "checks": {
      "storage": {
        "status": "ok",
        "mode": "supabase"
      }
    }
  }
}
```

## Sicherheit

- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig setzen.
- Den Service Role Key nie im Frontend verwenden.
- `.env` bleibt durch `.gitignore` uncommitted.
- Healthcheck und API geben nur Konfigurationsstatus aus, keine Secret-Werte.

## Auth aktivieren

Die App unterstuetzt jetzt drei Auth-Modi:

- `mock_header`: nur lokaler MVP-Fallback
- `hybrid`: Supabase Token plus `X-User-Id` Fallback
- `supabase`: nur echter Supabase Login

Fuer den naechsten produktionsnahen Schritt:

1. Supabase Auth User anlegen.
2. `users.external_auth_id` auf die jeweilige Supabase Auth User ID setzen.
3. Optional `AUTH_MODE=supabase` setzen, sobald keine Header-Fallbacks mehr erlaubt sein sollen.
4. Den Login im Dashboard ueber `#/auth` testen.
