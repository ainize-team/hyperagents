import axios from "axios";
import { LLMType, MemoryType, AgentConfigs as AgentConfigs } from "./type";
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
  private memoryId: string;
  private llmClient: ILLMClient;

  constructor(config: AgentConfigs) {
    this.prompt = config.systemPrompt;
    this.llm = config.llm;
    this.publicDesc = config.publicDesc;
    this.llmEndpoint = config.llmEndpoint;
    this.llmApiKey = config.llmApiKey;
    this.memoryType = config.memoryType;
    this.memoryId = config.memoryId;
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

  public async runPrompt(input: string): Promise<string> {
    const chatCompletion = await axios.post(
      this.llmEndpoint!,
      {
        model: "gpt-4o-2024-05-13",
        messages: [
          {
            role: "system",
            content: this.prompt,
          },
          {
            role: "user",
            content: input,
          },
        ],
      },
      {
        headers: {
          "api-key": `${this.llmApiKey}`,
        },
      }
    );

    return chatCompletion.data.choices[0].message.content || "";
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
