import { updateCallBooking } from '@/modules/calls/repository';

// Internal mock-but-real scheduling: availability is fixed (next 3 weekdays
// at 3 times each), but a chosen slot is persisted as a real booking against
// the Call row. In production this would call Cal.com/Google Calendar
// instead, behind this same two functions.
const TIMES_OF_DAY = [10, 14, 16]; // 24h, local server time

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
