'use client';

import { useEffect, useState } from 'react';
import BuilderChat from './BuilderChat';
import AssistantProfile from './AssistantProfile';
import TestCallPanel from './TestCallPanel';
import CallResult from './CallResult';

// Orchestrates the 4-screen User Journey: Builder Chat -> Assistant Profile
// (reveal) -> Test Call -> Call Result. One page, no routing, so "Edit in
// chat" can return to the same conversation without losing state.
export default function BuilderApp() {
  const [screen, setScreen] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [agent, setAgent] = useState(null);
  const [call, setCall] = useState(null);
  const [resuming, setResuming] = useState(true);

  // Browser state alone doesn't survive a refresh — Postgres is the source
  // of truth, so reconnect the UI to whatever was most recently built.
  useEffect(() => {
    fetch('/api/agents/latest')
      .then((res) => res.json())
      .then(({ agent: latestAgent, history }) => {
        if (latestAgent) {
          setAgent(latestAgent);
          setMessages(history);
          setScreen('profile');
        }
      })
      .finally(() => setResuming(false));
  }, []);

  function handleAgentReady(nextAgent) {
    setAgent(nextAgent);
    setScreen('profile');
  }

  function handleCallCompleted(finishedCall) {
    setCall(finishedCall);
    setScreen('result');
  }

  if (resuming) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
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
  );
}
