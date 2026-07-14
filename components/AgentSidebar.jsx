'use client';

import { useEffect, useState } from 'react';

export default function AgentSidebar({ selectedAgentId, refreshSignal, onSelect, onNew, onDeleted }) {
  const [agents, setAgents] = useState([]);

  function refresh() {
    fetch('/api/agents')
      .then((res) => res.json())
      .then(({ agents: list }) => setAgents(list ?? []));
  }

  useEffect(refresh, [refreshSignal]);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this assistant? This cannot be undone.')) return;
    await fetch(`/api/agents/${id}`, { method: 'DELETE' });
    refresh();
    if (id === selectedAgentId) onDeleted();
  }

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
          <div
            key={a.id}
            className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 ${
              a.id === selectedAgentId ? 'bg-zinc-100' : 'hover:bg-zinc-50'
            }`}
          >
            <button onClick={() => onSelect(a.id)} className="min-w-0 flex-1 text-left text-sm">
              <div className={`truncate ${a.id === selectedAgentId ? 'font-medium text-zinc-900' : 'text-zinc-600'}`}>
                {a.name}
              </div>
              <div className="truncate text-xs text-zinc-400">{a.role} · {a.companyName}</div>
            </button>
            <button
              onClick={(e) => handleDelete(e, a.id)}
              className="shrink-0 rounded px-1.5 text-zinc-300 opacity-0 hover:text-red-600 group-hover:opacity-100"
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="px-2 py-1.5 text-sm text-zinc-400">None yet</p>
        )}
      </div>
    </aside>
  );
}
