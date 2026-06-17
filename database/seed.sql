-- Seed data for the Social Jarvis Dashboard MVP.

insert into users (id, external_auth_id, name, email, role, team, active)
values
  ('00000000-0000-4000-8000-000000000001', 'user-001', 'Mira Keller', 'mira.keller@example.internal', 'admin', 'Campaign Success', true),
  ('00000000-0000-4000-8000-000000000002', 'user-002', 'Jonas Weber', 'jonas.weber@example.internal', 'sales_user', 'Sales Operations', true),
  ('00000000-0000-4000-8000-000000000003', 'user-003', 'Lena Brandt', 'lena.brandt@example.internal', 'marketing_user', 'Revenue Operations', true),
  ('00000000-0000-4000-8000-000000000004', 'user-004', 'Clara Stein', 'clara.stein@example.internal', 'management_viewer', 'Management', true)
on conflict (id) do update set
  external_auth_id = excluded.external_auth_id,
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  team = excluded.team,
  active = excluded.active,
  updated_at = now();

insert into clients (id, name, external_ref, industry, owner_user_id)
values
  ('10000000-0000-4000-8000-000000000001', 'Musterkunde GmbH', 'crm-musterkunde', 'Real Estate', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', 'ImmoNord GmbH', 'crm-immonord', 'Real Estate', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003', 'Urban Living AG', 'crm-urban-living', 'Real Estate', '00000000-0000-4000-8000-000000000003'),
  ('10000000-0000-4000-8000-000000000004', 'City Estate Group', 'crm-city-estate', 'Real Estate', '00000000-0000-4000-8000-000000000002')
on conflict (id) do update set
  name = excluded.name,
  external_ref = excluded.external_ref,
  industry = excluded.industry,
  owner_user_id = excluded.owner_user_id,
  updated_at = now();

