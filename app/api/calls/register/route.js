import { NextResponse } from 'next/server';
import { getAgent } from '@/modules/agents/repository';
import { createCall } from '@/modules/calls/repository';

// For "web" calls the browser already started the call directly with Vapi
// via the Web SDK (no phone number, no carrier). This just persists the
// resulting call id so our webhook/results screen can attach to it later.
export async function POST(request) {
  const { agentId, leadName, vapiCallId } = await request.json();
  const agent = await getAgent(agentId);

  if (!agent || agent.syncStatus !== 'ready') {
    return NextResponse.json(
      { error: 'This Voice AI Assistant is not ready for calls yet.' },
      { status: 400 }
    );
  }

  const call = await createCall({ agentId, leadName, vapiCallId, channel: 'web' });
  return NextResponse.json({ call });
}
