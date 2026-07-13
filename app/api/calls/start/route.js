import { NextResponse } from 'next/server';
import { getAgent } from '@/modules/agents/repository';
import { startCall } from '@/lib/voiceRuntime';
import { createCall } from '@/modules/calls/repository';

export async function POST(request) {
  const { agentId, leadName, leadPhone } = await request.json();
  const agent = await getAgent(agentId);

  if (!agent || agent.syncStatus !== 'ready' || !agent.vapiAssistantId) {
    return NextResponse.json(
      { error: 'This Voice AI Assistant is not ready for calls yet.' },
      { status: 400 }
    );
  }

  try {
    const { vapiCallId } = await startCall({
      assistantId: agent.vapiAssistantId,
      leadName,
      leadPhone,
    });
    const call = await createCall({ agentId, leadName, leadPhone, vapiCallId });
    return NextResponse.json({ call });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
