import { toVapiAssistant } from '@/modules/agents/toVapiAssistant';

const VAPI_BASE = 'https://api.vapi.ai';

function headers() {
  return {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function webhookUrl() {
  return `${process.env.APP_BASE_URL}/api/webhooks/vapi`;
}

async function vapiFetch(path, options) {
  const res = await fetch(`${VAPI_BASE}${path}`, { ...options, headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const friendly = (() => {
      try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message;
      } catch {
        return null;
      }
    })();
    throw new Error(friendly || `Vapi ${options?.method ?? 'GET'} ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createAssistant(agent) {
  const payload = toVapiAssistant(agent, { webhookUrl: webhookUrl() });
  const created = await vapiFetch('/assistant', { method: 'POST', body: JSON.stringify(payload) });
  return { vapiAssistantId: created.id };
}

export async function updateAssistant(agent) {
  const payload = toVapiAssistant(agent, { webhookUrl: webhookUrl() });
  const updated = await vapiFetch(`/assistant/${agent.vapiAssistantId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return { vapiAssistantId: updated.id };
}

export async function startCall({ assistantId, leadName, leadPhone }) {
  const created = await vapiFetch('/call', {
    method: 'POST',
    body: JSON.stringify({
      assistantId,
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: { number: leadPhone, name: leadName },
    }),
  });
  return { vapiCallId: created.id };
}
