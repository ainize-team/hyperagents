import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Agent from "./Agent";
import { ClaudeLLMClient } from "../llm/ClaudeLLMClient";
import { Tool } from "@anthropic-ai/sdk/resources";
import path from "path";
import fs from "fs/promises";
import { getEnumKeyByValue, LLMType, MemoryType, PrivateKeyType } from "../type";
import { AgentConfigs } from "./AgentConfig";

export function isAgentConfigs(obj: unknown): obj is McpAgentConfigs {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    "systemPrompt" in obj &&
    "llm" in obj &&
    "publicDesc" in obj &&
    "memoryType" in obj &&
    "validIntents" in obj &&
    "serverScriptPath" in obj
  );
}

export async function loadAgentConfig(fileName: string): Promise<McpAgentConfigs> {
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

interface McpAgentConfigs extends AgentConfigs {
  serverScriptPath: string;
}

export class McpAgent extends Agent {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  private constructor(config: McpAgentConfigs) {
    super(config);
    this.mcp = new Client({ name: "mcp-agent", version: "1.0.0" });
  }

  static async fromConfigFile(
    configPath: string,
    overrides?: Partial<McpAgentConfigs>,
  ): Promise<McpAgent> {
    const config = await loadAgentConfig(configPath);
    const agent = new McpAgent({ ...config, ...overrides });
    await agent.connectToServer(config.serverScriptPath);
    return agent;
  }

  public async connectToServer(serverScriptPath: string) {
    try {
      const isJs = serverScriptPath.endsWith(".js");
      const isPy = serverScriptPath.endsWith(".py");
      if (!isJs && !isPy) {
        throw new Error("Server script must be a .js or .py file");
      }
      const command = isPy
        ? process.platform === "win32"
          ? "python"
          : "python3"
        : process.execPath;

      this.transport = new StdioClientTransport({
        command,
        args: [serverScriptPath],
      });
      this.mcp.connect(this.transport);

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));
      console.log(
        "Connected to server with tools:",
        this.tools.map(({ name }) => name),
      );
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  protected async executeLLM(input: string): Promise<string> {
    if (!this.llmClient) {
      throw new Error("LLM client is not initialized");
    }
    if (this.llmClient instanceof ClaudeLLMClient) {
      return this.llmClient.generateContentWithMcp(this.systemPrompt, input, this.mcp, this.tools);
    }
    return this.llmClient.generateContent(this.systemPrompt, input);
  }

  public async run(input: string, resultMemoryId?: string, functions?: string[]): Promise<string> {
    const messages = await this.memory.loadMap();
    const processedInput = input.replace(/\^(.*?)\^/g, (_, memoryId) => {
      const memoryData = messages.get(memoryId);
      return memoryData?.content || memoryId;
    });

    console.log("\n--------- AGENT INFO ---------");
    console.log("### Agent: ", this.name);

    const output = await this.executeLLM(processedInput);
    console.log("\n--------- AGENT OUTPUT ---------");
    console.log(output);
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

  async cleanup() {
    await this.mcp.close();
  }
}
