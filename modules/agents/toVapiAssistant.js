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
      ? `If the lead is qualified, offer to book a ${persona.meetingDurationMinutes}-minute meeting using the bookMeeting tool. Call it first with no arguments to get available slots, read them to the lead, then call it again with the slot the lead picked.`
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
      'Get available meeting slots (call with no arguments), or book one (call again with the chosen slot).',
    parameters: {
      type: 'object',
      properties: {
        slot: {
          type: 'string',
          description: 'The ISO datetime of the slot the lead chose. Omit to just list availability.',
        },
      },
    },
  },
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
