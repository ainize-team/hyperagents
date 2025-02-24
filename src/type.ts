export enum LLMType {
  gpt4o = "gpt-4o",
  gpt4oMini = "gpt-4o-mini",
}
export enum MemoryType {
  inMemory = "InMemory",
}

export interface Message {
  author: string;
  content: string;
}

export interface Memory {
  init(): Promise<void>;
  add(data:Message): Promise<void>;
  load(): Promise<Array<Message>>;
}