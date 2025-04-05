import { LLMType, MemoryType, PrivateKeyType } from "../type";
import InMemoryMemory from "../memory/InMemoryMemory";
import { ILLMClient } from "../llm/ILLMClient";
import { GoogleLLMClient } from "../llm/GoogleLLMClient";
import { AzureLLMClient } from "../llm/AzureLLMClient";
import { AgentConfigs, loadAgentConfig } from "./AgentConfig";
import { Memory } from "../memory";
import { OraLLMClient } from "../llm/OraLLMClient";
import { runCoinbaseAgentkitWithAzureOpenAI } from "../tools/coinbaseAgentkit";
import { getDHAOContract } from "../tools/contract.Signer";
import { extractArray, extractString } from "../tools/stringExtractor";
import { ClaudeLLMClient } from "../llm/ClaudeLLMClient";

class Agent {
  protected name: string;
  protected systemPrompt: string;
  protected llm: LLMType;
  protected publicDesc: string;
  protected llmEndpoint?: string;
  protected llmApiKey?: string;
  protected memoryType: MemoryType;
  protected privateKey?: Map<PrivateKeyType, string>;
  protected walletDataStr?: string;
  protected memory: Memory;
  protected llmClient: ILLMClient;

  constructor(config: AgentConfigs) {
    this.name = config.name;
    this.systemPrompt = config.systemPrompt;
    this.llm = config.llm;
    this.publicDesc = config.publicDesc;
    this.llmEndpoint = config.llmEndpoint;
    this.llmApiKey = config.llmApiKey;
    this.memoryType = config.memoryType;
    this.privateKey = config.privateKey;
    this.walletDataStr = config.walletDataStr;
    if (this.memoryType === MemoryType.inMemory) {
      this.memory = InMemoryMemory.getInstance();
    } else {
      throw new Error("Memory type not supported");
    }

    this.llmClient = this.createLLMClient();
  }

  static async fromConfigFile(
    configPath: string,
    overrides?: Partial<AgentConfigs>
  ): Promise<Agent> {
    const config = await loadAgentConfig(configPath);
    const mergedConfig = {
      ...config,
      ...overrides,
    };

    return new Agent(mergedConfig as AgentConfigs);
  }

  public getName(): string {
    return this.name;
  }

  public getSystemPrompt(): string {
    return this.systemPrompt;
  }

  public getLlm(): LLMType {
    return this.llm;
  }

  public getPublicDesc(): string {
    return this.publicDesc;
  }

  public async run(
    input: string,
    resultMemoryId?: string,
    functions?: string[]
  ): Promise<string> {
    const messages = await this.memory.loadMap();
    const processedInput = input.replace(/\^(.*?)\^/g, (_, memoryId) => {
      const memoryData = messages.get(memoryId);
      return memoryData?.content || memoryId;
    });

    const output = await this.executeLLM(processedInput);

    if (functions) {
      this.functionHandle(functions, output);
    }

    this.memory.add({
      id: resultMemoryId ?? `${this.name}-${Date.now()}`,
      timestamp: Date.now(),
      author: this.name,
      content: output,
    });

    return output;
  }

  private createLLMClient(): ILLMClient {
    switch (this.llm) {
      case LLMType.CLAUDE_3_5_SONNET:
        if (!this.llmApiKey) {
          throw new Error("API key is required for Claude LLM");
        }
        return new ClaudeLLMClient(this.llmApiKey, this.llm);

      case LLMType.GEMINI_1_5_FLASH:
        if (!this.llmApiKey) {
          throw new Error("API key is required for Google LLM");
        }
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

  protected async executeLLM(input: string): Promise<string> {
    return await this.llmClient.generateContent(this.systemPrompt, input);
  }

  protected functionHandle(functions: string[], output: string): void {
    for (const functionName of functions) {
      if (functionName === "vote") {
        this.vote(output);
      }
      if (functionName === "trade") {
        this.trade(output);
      }
      if (functionName === "create-trust-game") {
        this.createTrustGame(output);
      }
      if (functionName === "sign-payback") {
        this.signPayback(output);
      }
    }
  }

  private async vote(output: string): Promise<void> {
    try {
      const proposalId = extractString(output, "proposalId");
      const isAgree = output.trim().endsWith("I Agree.");
      if (!isAgree) {
        console.log(`**agent ${this.name} disagreed.`);
        return;
      }
      if (this.privateKey?.has(PrivateKeyType.ETH)) {
        const ethPrivateKey = this.privateKey.get(PrivateKeyType.ETH);
        const truncatedKey = ethPrivateKey?.slice(0, 6) + "...";
        console.log(
          `**agent ${this.name} voted proposal:${proposalId} with ethPrivateKey:${truncatedKey}`
        );
      }
    } catch (error) {
      console.error(`**agent ${this.name} failed to vote:`, error);
    }
  }

  private async trade(output: string): Promise<void> {
    console.log("trade result: ", output);
    if (this.llm !== LLMType.GPT4O && this.llm !== LLMType.GPT4OMINI) {
      return;
    }

    if (!this.llmApiKey) {
      return;
    }

    if (
      this.privateKey?.has(PrivateKeyType.CDPKEY) &&
      this.privateKey.has(PrivateKeyType.CDPNAME)
    ) {
      console.log("trade with cdp");
      const cdpApiKeyName = this.privateKey.get(PrivateKeyType.CDPNAME);
      const cdpApiKeyPrivateKey = this.privateKey.get(PrivateKeyType.CDPKEY);
      const walletDataStr = this.walletDataStr;

      const response = await runCoinbaseAgentkitWithAzureOpenAI({
        openaiApiKey: this.llmApiKey,
        cdpApiKeyName: cdpApiKeyName!,
        cdpApiKeyPrivateKey: cdpApiKeyPrivateKey!,
        walletDataStr: walletDataStr!,
        message: output,
      });

      console.log(`**trade response: ${response}}`);
    }
  }
  private async createTrustGame(output: string): Promise<void> {
    try {
      const privateKey = this.privateKey?.get(PrivateKeyType.ETH);
      if (!privateKey) {
        throw new Error("Private key is not set");
      }
      const contract = await getDHAOContract(privateKey);

      const proposalId = extractString(output, "proposalId");
      const contributors = extractArray(output, "contributors");
      const allocatedAmounts = extractArray(output, "allocatedAmounts");

      await (contract as any).createTrustGameByJobOwner(
        proposalId,
        contributors,
        allocatedAmounts
      );
      console.log(
        `**agent ${this.name} created trust game for proposal:${proposalId}`
      );
    } catch (error) {
      console.error(`**agent ${this.name} failed to create trust game:`, error);
    }
  }

  private async signPayback(output: string): Promise<void> {
    try {
      const privateKey = this.privateKey?.get(PrivateKeyType.ETH);
      if (!privateKey) {
        throw new Error("Private key is not set");
      }
      const contract = await getDHAOContract(privateKey);

      const proposalId = extractString(output, "proposalId");
      const paybackAmount = extractString(output, "payback");

      await (contract as any).paybackedByContributor(proposalId, paybackAmount);
      console.log(
        `**agent ${this.name} would sign payback:${paybackAmount} for proposal:${proposalId}`
      );
    } catch (error) {
      console.error(`**agent ${this.name} failed to sign payback:`, error);
    }
  }
}

export default Agent;
