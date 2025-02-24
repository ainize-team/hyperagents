import Agent from "../src/Agent";
import { LLMType, MemoryType } from "../src/type";
import dotenv from "dotenv";
dotenv.config();

// const max = new Agent({
//   systemPrompt: "You are a max agent. you are a writer",
//   llm: LLMType.GEMINI_1_5_FLASH,
//   publicDesc: "Write a first draft of an article.",
//   llmApiKey: process.env.GOOGLE_API_KEY!,
//   memoryType: MemoryType.inMemory,
//   memoryId: "MEMORY_ID",
// });

// // 사용 예시
// (async () => {
//   const output = await max.executeLLM(
//     "Who are you? Please write about ETH Bybit Hack"
//   );
//   console.log(output);
// })();

const victoria = new Agent({
  systemPrompt:
    "You are a victoria agent. you are a dancer. Make dance scenario",
  llm: LLMType.gpt4o,
  publicDesc: "Write a first draft of dance",
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY!,
  memoryType: MemoryType.inMemory,
  memoryId: "MEMORY_ID",
});

// 사용 예시
(async () => {
  const output = await victoria.executeLLM("Who are you?");
  console.log(output);
})();
