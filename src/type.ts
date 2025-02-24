export enum LLMType {
  gpt4o = "gpt-4o",
  gpt4oMini = "gpt-4o-mini",
}
export enum MemoryType {
  inMemory = "InMemory",
}
export interface Memory {
  init(): Promise<void>;
  add(data:string): Promise<void>;
  load(): Promise<Array<string>>;
}