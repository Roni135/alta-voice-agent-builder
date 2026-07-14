import { NextResponse } from 'next/server';
import { listCallsForAgent } from '@/modules/calls/repository';

// Powers the Call History screen — every lead this assistant has ever
// called, with its qualification/booking outcome and summary.
export async function GET(_request, { params }) {
  const { id } = await params;
  const calls = await listCallsForAgent(id);
  return NextResponse.json({ calls });
}
