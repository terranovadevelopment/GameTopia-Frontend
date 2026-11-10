# GameTopia M6.192 — PostgreSQL connection diagnostic release

M6.192 preserves M6.191 registered-only accounts, game phases, PostgreSQL autosaves,
and game ownership rules. The backend retries transient PostgreSQL connection failures
up to three times, raises the connection timeout to 20 seconds, and emits actionable
redacted diagnostics. It **never** falls back to temporary JSON storage when DATABASE_URL
is present.

This update cannot correct an invalid Render Internal Database URL, different
regions/workspaces, or an unavailable PostgreSQL instance. Confirm both Render
services are in the same region and workspace before retrying the deployment.

Before deployment, back up existing database and account data. Do not set
GAMETOPIA_IMPORT_JSON=1 on a populated database.

Frontend M6.192 uses a fresh verification script URL to avoid the browser
reusing an old expected-version check. It otherwise retains the M6.191 UI.

This build is locally tested but not tested against the user's live Render database.
