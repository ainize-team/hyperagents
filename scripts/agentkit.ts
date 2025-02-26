import dotenv from "dotenv";
import { runCoinbaseAgentkitWithAzureOpenAI } from "../src/tools/coinbaseAgentkit";

dotenv.config();

async function main() {
  const responses = await runCoinbaseAgentkitWithAzureOpenAI({
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    cdpApiKeyName: process.env.CDP_API_KEY_NAME || "",
    cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY || "",
    message:
      "transfer 0.0001 ETH to 0x493460bcac0b546dfbac830d7628164ad82d654d",
  });

  // 결과 출력
  responses.forEach((response) => {
    console.log(`[${response.type}] ${response.content}`);
  });
}

main().catch((error) => {
  console.error("실행 중 오류 발생:", error);
  process.exit(1);
});
