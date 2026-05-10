import { config } from "dotenv";
import { generateText } from "ai";
import { chat } from "@/lib/ai/deepseek";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY is not set in .env.local");
    process.exit(1);
  }
  const { text, usage } = await generateText({
    model: chat,
    prompt: "Say 'pong' once. No punctuation.",
    maxOutputTokens: 10,
  });
  console.log("response:", text);
  console.log("usage:", usage);
}

main().catch((e) => {
  console.error("ping failed:", e?.message ?? e);
  process.exit(1);
});
