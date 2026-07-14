import { updateCallBooking } from '@/modules/calls/repository';

// Internal mock-but-real scheduling: availability is fixed (next 3 weekdays
// at 3 times each), but a chosen slot is persisted as a real booking against
// the Call row. In production this would call Cal.com/Google Calendar
// instead, behind this same two functions.
// 24h, server's local clock — Vercel serverless functions run in UTC, so
// this is effectively 10am/2pm/4pm UTC. Every place that displays a slot
// must format it with timeZone: 'UTC' to match (see webhooks/vapi/route.js
// and CallResult.jsx) — otherwise the same instant shows a different
// wall-clock time depending on the viewer's own timezone.
const TIMES_OF_DAY = [10, 14, 16];

export function getAvailableSlots() {
  const slots = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (slots.length < 9) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day === 0 || day === 6) continue; // skip weekends

    for (const hour of TIMES_OF_DAY) {
      const slot = new Date(cursor);
      slot.setHours(hour, 0, 0, 0);
      slots.push(slot.toISOString());
    }
  }
  return slots.slice(0, 9);
}

export function bookSlot(callId, slotIso) {
  return updateCallBooking(callId, { meetingBooked: true, meetingSlot: slotIso });
}
