import { LLMType, MemoryType} from "../type";
import InMemoryMemory from "../memory/InMemoryMemory";
import { ILLMClient } from "../llm/ILLMClient";
import { GoogleLLMClient } from "../llm/GoogleLLMClient";
import { AzureLLMClient } from "../llm/AzureLLMClient";
import { AgentConfigs, loadAgentConfig } from "./AgentConfig";
import { Memory } from "../memory";
class Agent {
  private name: string;
  private systemPrompt: string;
  private llm: LLMType;
  private publicDesc: string;
  private llmEndpoint?: string;
  private llmApiKey?: string;
  private memoryType: MemoryType;
  private memory: Memory;
  private llmClient: ILLMClient;
  constructor(config: AgentConfigs) {
    this.name = config.name;
    this.systemPrompt = config.systemPrompt;
    this.llm = config.llm;
    this.publicDesc = config.publicDesc;
    this.llmEndpoint = config.llmEndpoint;
    this.llmApiKey = config.llmApiKey;
    this.memoryType = config.memoryType;
    if (this.memoryType === MemoryType.inMemory) {
      this.memory = InMemoryMemory.getInstance();
    } else {
      throw new Error("Memory type not supported");
    }
    this.llmClient = this.createLLMClient();
  }

  static fromConfigFile(configPath: string, overrides?: Partial<AgentConfigs>): Agent {
    const config = loadAgentConfig(configPath);
    return new Agent({
      ...config,
      ...overrides
    });
  }

  public getName() {
    return this.name;
  }

  public getSystemPrompt() {
    return this.systemPrompt;
  }

  public getLlm() {
    return this.llm;
  }

  public getPublicDesc() {
    return this.publicDesc;
  }

  public async run(input: string): Promise<string> {
    const messages = await this.memory.load();
    const lastTenMessages = messages.slice(-10);
    const prompt =
      lastTenMessages.map((msg) => msg.content).join("\n") + "\n" + input;
    const output = await this.executeLLM(prompt);
    this.memory.add({
      author: this.name,
      content: output,
    });
    console.log("########################");
    console.log(this.name);
    console.log("Last 10 messages:");
    lastTenMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.author}: ${msg.content}`);
    });
    console.log("Output:", output);
    return output;
  }

  private createLLMClient(): ILLMClient {
    switch (this.llm) {
      case LLMType.GEMINI_1_5_FLASH:
        if (!this.llmApiKey)
          throw new Error("API key is required for Google LLM");
        return new GoogleLLMClient(
          this.llmApiKey,
          this.llm
        );
      case LLMType.gpt4o:
        if (!this.llmEndpoint || !this.llmApiKey) {
          throw new Error("Endpoint and API key are required for Azure LLM");
        }
        return new AzureLLMClient(
          this.llmEndpoint,
          this.llmApiKey
        );
      default:
        throw new Error("Unsupported LLM type");
    }
  }

  async executeLLM(input: string): Promise<string> {
    // 예시: 입력을 기반으로 LLM 호출
    return await this.llmClient.generateContent(this.systemPrompt,input);
  }
}

export default Agent;
