import { getEnumKeyByValue, LLMType, MemoryType } from "../type";
import fs from 'fs';
import path from 'path';

export interface AgentConfigs {
  name: string;
  systemPrompt: string;
  llm: LLMType;
  publicDesc: string;
  llmApiKey?: string;
  llmEndpoint?: string;
  memoryType: MemoryType;
}

export function isAgentConfigs(obj: unknown): obj is AgentConfigs {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'systemPrompt' in obj &&
    'llm' in obj &&
    'publicDesc' in obj &&
    'memoryType' in obj
  );
}

export function loadAgentConfig(fileName: string): AgentConfigs {
  const filePath = path.join(__dirname, '../../agentConfigs', fileName);
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(rawData);
    
    if (config.memoryType) {
      const memoryTypeKey = getEnumKeyByValue(MemoryType, config.memoryType);
      if (memoryTypeKey) {
        config.memoryType = MemoryType[memoryTypeKey];
      } else {
        throw new Error(`Invalid memory type: ${config.memoryType}`);
      }
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