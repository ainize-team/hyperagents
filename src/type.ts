export enum LLMType {
  gpt4o = "gpt-4o",
  gpt4oMini = "gpt-4o-mini",
  GOOGLE = "GOOGLE",
  GEMINI_1_5_FLASH = "gemini-1.5-flash",
}
export enum MemoryType {
  inMemory = "InMemory",
}

export interface Message {
  id: string;
  timestamp?: number;
  author: string;
  content: string;
}

export function getEnumKeyByValue<T extends { [key: string]: string | number }>(
  enumObj: T,
  value: string | number
): keyof T | undefined {
  return Object.keys(enumObj).find(
    key => enumObj[key] === value
  ) as keyof T | undefined;
}