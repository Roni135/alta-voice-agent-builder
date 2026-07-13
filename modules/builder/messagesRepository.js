import { randomUUID } from 'node:crypto';
import { sql, ensureSchema } from '@/lib/db';

// Chat log is persisted once an agent exists (it's a supplementary record
// of the conversation, not the source of truth — the Agent row is). Before
// an assistant is created, the client holds the conversation transiently.
export async function logMessage(agentId, role, content) {
  if (!agentId) return;
  await ensureSchema();
  await sql`INSERT INTO builder_messages (id, agent_id, role, content) VALUES (${randomUUID()}, ${agentId}, ${role}, ${content})`;
}

export async function getHistory(agentId) {
  if (!agentId) return [];
  await ensureSchema();
  return sql`SELECT role, content FROM builder_messages WHERE agent_id = ${agentId} ORDER BY created_at ASC`;
}
