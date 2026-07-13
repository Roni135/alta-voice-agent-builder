import * as voiceRuntime from '@/lib/voiceRuntime';
import { setSyncResult } from './repository';

// Syncs a persona to the voice runtime right after create/update. Never
// throws — a failed sync is reflected in the persona's own status field
// ("Sync failed — retry") instead of blocking the Builder's response, since
// the user should still see their assistant was saved even if Vapi is down.
export async function syncAgentToVoiceRuntime(agent) {
  try {
    const result = agent.vapiAssistantId
      ? await voiceRuntime.updateAssistant(agent)
      : await voiceRuntime.createAssistant(agent);

    return setSyncResult(agent.id, {
      vapiAssistantId: result.vapiAssistantId,
      syncStatus: 'ready',
      syncError: null,
    });
  } catch (err) {
    return setSyncResult(agent.id, {
      vapiAssistantId: agent.vapiAssistantId ?? null,
      syncStatus: 'failed',
      syncError: err.message,
    });
  }
}
