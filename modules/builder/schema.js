import { PERSONA_JSON_SCHEMA } from '@/modules/agents/personaSchema';

// Structured output contract for the Builder Agent. `agent` is present
// (non-null) only for "create"/"update" — OpenAI strict mode requires the
// key to always exist, so "clarify" responses carry agent: null.
export const BUILDER_RESULT_SCHEMA = {
  name: 'builder_result',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      action: { type: 'string', enum: ['clarify', 'create', 'update'] },
      message: {
        type: 'string',
        description: 'What to say back to the user, in plain product language.',
      },
      agent: {
        anyOf: [
          { ...PERSONA_JSON_SCHEMA, additionalProperties: false },
          { type: 'null' },
        ],
      },
    },
    required: ['action', 'message', 'agent'],
  },
};
