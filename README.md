# Voice AI Assistant Builder

A platform where a user describes the Voice AI Assistant they want in plain
language, a Builder Agent turns that conversation into a persona, and the
resulting assistant places a real call, qualifies a lead, and books a
meeting.

**In one sentence:** this is two AI agents working together — a **Builder
Agent** (reasoning over a chat conversation to create/edit a persona) and
the **Voice Assistant** it produces (reasoning over a live call to qualify a
lead and book a meeting) — with Postgres as the source of truth for the
persona and Vapi as the runtime that executes it.

## User Journey

1. The app always opens to a fresh Builder chat by default — it doesn't assume you want to keep editing whatever you built last
2. User describes the assistant they want, in plain language
3. The Builder asks clarifying questions — consultant-style, only for what's missing
4. The assistant is created and synced to the voice runtime automatically (no separate "publish" step)
5. The user sees a reveal screen — their Voice AI Assistant as a profile card, status "Ready for Voice Session"
6. The user can keep talking to the Builder to adjust it — the same profile updates in place
7. The user starts a voice session (browser call, or a real phone call)
8. The assistant has the qualification conversation and, if the lead qualifies, books a meeting
9. The user reviews the outcome: qualified?, meeting booked?, full transcript

A sidebar lists every assistant built so far (Postgres-backed, not just
browser state) — click one to reopen its profile and continue editing it,
or click **"+ New Agent"** to start a completely separate one. Building
multiple assistants doesn't overwrite or lose previous ones.

## Architecture

```
Builder Agent (OpenAI)
      ↓ creates / updates
Voice AI Assistant  ——  source of truth: Postgres (Neon)
      ↓ synced to
Voice Runtime (Vapi today; swappable — see lib/voiceRuntime.js)
      ↓ calls leads
Qualification  →  Meeting Booking
```

Organized as a modular monolith — one deployable app, internally separated by concern:

```
app/                        # Next.js routes + pages (App Router)
  api/agents                  # List built assistants (sidebar)
  api/agents/[id]               # Fetch one assistant + its chat history
  api/builder                 # Builder Agent endpoint (clarify / create / update)
  api/calls/start              # Places a real outbound phone call
  api/calls/register           # Registers a browser (Web Call) session
  api/calls/[id]                # Poll a call's status/result
  api/webhooks/vapi            # Receives tool-calls (booking) + end-of-call-report
components/                 # AgentSidebar + the 4 screens: BuilderChat, AssistantProfile, TestCallPanel, CallResult
modules/
  builder/                    # Consultant-style prompt + structured-output schema
  agents/                      # Persona schema, repository (Postgres), persona -> Vapi payload mapper
  calls/                        # Call repository
  booking/                      # Fixed-slot scheduling tool (internal, mock-but-real)
lib/
  db.js                       # Postgres connection (Neon serverless driver) + schema bootstrap
  openai.js                    # Lazy OpenAI client
  voiceRuntime.js               # Interface: createAssistant / updateAssistant / startCall
  vapiRuntime.js                 # Vapi implementation of voiceRuntime
db/schema.js                # Table definitions (imported, not read from disk — see note below)
```

**The persona is a product model, not a prompt.** The Builder never asks
for "system prompt" or "temperature" — the user only ever sees/edits a
persona (name, role, business, mission, target lead, qualification
criteria, meeting policy). A single function (`modules/agents/toVapiAssistant.js`)
is the only place that translates this persona into Vapi's technical
assistant payload (system prompt, model, voice, tools, analysis config).

**Postgres is the source of truth; Vapi is only the execution runtime.**
The `Agent` row *is* the product — `vapiAssistantId` is just a pointer into
whichever voice runtime executes it today. `lib/voiceRuntime.js` is a thin
interface Vapi sits behind, so swapping providers later means writing one
new file, not touching the Builder or the data model.

## Stack, and why

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (JavaScript, App Router) | One deployable app — UI + API routes together, no separate backend/CORS to manage. |
| LLM (Builder) | OpenAI (`gpt-4o`), direct structured-output calls, no LangChain/LangGraph | The Builder's reasoning is one classification+extraction call per turn (`clarify`/`create`/`update`) — no multi-step tool loop or branching graph exists to orchestrate, so a framework would add abstraction without solving a real problem. (Considered and deliberately not used — see below.) |
| Voice | [Vapi](https://vapi.ai) | Assistant creation via API, outbound calling, custom tool-calling via webhook, and built-in call analysis (transcript, summary, structured qualification extraction) — no second LLM call needed for qualification. |
| DB | Postgres via Vercel's native Neon integration (`@neondatabase/serverless`) | Started as SQLite for zero local setup; migrated once deployment made a real persistent DB non-optional anyway (Vercel's filesystem is read-only except an ephemeral `/tmp`). Postgres beat Turso (extra account/CLI for a SQLite-compatible store with no real setup savings) and beat Azure SQL (the author's actual background, but hosted SQL Server needs firewall config for serverless callers with non-static IPs — real time risk under deadline). |
| Booking | Internal fixed-slot scheduling tool | Real tool-calling loop and real persistence, without spending hours on a Cal.com/Google Calendar OAuth integration. In production this would be the natural next integration. |

### Why not LangGraph

LangGraph earns its keep with multi-step, branching, or looping reasoning —
an agent that plans, calls a tool, evaluates, and decides what to do next.
The Builder isn't that: it's one structured-output call per turn. The
actual multi-turn, tool-calling decision-maker in this system is the voice
assistant *during the live call* — and that orchestration is handled by
Vapi itself, not by this codebase. What *would* justify LangGraph later:
multi-step company research (web search → enrich → draft persona) before
creating the assistant.

## Known scope decisions

- **Booking is an internal mock-but-real tool**, not a live Cal.com/Google Calendar integration — fixed availability, but a real persisted booking. Disclosed deliberately as the natural next step.
- **No agent versioning/diff** — editing an assistant overwrites its persona in place.
- **No "publish" step** — creating/updating an assistant syncs to the voice runtime automatically, in the same request. Sync status (`ready`/`failed`) is shown on the profile card instead.
- **Free Vapi numbers can't place international calls** (confirmed while testing against an Israeli number) — the Voice Session screen defaults to a **browser call** (Vapi Web Call, WebRTC, no phone/carrier involved) and also offers a real phone-number option for domestic (US) numbers.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Required environment variables (see `.env.example`):

- `DATABASE_URL` — Postgres connection string (Neon)
- `OPENAI_API_KEY`
- `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID` — from the [Vapi dashboard](https://dashboard.vapi.ai)
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY` — Vapi's client-side key, for the browser Web Call SDK
- `APP_BASE_URL` — a public HTTPS URL Vapi can reach for webhooks (tool-calls, call results). Required for booking and call results to work; not needed just to test the Builder chat itself.
