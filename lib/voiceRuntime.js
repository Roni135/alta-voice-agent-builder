// Public interface every module depends on instead of calling Vapi
// directly. `createAssistant`/`updateAssistant` take our persona (Agent)
// object; `startCall` takes { assistantId, leadName, leadPhone }.
// Swapping voice providers means writing a new implementation file and
// changing the export below — not touching the Builder or the data model.
export { createAssistant, updateAssistant, startCall } from './vapiRuntime';
