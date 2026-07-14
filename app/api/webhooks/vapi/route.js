import { NextResponse } from 'next/server';
import { getCallByVapiCallId, updateCallResult } from '@/modules/calls/repository';
import { getAvailableSlots, bookSlot } from '@/modules/booking/slots';

function formatSlot(iso) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatSlotsForVoice(slots) {
  return slots.slice(0, 3).map((iso, i) => `Option ${i + 1}: ${formatSlot(iso)}`).join('. ');
}

// The model does not reliably follow the tool schema — confirmed live, it
// sent a hand-constructed `{ slot }` with the correct hour but the wrong
// year instead of the requested `{ option }` index. Rather than fight
// prompting further, resolve defensively: prefer an explicit option index,
// but if a free-form `slot` shows up instead, trust only its hour (which
// has been consistently correct) and match it to one of the real slots we
// actually offered — never the model's own constructed date.
function resolveChosenSlot(args, slots) {
  const optionIndex = Number(args.option) - 1;
  if (Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex <= 2) {
    return slots[optionIndex];
  }
  if (args.slot) {
    const hour = new Date(args.slot).getHours();
    const match = slots.find((iso) => new Date(iso).getHours() === hour);
    if (match) return match;
  }
  return null;
}

async function handleToolCalls(message) {
  const call = await getCallByVapiCallId(message.call?.id);
  const results = [];

  for (const toolCall of message.toolCallList ?? []) {
    if (toolCall.function?.name !== 'bookMeeting') continue;

    // Vapi's own types say `arguments` is always a JSON string, but the
    // real production payload has been observed sending it as an
    // already-parsed object — JSON.parse(anObject) coerces it to the
    // string "[object Object]" first and then fails. Handle both shapes.
    const rawArgs = toolCall.function.arguments;
    const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : (rawArgs ?? {});

    const slots = getAvailableSlots();
    const chosenSlot = resolveChosenSlot(args, slots);

    if (!chosenSlot) {
      results.push({
        toolCallId: toolCall.id,
        result: `Available times. ${formatSlotsForVoice(slots)}. Ask the lead to pick one and call bookMeeting again with that option number (1, 2, or 3).`,
      });
      continue;
    }

    if (!call) {
      results.push({ toolCallId: toolCall.id, result: 'Could not find this call to book against.' });
      continue;
    }

    await bookSlot(call.id, chosenSlot);
    results.push({
      toolCallId: toolCall.id,
      result: `Booked for ${formatSlot(chosenSlot)}. Let the lead know it's confirmed.`,
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

  try {
    if (message?.type === 'tool-calls') {
      return await handleToolCalls(message);
    }
    if (message?.type === 'end-of-call-report') {
      return await handleEndOfCallReport(message);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Logged so a real failure is diagnosable in Vercel's Runtime Logs
    // instead of just showing up as the assistant improvising an excuse
    // mid-call with no visibility into why.
    console.error(`[vapi webhook] error handling "${message?.type}"`, err);

    if (message?.type === 'tool-calls') {
      const results = (message.toolCallList ?? []).map((toolCall) => ({
        toolCallId: toolCall.id,
        result: 'Something went wrong on our end — please try again in a moment.',
      }));
      return NextResponse.json({ results });
    }
    return NextResponse.json({ ok: true });
  }
}
