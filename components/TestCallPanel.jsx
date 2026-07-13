'use client';

import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

// Two ways to place the test call:
// - "phone": real PSTN dialing via voiceRuntime/Vapi. Works, but free Vapi
//   numbers can't call international destinations (confirmed against an
//   Israeli number) — importing a paid number would lift that limit.
// - "web": browser mic over WebRTC via the Vapi Web SDK. Always works,
//   no phone/carrier involved.
// Everything downstream (webhook, booking tool, qualification, transcript)
// is identical either way.
export default function TestCallPanel({ agent, onBack, onCallCompleted }) {
  const [mode, setMode] = useState('web');
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | connecting | in-call | ended
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const vapiRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      vapiRef.current?.stop();
    };
  }, []);

  function getVapi() {
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
      vapiRef.current.on('call-end', () => setPhase('ended'));
      vapiRef.current.on('error', (err) => setError(err?.message || 'Call error.'));
    }
    return vapiRef.current;
  }

  async function handleStartWeb(e) {
    e.preventDefault();
    setError(null);
    setPhase('connecting');
    try {
      const vapi = getVapi();
      const startedCall = await vapi.start(agent.vapiAssistantId);
      if (!startedCall?.id) throw new Error('Vapi did not return a call id.');

      const res = await fetch('/api/calls/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, leadName: leadName || 'Test Lead', vapiCallId: startedCall.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not register the call.');

      setCall(body.call);
      setPhase('in-call');
      pollRef.current = setInterval(() => pollStatus(body.call.id), 3000);
    } catch (err) {
      setError(err.message);
      setPhase('idle');
    }
  }

  async function handleStartPhone(e) {
    e.preventDefault();
    setError(null);
    setPhase('connecting');
    try {
      const res = await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, leadName: leadName || 'Test Lead', leadPhone }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not start the call.');

      setCall(body.call);
      setPhase('in-call');
      pollRef.current = setInterval(() => pollStatus(body.call.id), 3000);
    } catch (err) {
      setError(err.message);
      setPhase('idle');
    }
  }

  function handleEnd() {
    vapiRef.current?.stop();
  }

  async function pollStatus(callId) {
    const res = await fetch(`/api/calls/${callId}`);
    if (!res.ok) return;
    const { call: latest } = await res.json();
    setCall(latest);
    if (latest.status !== 'in-progress') {
      clearInterval(pollRef.current);
      onCallCompleted(latest);
    }
  }

  const locked = phase !== 'idle';

  return (
    <div className="flex flex-1 flex-col gap-6 py-10">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Voice Session — {agent.name} ({agent.role})
        </h2>
        <button onClick={onBack} className="text-sm text-zinc-500 hover:underline">
          ← Back to profile
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => !locked && setMode('web')}
          disabled={locked}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            mode === 'web' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          Browser Voice Call
        </button>
        <button
          onClick={() => !locked && setMode('phone')}
          disabled={locked}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            mode === 'phone' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          Phone Call (PSTN)
        </button>
      </div>

      {mode === 'web' ? (
        <>
          <p className="text-xs text-zinc-500">
            Runs in your browser over your microphone (Vapi Web Call) — no phone number needed, always works.
          </p>
          <form onSubmit={handleStartWeb} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <label className="flex flex-col gap-1 text-sm">
              Lead Name (optional)
              <input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="John Doe"
                disabled={locked}
              />
            </label>
            {phase === 'idle' && (
              <button type="submit" className="mt-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white">
                Start Voice Session
              </button>
            )}
          </form>
        </>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            Phone calls require a supported outbound number.
            <br />
            For this demo, browser calls work immediately.
          </p>
          <form onSubmit={handleStartPhone} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <label className="flex flex-col gap-1 text-sm">
              Lead Name (optional)
              <input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="John Doe"
                disabled={locked}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Phone
              <input
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                required
                className="rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="+1 555 010 1234"
                disabled={locked}
              />
            </label>
            {phase === 'idle' && (
              <button type="submit" className="mt-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white">
                Call Now
              </button>
            )}
          </form>
        </>
      )}

      {phase === 'connecting' && (
        <p className="text-sm text-zinc-500">
          {mode === 'web' ? 'Connecting… allow microphone access if prompted.' : 'Calling…'}
        </p>
      )}
      {phase === 'in-call' && mode === 'web' && (
        <button onClick={handleEnd} className="self-start rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white">
          End Call
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {call && (phase === 'in-call' || phase === 'ended') && (
        <p className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          {phase === 'in-call'
            ? mode === 'web'
              ? 'In call — talk to it like a lead'
              : 'In call… this can take a minute or two'
            : 'Call ended, loading result…'}
        </p>
      )}
    </div>
  );
}
