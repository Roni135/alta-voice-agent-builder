import { NextResponse } from 'next/server';
import { getLatestAgent } from '@/modules/agents/repository';
import { getHistory } from '@/modules/builder/messagesRepository';

// Lets the page resume the most recently created/edited Voice AI Assistant
// on load, since browser state alone doesn't survive a refresh. The Agent
// row (Postgres) is the source of truth regardless — this just reconnects
// the UI to it.
export async function GET() {
  const agent = await getLatestAgent();
  if (!agent) return NextResponse.json({ agent: null, history: [] });

  const history = await getHistory(agent.id);
  return NextResponse.json({ agent, history });
}
