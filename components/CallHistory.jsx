'use client';

import { useEffect, useState } from 'react';

export default function CallHistory({ agent, onBack, onSelectCall }) {
  const [calls, setCalls] = useState(null);

  useEffect(() => {
    fetch(`/api/agents/${agent.id}/calls`)
      .then((res) => res.json())
      .then(({ calls: list }) => setCalls(list ?? []));
  }, [agent.id]);

  return (
    <div className="flex flex-1 flex-col gap-4 py-10">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Call History — {agent.name} ({agent.role})
        </h2>
        <button onClick={onBack} className="text-sm text-zinc-500 hover:underline">
          ← Back to profile
        </button>
      </div>

      {calls === null && <p className="text-sm text-zinc-400">Loading…</p>}
      {calls?.length === 0 && (
        <p className="text-sm text-zinc-400">No calls yet — start a Voice Session to call a lead.</p>
      )}

      <div className="flex flex-col gap-2">
        {calls?.map((call) => (
          <button
            key={call.id}
            onClick={() => onSelectCall(call)}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-zinc-300"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-900">{call.leadName}</span>
              <span className="text-xs text-zinc-400">
                {new Date(call.createdAt).toLocaleString('en-US', {
                  timeZone: 'UTC',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 ${
                call.status !== 'completed' ? 'bg-amber-100 text-amber-700'
                : call.qualified === true ? 'bg-green-100 text-green-700'
                : call.qualified === false ? 'bg-zinc-100 text-zinc-600'
                : 'bg-zinc-100 text-zinc-500'
              }`}>
                {call.status !== 'completed' ? 'In progress' : call.qualified === true ? '✅ Qualified' : call.qualified === false ? '❌ Not qualified' : 'Unknown'}
              </span>
              {call.meetingBooked && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">📅 Meeting booked</span>
              )}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500">
                {call.channel === 'web' ? 'Browser call' : 'Phone call'}
              </span>
            </div>
            {call.summary && (
              <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{call.summary}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
