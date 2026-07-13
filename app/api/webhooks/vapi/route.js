import { NextResponse } from 'next/server';
import { getCallByVapiCallId, updateCallResult } from '@/modules/calls/repository';
import { getAvailableSlots, bookSlot } from '@/modules/booking/slots';

function formatSlotsForVoice(slots) {
  return slots
    .slice(0, 3)
    .map((iso) =>
      new Date(iso).toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    )
    .join(', ');
}

async function handleToolCalls(message) {
  const call = await getCallByVapiCallId(message.call?.id);
  const results = [];

  for (const toolCall of message.toolCallList ?? []) {
    if (toolCall.function?.name !== 'bookMeeting') continue;

    const args = JSON.parse(toolCall.function.arguments || '{}');

    if (!args.slot) {
      const slots = getAvailableSlots();
      results.push({
        toolCallId: toolCall.id,
        result: `Available times: ${formatSlotsForVoice(slots)}. Ask the lead to pick one and call bookMeeting again with that slot.`,
      });
      continue;
    }

    if (!call) {
      results.push({ toolCallId: toolCall.id, result: 'Could not find this call to book against.' });
      continue;
    }

    await bookSlot(call.id, args.slot);
    results.push({
      toolCallId: toolCall.id,
      result: `Booked for ${new Date(args.slot).toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}. Let the lead know it's confirmed.`,
    });
  }

  return NextResponse.json({ results });
}

async function handleEndOfCallReport(message) {
  const call = await getCallByVapiCallId(message.call?.id);
  if (!call) return NextResponse.json({ ok: true });

  const structuredData = message.analysis?.structuredData;
  await updateCallResult(call.id, {
    status: 'completed',
    transcript: message.transcript,
    summary: message.summary ?? message.analysis?.summary,
    qualified: structuredData?.qualified,
    qualificationReason: structuredData?.reason,
    extractedData: structuredData?.extractedData,
  });

  return NextResponse.json({ ok: true });
}

export async function POST(request) {
  const body = await request.json();
  const message = body.message;

  if (message?.type === 'tool-calls') {
    return handleToolCalls(message);
  }
  if (message?.type === 'end-of-call-report') {
    return handleEndOfCallReport(message);
  }

  return NextResponse.json({ ok: true });
}
