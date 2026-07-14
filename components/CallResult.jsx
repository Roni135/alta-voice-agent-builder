'use client';

import { useState } from 'react';

export default function CallResult({ call, onDone }) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-5 py-10">
      <h2 className="text-lg font-semibold text-zinc-900">Call Result — {call.leadName}</h2>

      {call.status === 'failed' ? (
        <p className="text-sm text-red-600">The call failed to complete.</p>
      ) : (
        <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Qualified
            </span>
            <p className="text-sm text-zinc-800">
              {call.qualified === null ? 'Unknown' : call.qualified ? '✅ Yes' : '❌ No'}
              {call.qualificationReason ? ` — ${call.qualificationReason}` : ''}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Meeting
            </span>
            <p className="text-sm text-zinc-800">
              {call.meetingBooked
                ? `✅ Booked — ${new Date(call.meetingSlot).toLocaleString('en-US', {
                    // Pinned to match the server-side formatting in the
                    // webhook route — slots are generated on the server's
                    // clock (UTC), so without this the same instant shows
                    // a different wall-clock time depending on the
                    // viewer's own timezone.
                    timeZone: 'UTC',
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`
                : 'Not booked'}
            </p>
          </div>

          {call.summary && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Summary
              </span>
              <p className="text-sm text-zinc-800">{call.summary}</p>
            </div>
          )}

          {call.transcript && (
            <div>
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="text-sm font-medium text-zinc-600 hover:underline"
              >
                {showTranscript ? '▾' : '▸'} Full transcript
              </button>
              {showTranscript && (
                <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
                  {call.transcript}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onDone}
        className="self-start rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        ← Back to profile
      </button>
    </div>
  );
}
