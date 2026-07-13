import { getOpenAI } from '@/lib/openai';
import { buildSystemPrompt } from './prompt';
import { BUILDER_RESULT_SCHEMA } from './schema';
import { REQUIRED_FIELDS } from '@/modules/agents/personaSchema';

// Runs one turn of the Builder Agent: given the chat history and whatever
// persona exists so far, decide whether to ask a clarifying question,
// create the assistant, or update it.
export async function runBuilder({ history, existingAgent }) {
  const missingRequiredFields = existingAgent ? [] : REQUIRED_FIELDS;
  const systemPrompt = buildSystemPrompt({ existingAgent, missingRequiredFields });

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
    response_format: { type: 'json_schema', json_schema: BUILDER_RESULT_SCHEMA },
  });

  return JSON.parse(completion.choices[0].message.content);
}
