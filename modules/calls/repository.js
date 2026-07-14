import { randomUUID } from 'node:crypto';
import { sql, ensureSchema } from '@/lib/db';

function parseJsonColumn(value) {
  if (value == null) return null;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function rowToCall(row) {
  if (!row) return null;
  return {
    id: row.id,
    agentId: row.agent_id,
    channel: row.channel,
    leadName: row.lead_name,
    leadPhone: row.lead_phone,
    status: row.status,
    vapiCallId: row.vapi_call_id,
    transcript: row.transcript,
    summary: row.summary,
    qualified: row.qualified === null ? null : !!row.qualified,
    qualificationReason: row.qualification_reason,
    extractedData: parseJsonColumn(row.extracted_data),
    meetingBooked: !!row.meeting_booked,
    meetingSlot: row.meeting_slot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCall({ agentId, leadName, leadPhone = null, vapiCallId, channel = 'phone' }) {
  await ensureSchema();
  const id = randomUUID();
  await sql`
    INSERT INTO calls (id, agent_id, channel, lead_name, lead_phone, vapi_call_id, status)
    VALUES (${id}, ${agentId}, ${channel}, ${leadName}, ${leadPhone}, ${vapiCallId ?? null}, 'in-progress')
  `;
  return getCall(id);
}

export async function getCall(id) {
  await ensureSchema();
  const rows = await sql`SELECT * FROM calls WHERE id = ${id}`;
  return rowToCall(rows[0]);
}

export async function getCallByVapiCallId(vapiCallId) {
  await ensureSchema();
  const rows = await sql`SELECT * FROM calls WHERE vapi_call_id = ${vapiCallId}`;
  return rowToCall(rows[0]);
}

// Every call ever made against an agent, most recent first — the call
// history list. Full rows (not a trimmed summary) so a selected entry can
// be handed straight to the existing Call Result screen.
export async function listCallsForAgent(agentId) {
  await ensureSchema();
  const rows = await sql`SELECT * FROM calls WHERE agent_id = ${agentId} ORDER BY created_at DESC`;
  return rows.map(rowToCall);
}

export async function updateCallResult(id, { status, transcript, summary, qualified, qualificationReason, extractedData }) {
  await ensureSchema();
  await sql`
    UPDATE calls SET status = ${status}, transcript = ${transcript ?? null}, summary = ${summary ?? null},
    qualified = ${qualified === undefined ? null : qualified}, qualification_reason = ${qualificationReason ?? null},
    extracted_data = ${extractedData ? JSON.stringify(extractedData) : null}::jsonb, updated_at = now()
    WHERE id = ${id}
  `;
  return getCall(id);
}

export async function updateCallBooking(id, { meetingBooked, meetingSlot }) {
  await ensureSchema();
  await sql`
    UPDATE calls SET meeting_booked = ${!!meetingBooked}, meeting_slot = ${meetingSlot ?? null}, updated_at = now()
    WHERE id = ${id}
  `;
  return getCall(id);
}
