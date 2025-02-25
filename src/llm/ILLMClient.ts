// ILLMClient.ts
export interface ILLMClient {
  generateContent(systemPrompt: string, prompt: string): Promise<string>;
}
