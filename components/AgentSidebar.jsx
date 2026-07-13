'use client';

import { useEffect, useState } from 'react';

export default function AgentSidebar({ selectedAgentId, refreshSignal, onSelect, onNew }) {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then(({ agents: list }) => setAgents(list ?? []));
  }, [refreshSignal]);

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 pr-3">
      <button
        onClick={onNew}
        className="mb-3 w-full rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
      >
        + New Agent
      </button>

      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Your assistants
      </p>
      <div className="flex flex-col gap-1">
        {agents.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={`rounded-lg px-2 py-1.5 text-left text-sm ${
              a.id === selectedAgentId ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <div className="truncate">{a.name}</div>
            <div className="truncate text-xs text-zinc-400">{a.role} · {a.companyName}</div>
          </button>
        ))}
        {agents.length === 0 && (
          <p className="px-2 py-1.5 text-sm text-zinc-400">None yet</p>
        )}
      </div>
    </aside>
  );
}
