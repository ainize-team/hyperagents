export enum LLMType {
  GPT4O = "gpt-4o",
  GPT4OMINI = "gpt-4o-mini",
  GEMINI_1_5_FLASH = "gemini-1.5-flash",
  ORA_DEEPSEEK_V3 = "deepseek-ai/DeepSeek-V3",
}
export enum MemoryType {
  inMemory = "InMemory",
}

export enum PrivateKeyType {
  ETH = "ETH",
  AIN = "AIN",
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
  return Object.keys(enumObj).find((key) => enumObj[key] === value) as
    | keyof T
    | undefined;
}
