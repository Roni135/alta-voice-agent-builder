import { NextResponse } from 'next/server';
import { getCall } from '@/modules/calls/repository';

// Polled by the Test Call / Call Result screen while waiting for the
// end-of-call-report webhook to arrive and fill in the outcome.
export async function GET(_request, { params }) {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ call });
}
