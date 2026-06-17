# Auth and Role Model

## Current state

The project had seeded users and role names, but no real authentication or API authorization.

## MVP approach

For the local MVP the backend requires an internal user context via `X-User-Id`.
The frontend sends this header from `social-jarvis.current-user-id` in local storage, defaulting to `user-001`.

This is an authorization scaffold, not production authentication. For real internal use, replace the header source with a verified Supabase Auth, Azure AD, or other SSO JWT and keep the permission helpers.

## Roles

- `admin`: full access, settings, logs, API connections, tool status changes.
- `sales_user`: offer generator, own offers, sales tools.
- `marketing_user`: reporting center, reports, marketing tools.
- `management_viewer`: dashboards and reports, read-only.

## Server-side enforcement

Protected API routes call `requireCurrentUser()` and then enforce permissions in services:

- Tool status updates require `manage_tool_status`.
- Settings and API connections require admin permissions.
- Activity log reads require `view_logs`.
- Offer creation requires `create_offers`.
- Report creation requires `create_reports`.
- Tool and automation lists are filtered to tools the current role may access.

## Production recommendation

Use Supabase Auth for the first production-grade version because the data model is already prepared for Supabase/PostgreSQL and can map JWT user IDs into `users.external_auth_id`.
