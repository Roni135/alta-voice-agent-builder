import { NextResponse } from 'next/server';
import { getAgent } from '@/modules/agents/repository';
import { getHistory } from '@/modules/builder/messagesRepository';

// Opens a specific Voice AI Assistant from the sidebar, with its chat
// history so "Edit in chat" continues the real conversation.
export async function GET(_request, { params }) {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const history = await getHistory(id);
  return NextResponse.json({ agent, history });
}
