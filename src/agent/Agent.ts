import { LLMType, MemoryType, PrivateKeyType } from "../type";
import InMemoryMemory from "../memory/InMemoryMemory";
import { ILLMClient } from "../llm/ILLMClient";
import { GoogleLLMClient } from "../llm/GoogleLLMClient";
import { AzureLLMClient } from "../llm/AzureLLMClient";
import { AgentConfigs, loadAgentConfig } from "./AgentConfig";
import { Memory } from "../memory";
import { OraLLMClient } from "../llm/OraLLMClient";
import { runCoinbaseAgentkitWithAzureOpenAI } from "../tools/coinbaseAgentkit";

class Agent {
  //
  private name: string;
  private systemPrompt: string;
  private llm: LLMType;
  private publicDesc: string;
  private llmEndpoint?: string;
  private llmApiKey?: string;
  private memoryType: MemoryType;
  private privateKey?: Map<PrivateKeyType, string>;
  // objects
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
    this.privateKey = config.privateKey;
    if (this.memoryType === MemoryType.inMemory) {
      this.memory = InMemoryMemory.getInstance();
    } else {
      throw new Error("Memory type not supported");
    }
    this.llmClient = this.createLLMClient();
  }

  static fromConfigFile(
    configPath: string,
    overrides?: Partial<AgentConfigs>
  ): Agent {
    const config = loadAgentConfig(configPath);
    return new Agent({
      ...config,
      ...overrides,
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

  public async run(input: string, resultMemoryId?: string): Promise<string> {
    const messages = await this.memory.loadMap();
    const processedInput = input.replace(/\^(.*?)\^/g, (_, memoryId) => {
      const memoryData = messages.get(memoryId);
      return memoryData?.content || memoryId;
    });
    console.log("########################");
    console.log(this.name);
    console.log("processedInput: ", processedInput);
    const output = await this.executeLLM(processedInput);
    const processedOutput = output.replace(
      /%function_call\((.*?)\)%/g,
      (_, functionCall) => {
        this.functionHandle(functionCall);
        return "";
      }
    );
    console.log("processedOutput: ", processedOutput);
    this.memory.add({
      id: resultMemoryId ? resultMemoryId : this.name + "-" + Date.now(),
      timestamp: Date.now(),
      author: this.name,
      content: processedOutput,
    });
    return processedOutput;
  }

  private createLLMClient(): ILLMClient {
    switch (this.llm) {
      case LLMType.GEMINI_1_5_FLASH:
        if (!this.llmApiKey)
          throw new Error("API key is required for Google LLM");
        return new GoogleLLMClient(this.llmApiKey, this.llm);
      case LLMType.GPT4O:
        if (!this.llmEndpoint || !this.llmApiKey) {
          throw new Error("Endpoint and API key are required for Azure LLM");
        }
        return new AzureLLMClient(this.llmEndpoint, this.llmApiKey);
      case LLMType.ORA_DEEPSEEK_V3:
        if (!this.llmApiKey) {
          throw new Error("API key is required for Ora LLM");
        }
        return new OraLLMClient(this.llmApiKey, this.llm);
      default:
        throw new Error("Unsupported LLM type");
    }
  }

  async executeLLM(input: string): Promise<string> {
    // 예시: 입력을 기반으로 LLM 호출
    return await this.llmClient.generateContent(this.systemPrompt, input);
  }
  private functionHandle(functionCall: string): void {
    const functionCallArgs = functionCall.split(",").map((arg) => arg.trim());
    if (functionCallArgs[0] === "vote") {
      if (functionCallArgs.length === 3) {
        this.vote(functionCallArgs[1], functionCallArgs[2]);
      } else {
        throw new Error("Invalid function arguments");
      }
    }
    if (functionCallArgs[0] === "trade") {
      if (functionCallArgs.length === 4) {
        this.trade(
          functionCallArgs[1],
          functionCallArgs[2],
          functionCallArgs[3]
        );
      } else {
        throw new Error("Invalid function arguments");
      }
    }
  }
  private async vote(proposalId: string, result: string): Promise<void> {
    if (this.privateKey && this.privateKey.has(PrivateKeyType.ETH)) {
      const ethPrivateKey = this.privateKey.get(PrivateKeyType.ETH);
      console.log(
        `**agent ${
          this.name
        } voted proposal:${proposalId} ${result} with ethPrivateKey:${
          ethPrivateKey?.slice(0, 6) + "..."
        } `
      );
    }
  }
  private async trade(from: string, to: string, amount: string): Promise<void> {
    if (this.llm !== LLMType.GPT4O && this.llm !== LLMType.GPT4OMINI) {
      return;
    }
    if (!this.llmApiKey) {
      return;
    }
    if (
      this.privateKey &&
      this.privateKey.has(PrivateKeyType.CDPKEY) &&
      this.privateKey.has(PrivateKeyType.CDPNAME)
    ) {
      const cdpApiKeyName = this.privateKey.get(PrivateKeyType.CDPNAME);
      const cdpApiKeyPrivateKey = this.privateKey.get(PrivateKeyType.CDPKEY);
      const responses = await runCoinbaseAgentkitWithAzureOpenAI({
        openaiApiKey: this.llmApiKey!,
        cdpApiKeyName: cdpApiKeyName!,
        cdpApiKeyPrivateKey: cdpApiKeyPrivateKey!,
        message: `transfer ${amount} worth of  ${from} to ${to}`,
      });
      console.log(
        `**agent ${this.name} traded ${amount} from ${from} to ${to}`
      );
    }
  }
}

export default Agent;
