import dotenv from "dotenv";
import { runCoinbaseAgentkitWithAzureOpenAI } from "../src/tools/coinbaseAgentkit";

dotenv.config();

async function main() {
  const responses = await runCoinbaseAgentkitWithAzureOpenAI({
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    cdpApiKeyName: process.env.CDP_API_KEY_NAME || "",
    cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY || "",
    networkId: "base-mainnet",
    message: "Check the balance of every asset in the wallet",
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