insert into tools (
  id,
  name,
  description,
  category,
  status,
  is_active,
  owner_team,
  route,
  external_url,
  integration_type,
  integration_state,
  config,
  last_run_at
)
values
  (
    'offer-generator',
    'Angebotsgenerator',
    'Erstellt Media-Angebote und Kampagnenpakete automatisch.',
    'Sales',
    'ready',
    true,
    'Sales Operations',
    '#/tools/offer-generator',
    null,
    'external_module',
    'ready',
    '{"result_type":"offer","launch_route":"#/offers","required_roles":["admin","sales_user"],"adapter":"dashboard-offer-generator-wrapper"}'::jsonb,
    '2026-06-08T07:58:00Z'
  ),
  (
    'reporting-tool',
    'Reporting Tool',
    'Erzeugt Kampagnenreviews aus Media-Reports inklusive KPI-Preview und PowerPoint-Export.',
    'Marketing / Reporting',
    'in_progress',
    true,
    'Campaign Success',
    '#/tools/reporting-tool',
    'http://localhost:8000/app',
    'fastapi_service',
    'external_reference_detected',
    '{"result_type":"report","launch_route":"#/reporting","adapter":"dashboard-reporting-tool-wrapper","health_endpoint":"/api/health","preview_endpoint":"/api/preview","generate_endpoint":"/api/generate","source_reference":"campaign_review_tool","data_sources":["csv_upload","google_ad_manager","google_ads","newsletter","fastapi_campaign_review","swat_io","meta_api","google_sheets"]}'::jsonb,
    '2026-06-08T08:12:00Z'
  ),
  (
    'lead-list-generator',
    'Leadlisten Generator',
    'Erstellt kuratierte Leadlisten fuer Sales-Kampagnen und Akquise-Flows.',
    'Sales',
    'disabled',
    true,
    'Revenue Operations',
    '#/tools/lead-list-generator',
    null,
    'placeholder',
    'planned',
    '{"result_type":"artifact","launch_route":"#/tools/lead-list-generator","required_roles":["admin","sales_user"]}'::jsonb,
    null
  ),
  (
    'content-ideas-generator',
    'Content Ideen Generator',
    'Generiert Content-Ideen fuer Social Posts, Kampagnen und Redaktionsplaene.',
    'Marketing',
    'disabled',
    true,
    'Marketing Operations',
    '#/tools/content-ideas-generator',
    null,
    'placeholder',
    'planned',
    '{"result_type":"artifact","launch_route":"#/tools/content-ideas-generator","required_roles":["admin","marketing_user"]}'::jsonb,
    null
  ),
  (
    'campaign-analyzer',
    'Campaign Analyzer',
    'Analysiert Kampagnen-Performance und bereitet Optimierungspotenziale auf.',
    'Marketing / Reporting',
    'pending_connection',
    true,
    'Campaign Success',
    '#/tools/campaign-analyzer',
    null,
    'placeholder',
    'pending_connection',
    '{"result_type":"report","launch_route":"#/tools/campaign-analyzer","required_roles":["admin","marketing_user","management_viewer"]}'::jsonb,
    null
  ),
  (
    'powerpoint-generator',
    'PowerPoint Generator',
    'Erstellt spaeter Praesentationen aus Reports, Angeboten und Briefings.',
    'Marketing',
    'disabled',
    true,
    'Campaign Success',
    '#/tools/powerpoint-generator',
    null,
    'placeholder',
    'planned',
    '{"result_type":"artifact","launch_route":"#/tools/powerpoint-generator","required_roles":["admin","marketing_user","sales_user"]}'::jsonb,
    null
  ),
  (
    'api-health-monitor',
    'API Health Monitor',
    'Ueberwacht spaeter angebundene APIs, Health Checks und fehlgeschlagene Verbindungen.',
    'Admin',
    'error',
    true,
    'Platform',
    '#/tools/api-health-monitor',
    null,
    'placeholder',
    'needs_adapter',
    '{"result_type":"artifact","launch_route":"#/tools/api-health-monitor","required_roles":["admin"]}'::jsonb,
    '2026-06-08T08:35:00Z'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  status = excluded.status,
  is_active = excluded.is_active,
  owner_team = excluded.owner_team,
  route = excluded.route,
  external_url = excluded.external_url,
  integration_type = excluded.integration_type,
  integration_state = excluded.integration_state,
  config = excluded.config,
  last_run_at = excluded.last_run_at,
  updated_at = now();

insert into automations (id, tool_id, name, description, schedule, enabled, created_by_user_id, last_run_at, next_run_at)
values
  ('automation-offers-daily-index', 'offer-generator', 'Angebotsindex aktualisieren', 'Aktualisiert den Ergebnisindex fuer Angebote.', 'werktags 08:00', true, '00000000-0000-4000-8000-000000000002', '2026-06-08T06:00:00Z', '2026-06-09T06:00:00Z'),
  ('automation-report-cleanup', 'reporting-tool', 'Reporting-Artefakte pruefen', 'Prueft erzeugte Report-Artefakte und Dateiablage.', 'taeglich 18:30', true, '00000000-0000-4000-8000-000000000001', '2026-06-07T16:30:00Z', '2026-06-08T16:30:00Z'),
  ('automation-lead-list-generator', 'lead-list-generator', 'Leadlisten vorbereiten', 'Platzhalter fuer spaetere Leadlisten-Jobs.', 'manuell', false, '00000000-0000-4000-8000-000000000002', null, null)
on conflict (id) do update set
  tool_id = excluded.tool_id,
  name = excluded.name,
  description = excluded.description,
  schedule = excluded.schedule,
  enabled = excluded.enabled,
  created_by_user_id = excluded.created_by_user_id,
  last_run_at = excluded.last_run_at,
  next_run_at = excluded.next_run_at,
  updated_at = now();

insert into automation_runs (
  id,
  automation_id,
  tool_id,
  client_id,
  status,
  trigger_source,
  actor_user_id,
  input,
  output,
  started_at,
  finished_at
)
values
  ('20000000-0000-4000-8000-000000000001', 'automation-offers-daily-index', 'offer-generator', '10000000-0000-4000-8000-000000000002', 'succeeded', 'manual', '00000000-0000-4000-8000-000000000003', '{"client":"ImmoNord GmbH"}'::jsonb, '{"offer_id":"30000000-0000-4000-8000-000000000001"}'::jsonb, '2026-06-08T07:57:00Z', '2026-06-08T07:58:00Z'),
  ('20000000-0000-4000-8000-000000000002', 'automation-report-cleanup', 'reporting-tool', '10000000-0000-4000-8000-000000000001', 'succeeded', 'manual', '00000000-0000-4000-8000-000000000001', '{"campaign":"Q2 Immobilienkampagne"}'::jsonb, '{"report_id":"40000000-0000-4000-8000-000000000001"}'::jsonb, '2026-06-08T08:10:00Z', '2026-06-08T08:12:00Z')
on conflict (id) do nothing;

insert into offers (
  id,
  tool_id,
  client_id,
  automation_run_id,
  offer_number,
  status,
  amount,
  currency,
  file_name,
  created_by_user_id,
  created_at
)
values
  ('30000000-0000-4000-8000-000000000001', 'offer-generator', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'OFF-2026-0004', 'sent', 12400.00, 'EUR', 'immonord_angebot_2026_0004.pdf', '00000000-0000-4000-8000-000000000003', '2026-06-08T07:58:00Z'),
  ('30000000-0000-4000-8000-000000000002', 'offer-generator', '10000000-0000-4000-8000-000000000004', null, 'OFF-2026-0003', 'draft', 8600.00, 'EUR', 'city_estate_angebot_2026_0003.pdf', '00000000-0000-4000-8000-000000000002', '2026-06-08T06:44:00Z')
on conflict (id) do update set
  status = excluded.status,
  amount = excluded.amount,
  currency = excluded.currency,
  file_name = excluded.file_name,
  updated_at = now();

insert into reports (
  id,
  tool_id,
  client_id,
  automation_run_id,
  campaign_name,
  report_type,
  reporting_period,
  channel,
  data_source,
  data_source_label,
  status,
  file_name,
  file_url,
  error_message,
  created_by_user_id,
  metadata,
  created_at
)
values
  ('40000000-0000-4000-8000-000000000001', 'reporting-tool', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Q2 Immobilienkampagne', 'campaign_review', 'Q2 2026', 'Google Ad Manager', 'google_ad_manager', 'Google Ad Manager', 'completed', 'musterkunde_q2_review.pptx', null, null, '00000000-0000-4000-8000-000000000001', '{"report_type":"campaign_review","data_source":"google_ad_manager","data_source_state":"ready","output_file":"musterkunde_q2_review.pptx","error":null}'::jsonb, '2026-06-08T08:12:00Z'),
  ('40000000-0000-4000-8000-000000000002', 'reporting-tool', '10000000-0000-4000-8000-000000000003', null, 'Lead Boost Mai', 'campaign_review', 'Mai 2026', 'Google Ads', 'google_ads', 'Google Ads', 'completed', 'urban_living_lead_boost_review.pptx', null, null, '00000000-0000-4000-8000-000000000002', '{"report_type":"campaign_review","data_source":"google_ads","data_source_state":"ready","output_file":"urban_living_lead_boost_review.pptx","error":null}'::jsonb, '2026-06-07T15:26:00Z')
on conflict (id) do update set
  campaign_name = excluded.campaign_name,
  report_type = excluded.report_type,
  reporting_period = excluded.reporting_period,
  channel = excluded.channel,
  data_source = excluded.data_source,
  data_source_label = excluded.data_source_label,
  status = excluded.status,
  file_name = excluded.file_name,
  file_url = excluded.file_url,
  error_message = excluded.error_message,
  metadata = excluded.metadata,
  updated_at = now();

insert into api_connections (id, tool_id, name, base_url, health_endpoint, auth_type, status, last_checked_at, config)
values
  ('50000000-0000-4000-8000-000000000001', 'reporting-tool', 'Campaign Review FastAPI', 'http://localhost:8000', '/api/health', 'none', 'unknown', null, '{"sourceId":"fastapi_campaign_review","state":"external_reference_detected","sourceReference":"campaign_review_tool","preview_endpoint":"/api/preview","generate_endpoint":"/api/generate"}'::jsonb),
  ('50000000-0000-4000-8000-000000000003', 'reporting-tool', 'CSV / Excel Upload', null, null, 'none', 'healthy', '2026-06-08T08:12:00Z', '{"sourceId":"csv_upload","state":"ready","formats":["csv","tsv","xls","xlsx"]}'::jsonb),
  ('50000000-0000-4000-8000-000000000004', 'reporting-tool', 'Swat.io', null, null, 'oauth2', 'unknown', null, '{"sourceId":"swat_io","state":"pending_connection"}'::jsonb),
  ('50000000-0000-4000-8000-000000000005', 'reporting-tool', 'Meta API', null, null, 'oauth2', 'unknown', null, '{"sourceId":"meta_api","state":"pending_connection"}'::jsonb),
  ('50000000-0000-4000-8000-000000000006', 'reporting-tool', 'Google Sheets', null, null, 'oauth2', 'unknown', null, '{"sourceId":"google_sheets","state":"pending_connection"}'::jsonb),
  ('50000000-0000-4000-8000-000000000002', 'offer-generator', 'Offer Generator Adapter', null, null, 'none', 'healthy', '2026-06-08T07:58:00Z', '{}'::jsonb)
on conflict (id) do update set
  tool_id = excluded.tool_id,
  name = excluded.name,
  base_url = excluded.base_url,
  health_endpoint = excluded.health_endpoint,
  auth_type = excluded.auth_type,
  status = excluded.status,
  last_checked_at = excluded.last_checked_at,
  config = excluded.config,
  updated_at = now();

insert into activity_logs (id, tool_id, automation_run_id, user_id, timestamp, actor_label, action, status, level, message, metadata, created_at)
values
  ('60000000-0000-4000-8000-000000000001', 'reporting-tool', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '2026-06-08T08:12:00Z', 'Mira Keller', 'report.created', 'success', 'success', 'Reporting-Ergebnis fuer Musterkunde GmbH gespeichert.', '{"file_name":"musterkunde_q2_review.pptx"}'::jsonb, '2026-06-08T08:12:00Z'),
  ('60000000-0000-4000-8000-000000000002', 'offer-generator', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', '2026-06-08T07:58:00Z', 'Lena Brandt', 'offer.created', 'success', 'success', 'Angebot fuer ImmoNord GmbH erstellt und abgelegt.', '{"offer_number":"OFF-2026-0004"}'::jsonb, '2026-06-08T07:58:00Z'),
  ('60000000-0000-4000-8000-000000000003', 'reporting-tool', null, null, '2026-06-08T07:15:00Z', 'System', 'api.connection_registered', 'info', 'info', 'Externer FastAPI-Service als Integrationsreferenz registriert.', '{"source":"campaign_review_tool"}'::jsonb, '2026-06-08T07:15:00Z'),
  ('60000000-0000-4000-8000-000000000004', 'offer-generator', null, null, '2026-06-08T06:44:00Z', 'System', 'tool.status_changed', 'warning', 'warning', 'Angebotsgenerator wartet auf finale Service-Anbindung.', '{}'::jsonb, '2026-06-08T06:44:00Z')
on conflict (id) do nothing;

insert into settings (setting_key, scope, tool_id, user_id, value, is_secret, updated_by_user_id)
values
  ('dashboard.default_timezone', 'global', null, null, '"Europe/Berlin"'::jsonb, false, '00000000-0000-4000-8000-000000000001'),
  ('dashboard.retention_days', 'global', null, null, '180'::jsonb, false, '00000000-0000-4000-8000-000000000001'),
  ('reporting-tool.max_upload_mb', 'tool', 'reporting-tool', null, '50'::jsonb, false, '00000000-0000-4000-8000-000000000001')
on conflict (setting_key) do update set
  scope = excluded.scope,
  tool_id = excluded.tool_id,
  user_id = excluded.user_id,
  value = excluded.value,
  is_secret = excluded.is_secret,
  updated_by_user_id = excluded.updated_by_user_id,
  updated_at = now();
