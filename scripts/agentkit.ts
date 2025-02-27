import dotenv from "dotenv";
import { runCoinbaseAgentkitWithAzureOpenAI } from "../src/tools/coinbaseAgentkit";

dotenv.config();

async function main() {
  const responses = await runCoinbaseAgentkitWithAzureOpenAI({
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    cdpApiKeyName: process.env.RESEARCHER_CDPNAME || "",
    cdpApiKeyPrivateKey: process.env.RESEARCHER_CDPKEY || "",
    networkId: "base-mainnet",
    message: "Convert 0.006 ETH to USDC",
  });

  console.log(responses);
}

main().catch((error) => {
  console.error("실행 중 오류 발생:", error);
  process.exit(1);
});

// "Check the balance of every asset in the wallet"
//
