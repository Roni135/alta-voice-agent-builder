'use client';

import { useState } from 'react';
import AgentSidebar from './AgentSidebar';
import BuilderChat from './BuilderChat';
import AssistantProfile from './AssistantProfile';
import TestCallPanel from './TestCallPanel';
import CallResult from './CallResult';

// Orchestrates the 4-screen User Journey: Builder Chat -> Assistant Profile
// (reveal) -> Test Call -> Call Result, plus a sidebar for switching between
// or starting new Voice AI Assistants. The URL always opens to a fresh chat
// by default — Postgres remembers everything, but landing on a past agent
// automatically would hijack "start something new" as the default action.
export default function BuilderApp() {
  const [screen, setScreen] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [agent, setAgent] = useState(null);
  const [call, setCall] = useState(null);
  const [sidebarVersion, setSidebarVersion] = useState(0);

  function handleAgentReady(nextAgent) {
    setAgent(nextAgent);
    setScreen('profile');
    setSidebarVersion((v) => v + 1);
  }

  function handleCallCompleted(finishedCall) {
    setCall(finishedCall);
    setScreen('result');
  }

  function handleNewAgent() {
    setAgent(null);
    setMessages([]);
    setCall(null);
    setScreen('chat');
  }

  async function handleSelectAgent(agentId) {
    const res = await fetch(`/api/agents/${agentId}`);
    if (!res.ok) return;
    const { agent: selected, history } = await res.json();
    setAgent(selected);
    setMessages(history);
    setCall(null);
    setScreen('profile');
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl gap-6 px-4 py-8">
      <AgentSidebar
        selectedAgentId={agent?.id}
        refreshSignal={sidebarVersion}
        onSelect={handleSelectAgent}
        onNew={handleNewAgent}
      />

      <div className="flex flex-1 flex-col">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">Voice AI Assistant Builder</h1>
        </header>

        {screen === 'chat' && (
          <BuilderChat
            agent={agent}
            messages={messages}
            setMessages={setMessages}
            onAgentReady={handleAgentReady}
          />
        )}

        {screen === 'profile' && agent && (
          <AssistantProfile
            agent={agent}
            onEditInChat={() => setScreen('chat')}
            onTestCall={() => setScreen('test-call')}
          />
        )}

        {screen === 'test-call' && agent && (
          <TestCallPanel
            agent={agent}
            onBack={() => setScreen('profile')}
            onCallCompleted={handleCallCompleted}
          />
        )}

        {screen === 'result' && call && (
          <CallResult
            call={call}
            onDone={() => setScreen('profile')}
          />
        )}
      </div>
    </div>
  );
}
