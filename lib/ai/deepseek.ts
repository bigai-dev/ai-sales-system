import { deepseek } from "@ai-sdk/deepseek";
import { defaultSettingsMiddleware, wrapLanguageModel } from "ai";

// The two DeepSeek models every AI feature uses.
//   chat     — general / streaming workloads (fast, cheap): Flash, thinking OFF
//   reasoner — multi-step thinking, batch / async work (call grading): Flash, thinking ON
//
// DeepSeek retired the old "deepseek-chat" / "deepseek-reasoner" aliases on
// 2026-07-24. Per DeepSeek's changelog they pointed to the non-thinking and
// thinking modes of Flash, so these two keep the same behaviour (and speed).
// deepseek-flash thinks by default, which roughly doubles response time, so
// `chat` switches it off explicitly. deepseek-v4-pro was ~4x slower for
// grading, so it is not used. Current list: GET https://api.deepseek.com/models
// If DeepSeek renames them again, change them here only — every other file
// imports `chat` / `reasoner` from this module.
export const chat = wrapLanguageModel({
  model: deepseek("deepseek-flash"),
  middleware: defaultSettingsMiddleware({
    settings: { providerOptions: { deepseek: { thinking: { type: "disabled" } } } },
  }),
});

export const reasoner = wrapLanguageModel({
  model: deepseek("deepseek-flash"),
  middleware: defaultSettingsMiddleware({
    settings: { providerOptions: { deepseek: { thinking: { type: "enabled" } } } },
  }),
});
