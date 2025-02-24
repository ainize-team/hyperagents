export enum LLMType {
  gpt4o = "gpt-4o",
  gpt4oMini = "gpt-4o-mini",
  GOOGLE = "GOOGLE",
  GEMINI_1_5_FLASH = "gemini-1.5-flash",
}
export enum MemoryType {
  inMemory = "InMemory",
}
export interface Memory {
  init(): Promise<void>;
  add(data: string): Promise<void>;
  load(): Promise<Array<string>>;
}

export interface AgentConfigs {
  systemPrompt: string;
  llm: LLMType;
  publicDesc: string;
  llmEndpoint?: string;
  llmApiKey: string;
  memoryType: MemoryType;
  memoryId: string;
}
