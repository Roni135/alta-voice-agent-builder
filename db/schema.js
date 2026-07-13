// Executed by lib/db.js on first use each cold start (idempotent —
// CREATE TABLE IF NOT EXISTS). Postgres via Neon; columns are snake_case
// (Postgres convention) and mapped to the app's camelCase domain objects
// in each module's row-mapping function.
export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    voice TEXT NOT NULL DEFAULT 'professional-female',
    language TEXT NOT NULL DEFAULT 'en',
    company_name TEXT NOT NULL,
    industry TEXT,
    business_description TEXT,
    mission TEXT NOT NULL,
    target_lead TEXT NOT NULL,
    tone TEXT NOT NULL DEFAULT 'professional and friendly',
    opening_message TEXT NOT NULL,
    qualification_questions JSONB NOT NULL DEFAULT '[]',
    qualification_criteria TEXT NOT NULL,
    meeting_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    meeting_duration_minutes INTEGER NOT NULL DEFAULT 30,
    vapi_assistant_id TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    sync_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS builder_messages (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    channel TEXT NOT NULL DEFAULT 'phone',
    lead_name TEXT NOT NULL,
    lead_phone TEXT,
    status TEXT NOT NULL DEFAULT 'in-progress',
    vapi_call_id TEXT,
    transcript TEXT,
    summary TEXT,
    qualified BOOLEAN,
    qualification_reason TEXT,
    extracted_data JSONB,
    meeting_booked BOOLEAN NOT NULL DEFAULT FALSE,
    meeting_slot TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];
