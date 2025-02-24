// ILLMClient.ts
export interface ILLMClient {
  generateContent(prompt: string): Promise<string>;
}
