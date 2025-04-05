import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "solana-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// 기존 weather 관련 tool 등록 (생략)

// ----------------------------------------------------
// Solana Token Transfer Tool 등록
// ----------------------------------------------------
server.tool(
  "sol-transfer",
  "Transfer SOL or an SPL token on Solana",
  {
    recipient: z.string().describe("Recipient public key (base58)"),
    amount: z.number().positive().describe("Amount to transfer"),
    tokenMint: z
      .string()
      .optional()
      .describe("Optional SPL token mint address. If omitted, transfer SOL."),
  },
  async ({ recipient, amount, tokenMint }) => {
    // 동적 import를 통해 solana-agent-kit와 @solana/web3.js 로딩
    const { SolanaAgentKit } = await import("solana-agent-kit");
    const { PublicKey } = await import("@solana/web3.js");

    const PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;
    const RPC_URL = process.env.RPC_URL;

    // SolanaAgentKit 인스턴스 생성
    const agent = new SolanaAgentKit(PRIVATE_KEY!, RPC_URL!, {});

    const recipientPubKey = new PublicKey(recipient);
    let transferResult;
    if (tokenMint) {
      // SPL Token transfer (토큰 mint 주소 제공)
      transferResult = await agent.transfer(recipientPubKey, amount, new PublicKey(tokenMint));
    } else {
      // SOL transfer
      transferResult = await agent.transfer(recipientPubKey, amount);
    }

    return {
      content: [
        {
          type: "text",
          text: `Transfer successful.\nResult: ${JSON.stringify(transferResult, null, 2)}`,
        },
      ],
    };
  },
);

// ----------------------------------------------------
// MCP 서버 실행
// ----------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server with Solana Transfer Tool running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
