'use client';

const VOICE_LABELS = {
  'professional-female': 'Professional · Female',
  'professional-male': 'Professional · Male',
  'friendly-female': 'Friendly · Female',
  'friendly-male': 'Friendly · Male',
};

function StatusBadge({ syncStatus }) {
  if (syncStatus === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
        <span className="h-2 w-2 rounded-full bg-green-500" /> Ready for Voice Session
      </span>
    );
  }
  if (syncStatus === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-500" /> Sync failed — edit in chat to retry
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500">
      <span className="h-2 w-2 rounded-full bg-zinc-400" /> Syncing…
    </span>
  );
}

export default function AssistantProfile({ agent, onEditInChat, onTestCall }) {
  const ready = agent.syncStatus === 'ready';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
      <p className="text-lg font-medium text-zinc-900">
        🎉 Your Voice AI Assistant is ready
      </p>

      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">{agent.name}</h2>
          <p className="text-sm text-zinc-500">
            {agent.role} · Works for {agent.companyName}
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Mission</h3>
          <p className="text-sm text-zinc-700">{agent.mission}</p>
        </div>

        <div className="mb-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Qualification
          </h3>
          <ul className="space-y-1 text-sm text-zinc-700">
            {agent.qualificationQuestions.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-green-600">✓</span> {q}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-xs text-zinc-600">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1">
            Voice: {VOICE_LABELS[agent.voice] ?? agent.voice}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1">
            {agent.meetingEnabled
              ? `Meeting: ${agent.meetingDurationMinutes} min, auto-booking ON`
              : 'Booking disabled'}
          </span>
        </div>

        <StatusBadge syncStatus={agent.syncStatus} />
        {agent.syncStatus === 'failed' && agent.syncError && (
          <p className="mt-1 text-xs text-red-600">{agent.syncError}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onEditInChat}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Edit in chat
        </button>
        <button
          onClick={onTestCall}
          disabled={!ready}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Start Voice Session →
        </button>
      </div>
    </div>
  );
}
