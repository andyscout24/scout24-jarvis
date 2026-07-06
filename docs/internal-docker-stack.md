# Internal Docker Stack

## Ziel

Dieser Stack ist der pragmatische erste interne Betriebsmodus ohne Sites.

Er bildet eure aktuelle Realitaet sauber ab:

- `Social Jarvis Dashboard` als Node-Service
- `Weekly Editorial Planner` als separater Python-Service
- `social_reporting` als lokales Python-CLI, das on-demand durch das Dashboard gestartet wird

## Erwartete Ordnerstruktur

Die Compose-Datei geht von dieser Struktur auf dem Zielserver aus:

```text
/srv/codex/
  ImmoScout24 Jarvis/
  Reporting/social_reporting/
  Redaktionsplan/
```

Wichtig:

- der Compose-Stack lebt in `ImmoScout24 Jarvis/infra`
- die relativen Mount-Pfade zeigen deshalb auf die beiden Schwesterprojekte

## Dateien

- Compose: [infra/docker-compose.internal.yml](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/infra/docker-compose.internal.yml)
- Dashboard-Image: [Dockerfile.dashboard](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/Dockerfile.dashboard)
- Dashboard-Entrypoint: [docker/dashboard-entrypoint.sh](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/docker/dashboard-entrypoint.sh)
- Demo-Env: [.env.internal.demo.example](/Users/awill/Documents/Codex/ImmoScout24%20Jarvis/.env.internal.demo.example)

## Start

Aus dem Dashboard-Repo:

```bash
cp .env.internal.demo.example .env.internal.demo
docker compose -f infra/docker-compose.internal.yml --env-file .env.internal.demo up --build
```

## Was der Stack macht

### Planner-Service

- startet `weekly_editorial_planner` auf Port `8080`
- seedet den MVP-Datensatz beim Start mit `--seed-mvp`
- liefert Health unter `http://planner:8080/api/health`

### Dashboard-Service

- startet den Node-Server auf Port `4173`
- installiert beim ersten Start automatisch die Python-Abhaengigkeiten fuer `social_reporting`
- nutzt dafuer ein persistentes Docker-Volume unter `/opt/venvs/social_reporting`
- spricht den Planner intern ueber `http://planner:8080` an

## Health / Smoke Test

Nach dem Start:

```bash
curl http://localhost:4173/api/health
curl -H 'X-User-Id: user-001' http://localhost:4173/api/editorial-planner/overview
```

Dann im Browser:

```text
http://localhost:4173
```

## Wichtige Einschraenkung

Dieses Setup ist fuer internen Betrieb und Demo-Hosting gedacht, nicht fuer einen voll gehaerteten externen Produktiv-Release.

Im Demo-Modus gilt:

- `AUTH_MODE=mock_header`
- `DATA_REPOSITORY=json`
- keine echte Benutzeranmeldung

## Naechster Haertungsschritt

Wenn ihr vom internen Demo-Modus in einen abgesicherten internen Release wollt:

1. `AUTH_MODE=supabase`
2. `DATA_REPOSITORY=supabase`
3. `PUBLIC_BASE_URL` auf eure interne Ziel-Domain setzen
4. Dashboard hinter VPN / Reverse Proxy / IP-Allowlist stellen
5. `planner` optional auf eigenen internen Service umziehen
