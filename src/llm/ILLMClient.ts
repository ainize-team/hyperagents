import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// ILLMClient.ts
export interface ILLMClient {
  generateContent(systemPrompt: string, prompt: string): Promise<string>;
  generateContentWithMcp?(
    systemPrompt: string,
    prompt: string,
    mcp: Client,
    tools: any[],
  ): Promise<string>;
}
