import { deepseek } from "@ai-sdk/deepseek";

// Stable aliases. DeepSeek points each alias at the latest model in its family.
//   chat     — general / streaming workloads
//   reasoner — multi-step thinking, batch / async work
//
// If a future release renames these, change them here only — every other file
// in this codebase imports `chat` / `reasoner` from this module.
export const chat = deepseek("deepseek-chat");
export const reasoner = deepseek("deepseek-reasoner");
