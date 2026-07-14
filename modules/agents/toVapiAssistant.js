// The ONLY place a persona is translated into runtime/model config
// (system prompt, temperature, provider, voice ids). Nothing else in the
// app — not the UI, not the Builder prompt — should know these details.

// Vapi's built-in "vapi" voice provider ships these preset voices with no
// extra provider account needed. Confirmed against
// https://docs.vapi.ai/providers/voice/vapi-voices (Lily/Rohan-v2 have
// since been deprecated — if assistant creation ever 400s again with a
// "legacy voice" error, that page is the source of truth, not this comment).
const VOICE_MAP = {
  'professional-female': { provider: 'vapi', voiceId: 'Clara', version: 2 },
  'professional-male': { provider: 'vapi', voiceId: 'Elliot', version: 2 },
  'friendly-female': { provider: 'vapi', voiceId: 'Layla', version: 2 },
  'friendly-male': { provider: 'vapi', voiceId: 'Kai', version: 2 },
};

const QUALIFICATION_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    qualified: { type: 'boolean' },
    reason: { type: 'string' },
    extractedData: { type: 'object' },
  },
  required: ['qualified', 'reason'],
};

function buildSystemPrompt(persona) {
  const questions = persona.qualificationQuestions.length
    ? persona.qualificationQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : '(use your judgment based on the qualification criteria below)';

  return [
    `You are ${persona.name}, a ${persona.role} working for ${persona.companyName}.`,
    persona.businessDescription ? `About the business: ${persona.businessDescription}` : null,
    `Your mission on this call: ${persona.mission}`,
    `You are speaking with: ${persona.targetLead}`,
    `Tone: ${persona.tone}`,
    '',
    'Ask the following qualification questions naturally over the course of the conversation:',
    questions,
    '',
    `A lead is qualified when: ${persona.qualificationCriteria}`,
    '',
    persona.meetingEnabled
      ? `If the lead is qualified, offer to book a ${persona.meetingDurationMinutes}-minute meeting using the bookMeeting tool. Call it first with no arguments — it returns up to 3 numbered options. Read those exact options to the lead (don't invent your own dates), then call it again with the option number (1, 2, or 3) they picked. Never construct a date/time yourself.`
      : 'Do not attempt to book a meeting on this call.',
    '',
    'Keep responses short and conversational — this is a phone call, not a chat.',
  ].filter(Boolean).join('\n');
}

const BOOK_MEETING_TOOL = {
  type: 'function',
  function: {
    name: 'bookMeeting',
    description:
      'Get available meeting slots (call with no arguments) — returns up to 3 numbered options. ' +
      'To book, call again with the option number (1, 2, or 3) the lead picked. Never pass a ' +
      'hand-constructed date/time — always use the option number from the previous response.',
    parameters: {
      type: 'object',
      properties: {
        // Vapi's schema validation rejects an integer field with an integer
        // enum ("each value in enum must be a string") despite that being
        // valid JSON Schema — string enum works, and resolveChosenSlot()
        // already coerces this via Number(args.option), so no other change
        // is needed.
        option: {
          type: 'string',
          enum: ['1', '2', '3'],
          description: 'The number (1, 2, or 3) of the option the lead picked, as a string. Omit to just list availability.',
        },
      },
    },
  },
  // Generous headroom above Vapi's own 20s default — our webhook hits a
  // serverless function backed by a free-tier Postgres instance, both of
  // which can have a real cold-start delay on the first request after a
  // period of inactivity.
  server: { timeoutSeconds: 30 },
};

// Vapi's default structured-data extraction prompt only sees the transcript
// + our JSON schema — it does NOT include the assistant's system prompt, so
// without this override the analysis step has no idea what "qualified"
// actually means for this persona. Embedding qualificationCriteria directly
// (not a Vapi template var — this is our own text) is what makes the
// qualification result reflect the rule the user actually configured.
function buildStructuredDataMessages(persona) {
  return [
    {
      role: 'system',
      content: [
        'You are an expert at analyzing sales call transcripts.',
        `The qualification rule for this call: ${persona.qualificationCriteria}`,
        'Extract structured data per the JSON Schema, applying that rule to decide "qualified".',
        '',
        'Json Schema:\n{{schema}}',
        '',
        'Only respond with the JSON.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: 'Here is the transcript:\n\n{{transcript}}\n\nHere is the ended reason of the call:\n\n{{endedReason}}\n\n',
    },
  ];
}

export function toVapiAssistant(persona, { webhookUrl }) {
  const voice = VOICE_MAP[persona.voice] ?? VOICE_MAP['professional-female'];

  return {
    name: persona.name,
    firstMessage: persona.openingMessage,
    serverUrl: webhookUrl,
    model: {
      // gpt-4o-mini: fast + inexpensive for a phone conversation, fits the
      // $50 test budget. Bump to gpt-4o if quality on live calls warrants it.
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: buildSystemPrompt(persona) }],
      tools: persona.meetingEnabled ? [BOOK_MEETING_TOOL] : [],
    },
    voice,
    analysisPlan: {
      summaryPlan: { enabled: true },
      structuredDataPlan: {
        enabled: true,
        schema: QUALIFICATION_RESULT_SCHEMA,
        messages: buildStructuredDataMessages(persona),
      },
    },
  };
}
