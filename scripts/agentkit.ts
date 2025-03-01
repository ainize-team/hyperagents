import dotenv from "dotenv";
import { runCoinbaseAgentkitWithAzureOpenAI } from "../src/tools/coinbaseAgentkit";

dotenv.config();

async function main() {
  const responses = await runCoinbaseAgentkitWithAzureOpenAI({
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    cdpApiKeyName: process.env.CDPNAME || "",
    cdpApiKeyPrivateKey: process.env.CDPKEY || "",
    walletDataStr: process.env.CFO_WALLET_DATA_STR || "",
    networkId: "base-mainnet",
    message: `
    transfer 10 USDC to 0x140a84543e56124bd774BAe0E29d528d51C80039
    and transfer 30 USDC to 0x499c44e45fDe0514F0c71cBf373d7Ed09954440d
    and transfer 20 USDC to 0xc2279df65F71113a602Ccd5EF120A7416532130C
    `,
  });

  console.log(responses);
}

main().catch((error) => {
  console.error("실행 중 오류 발생:", error);
  process.exit(1);
});

// "Check the balance of every asset in the wallet"
// "Convert 0.006 ETH to USDC"
