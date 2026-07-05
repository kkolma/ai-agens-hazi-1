// @plantbase/core — az agent-logika háza (LLM-hívás, runSql tool, séma-kontextus, naplózás).
// Framework-agnosztikus: nem ismeri a belépési pontokat (CLI/API/web).

export { echo } from './echo';
export { askAgent } from './agent/ask-agent';
export type { AgentResult, AskAgentOptions } from './agent/ask-agent';
