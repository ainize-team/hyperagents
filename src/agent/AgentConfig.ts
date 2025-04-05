import { getEnumKeyByValue, LLMType, MemoryType, PrivateKeyType } from "../type";
import fs from "fs/promises";
import path from "path";

export interface AgentConfigs {
  name: string;
  systemPrompt: string;
  llm: LLMType;
  publicDesc: string;
  llmApiKey?: string;
  llmEndpoint?: string;
  memoryType: MemoryType;
  privateKey?: Map<PrivateKeyType, string>;
  walletDataStr?: string;
}

export function isAgentConfigs(obj: unknown): obj is AgentConfigs {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    "systemPrompt" in obj &&
    "llm" in obj &&
    "publicDesc" in obj &&
    "memoryType" in obj
  );
}

export async function loadAgentConfig(fileName: string): Promise<AgentConfigs> {
  const filePath = path.join(__dirname, "../../agentConfigs", fileName);
  try {
    const rawData = await fs.readFile(filePath, "utf8");
    const config = JSON.parse(rawData);

    if (config.memoryType) {
      const memoryTypeKey = getEnumKeyByValue(MemoryType, config.memoryType);
      if (memoryTypeKey) {
        config.memoryType = MemoryType[memoryTypeKey];
      } else {
        throw new Error(`Invalid memory type: ${config.memoryType}`);
      }
    }
    if (config.privateKey) {
      const privateKey = new Map<PrivateKeyType, string>();
      for (const [key, value] of Object.entries(config.privateKey)) {
        const privateKeyTypeKey = getEnumKeyByValue(PrivateKeyType, key);
        if (privateKeyTypeKey) {
          privateKey.set(PrivateKeyType[privateKeyTypeKey], value as string);
        } else {
          throw new Error(`Invalid private key type: ${key}`);
        }
      }
      config.privateKey = privateKey;
    }

    if (config.llm) {
      const llmTypeKey = getEnumKeyByValue(LLMType, config.llm);
      if (llmTypeKey) {
        config.llm = LLMType[llmTypeKey];
      } else {
        throw new Error(`Invalid llm: ${config.llm}`);
      }
    }

    if (!isAgentConfigs(config)) {
      throw new Error(`Invalid configuration format in ${filePath}`);
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to load agent config from ${filePath}: ${error}`);
  }
}
