import { NextResponse } from 'next/server';
import { listAgents } from '@/modules/agents/repository';

// Powers the sidebar list of previously built Voice AI Assistants.
export async function GET() {
  const agents = await listAgents();
  return NextResponse.json({ agents });
}
