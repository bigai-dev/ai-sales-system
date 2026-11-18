import { deepseek } from "@ai-sdk/deepseek";

// The two DeepSeek models every AI feature uses.
//   chat     — general / streaming workloads (fast, cheap)
//   reasoner — multi-step thinking, batch / async work (call grading)
//
// DeepSeek retired the old "deepseek-chat" / "deepseek-reasoner" aliases in
// favour of named models; see GET https://api.deepseek.com/models for the
// current list. If DeepSeek renames them again, change them here only — every
// other file imports `chat` / `reasoner` from this module.
export const chat = deepseek("deepseek-flash");
export const reasoner = deepseek("deepseek-v4-pro");
