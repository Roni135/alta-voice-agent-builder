import { NextResponse } from 'next/server';
import { runBuilder } from '@/modules/builder';
import { getAgent, createAgent, updateAgent } from '@/modules/agents/repository';
import { syncAgentToVoiceRuntime } from '@/modules/agents/sync';
import { logMessage } from '@/modules/builder/messagesRepository';

// One turn of the Builder conversation: reason about the message, then
// create/update the persona and sync it to the voice runtime in the same
// request — there is no separate user-facing "publish" step.
export async function POST(request) {
  const { agentId, message, history = [] } = await request.json();

  try {
    const existingAgent = agentId ? await getAgent(agentId) : null;
    const fullHistory = [...history, { role: 'user', content: message }];

    const result = await runBuilder({ history: fullHistory, existingAgent });

    let agent = existingAgent;
    if (result.action === 'create') {
      agent = await createAgent(result.agent);
      agent = await syncAgentToVoiceRuntime(agent);
    } else if (result.action === 'update' && existingAgent) {
      agent = await updateAgent(existingAgent.id, result.agent);
      agent = await syncAgentToVoiceRuntime(agent);
    }

    await logMessage(agent?.id, 'user', message);
    await logMessage(agent?.id, 'assistant', result.message);

    return NextResponse.json({ action: result.action, message: result.message, agent });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
