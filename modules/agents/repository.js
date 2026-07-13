import { randomUUID } from 'node:crypto';
import { sql, ensureSchema } from '@/lib/db';
import { rowToAgent } from './personaSchema';

function toParams(persona) {
  return {
    name: persona.name,
    role: persona.role,
    voice: persona.voice,
    language: persona.language,
    companyName: persona.companyName,
    industry: persona.industry ?? null,
    businessDescription: persona.businessDescription,
    mission: persona.mission,
    targetLead: persona.targetLead,
    tone: persona.tone,
    openingMessage: persona.openingMessage,
    qualificationQuestions: JSON.stringify(persona.qualificationQuestions ?? []),
    qualificationCriteria: persona.qualificationCriteria,
    meetingEnabled: !!persona.meetingEnabled,
    meetingDurationMinutes: persona.meetingDurationMinutes ?? 30,
  };
}

export async function createAgent(persona) {
  await ensureSchema();
  const id = randomUUID();
  const p = toParams(persona);
  await sql`
    INSERT INTO agents (
      id, name, role, voice, language, company_name, industry, business_description,
      mission, target_lead, tone, opening_message, qualification_questions,
      qualification_criteria, meeting_enabled, meeting_duration_minutes
    ) VALUES (
      ${id}, ${p.name}, ${p.role}, ${p.voice}, ${p.language}, ${p.companyName}, ${p.industry},
      ${p.businessDescription}, ${p.mission}, ${p.targetLead}, ${p.tone}, ${p.openingMessage},
      ${p.qualificationQuestions}::jsonb, ${p.qualificationCriteria}, ${p.meetingEnabled},
      ${p.meetingDurationMinutes}
    )
  `;
  return getAgent(id);
}

export async function updateAgent(id, persona) {
  await ensureSchema();
  const p = toParams(persona);
  await sql`
    UPDATE agents SET
      name = ${p.name}, role = ${p.role}, voice = ${p.voice}, language = ${p.language},
      company_name = ${p.companyName}, industry = ${p.industry},
      business_description = ${p.businessDescription}, mission = ${p.mission},
      target_lead = ${p.targetLead}, tone = ${p.tone}, opening_message = ${p.openingMessage},
      qualification_questions = ${p.qualificationQuestions}::jsonb,
      qualification_criteria = ${p.qualificationCriteria}, meeting_enabled = ${p.meetingEnabled},
      meeting_duration_minutes = ${p.meetingDurationMinutes}, updated_at = now()
    WHERE id = ${id}
  `;
  return getAgent(id);
}

export async function setSyncResult(id, { vapiAssistantId, syncStatus, syncError }) {
  await ensureSchema();
  await sql`
    UPDATE agents SET vapi_assistant_id = ${vapiAssistantId ?? null}, sync_status = ${syncStatus},
    sync_error = ${syncError ?? null}, updated_at = now() WHERE id = ${id}
  `;
  return getAgent(id);
}

export async function getAgent(id) {
  await ensureSchema();
  const rows = await sql`SELECT * FROM agents WHERE id = ${id}`;
  return rowToAgent(rows[0]);
}

// Lightweight list for the sidebar — not the full persona, just enough to
// label each entry and let the user pick one to open.
export async function listAgents() {
  await ensureSchema();
  const rows = await sql`
    SELECT id, name, role, company_name, sync_status
    FROM agents ORDER BY updated_at DESC
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    companyName: row.company_name,
    syncStatus: row.sync_status,
  }));
}
