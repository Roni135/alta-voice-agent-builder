// The Voice AI Assistant persona: a product schema, not a raw prompt/config.
// This is what the user sees and edits. Model-level details (system prompt,
// temperature, provider) live only in toVapiAssistant.js.

export const VOICE_OPTIONS = [
  'professional-female',
  'professional-male',
  'friendly-female',
  'friendly-male',
];

// Fields the Builder must have an answer for (explicitly or reasonably
// inferred) before it may emit a "create" action. Everything else has a
// sensible default the Builder can fill in on its own.
export const REQUIRED_FIELDS = [
  'companyName',
  'businessDescription',
  'targetLead',
  'qualificationCriteria',
  'meetingEnabled',
];

export const PERSONA_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', description: 'A short human name for the assistant, e.g. "Alex".' },
    role: { type: 'string', description: 'Job title, e.g. "Sales Development Representative".' },
    voice: { type: 'string', enum: VOICE_OPTIONS },
    language: { type: 'string', description: 'BCP-47 language code, e.g. "en".' },
    companyName: { type: 'string' },
    industry: { type: 'string' },
    businessDescription: { type: 'string', description: 'What the company sells / does.' },
    mission: { type: 'string', description: 'What this assistant is trying to accomplish on a call.' },
    targetLead: { type: 'string', description: 'Who it is calling / who it is for.' },
    tone: { type: 'string', description: 'Conversation style, e.g. "casual and upbeat".' },
    openingMessage: { type: 'string', description: 'The first line the assistant says on a call.' },
    qualificationQuestions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Questions the assistant asks to qualify a lead.',
    },
    qualificationCriteria: {
      type: 'string',
      description: 'Plain-language rule for what makes a lead "qualified".',
    },
    meetingEnabled: { type: 'boolean' },
    meetingDurationMinutes: { type: 'integer' },
  },
  required: [
    'name',
    'role',
    'voice',
    'language',
    'companyName',
    'industry',
    'businessDescription',
    'mission',
    'targetLead',
    'tone',
    'openingMessage',
    'qualificationQuestions',
    'qualificationCriteria',
    'meetingEnabled',
    'meetingDurationMinutes',
  ],
};

// Postgres/Neon returns JSONB columns already parsed as JS values, but this
// stays defensive in case a raw string ever comes through.
function parseJsonColumn(value, fallback) {
  if (value == null) return fallback;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

export function rowToAgent(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    voice: row.voice,
    language: row.language,
    companyName: row.company_name,
    industry: row.industry,
    businessDescription: row.business_description,
    mission: row.mission,
    targetLead: row.target_lead,
    tone: row.tone,
    openingMessage: row.opening_message,
    qualificationQuestions: parseJsonColumn(row.qualification_questions, []),
    qualificationCriteria: row.qualification_criteria,
    meetingEnabled: !!row.meeting_enabled,
    meetingDurationMinutes: row.meeting_duration_minutes,
    vapiAssistantId: row.vapi_assistant_id,
    syncStatus: row.sync_status,
    syncError: row.sync_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
