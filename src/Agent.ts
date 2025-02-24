import axios from 'axios';
import { LLMType, Memory, MemoryType, AgentConfigs } from './type';
import InMemoryMemory from './InMemoryMemory';
import { ILLMClient } from "./llm/ILLMClient";
import { GoogleLLMClient } from "./llm/GoogleLLMClient";
import { AzureLLMClient } from "./llm/AzureLLMClient";

class Agent {
  private prompt: string;
  private llm: LLMType;
  private publicDesc: string;
  private llmEndpoint?: string;
  private llmApiKey?: string;
  private memoryType: MemoryType;
  private memory: Memory;
  private llmClient: ILLMClient;
  constructor(config: AgentConfigs) {
    this.prompt = config.systemPrompt;
    this.llm = config.llm;
    this.publicDesc = config.publicDesc;
    this.llmEndpoint = config.llmEndpoint;
    this.llmApiKey = config.llmApiKey;
    this.memoryType = config.memoryType;
    if (this.memoryType === MemoryType.inMemory) {
      this.memory = InMemoryMemory.getInstance();
    }else {
      throw new Error("Memory type not supported");
    }
    this.llmClient = this.createLLMClient(config);
  }

  public getPrompt() {
    return this.prompt;
  }

  public getLlm() {
    return this.llm;
  }

  public getPublicDesc() {
    return this.publicDesc;
  }
  

  public async run(input: string): Promise<string> {

    return "hi";
  }

  private createLLMClient(config: AgentConfigs): ILLMClient {
    switch (config.llm) {
      case LLMType.GEMINI_1_5_FLASH:
        if (!config.llmApiKey)
          throw new Error("API key is required for Google LLM");
        return new GoogleLLMClient(
          config.llmApiKey,
          config.llm,
          config.systemPrompt
        );
      case LLMType.gpt4o:
        if (!config.llmEndpoint || !config.llmApiKey) {
          throw new Error("Endpoint and API key are required for Azure LLM");
        }
        return new AzureLLMClient(
          config.llmEndpoint,
          config.llmApiKey,
          config.systemPrompt
        );
      default:
        throw new Error("Unsupported LLM type");
    }
  }

  async executeLLM(input: string): Promise<string> {
    // 예시: 입력을 기반으로 LLM 호출
    return await this.llmClient.generateContent(input);
  }
}

export default Agent;
