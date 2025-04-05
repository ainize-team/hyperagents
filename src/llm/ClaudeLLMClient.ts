import { Anthropic } from "@anthropic-ai/sdk";
import { ILLMClient } from "./ILLMClient";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { MessageParam, Tool } from "@anthropic-ai/sdk/resources";

export class ClaudeLLMClient implements ILLMClient {
  private llmApiKey: string;
  private model: string;
  private anthropic: Anthropic;

  constructor(llmApiKey: string, model: string = "claude-3-5-sonnet-20241022") {
    this.llmApiKey = llmApiKey;
    this.model = model;
    this.anthropic = new Anthropic({
      apiKey: this.llmApiKey,
    });
  }

  async generateContent(systemPrompt: string, prompt: string): Promise<string> {
    const messages = [
      { role: "user" as const, content: systemPrompt },
      { role: "user" as const, content: prompt },
    ];

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1000,
      messages,
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  async generateContentWithMcp(
    systemPrompt: string,
    prompt: string,
    mcp: Client,
    tools: Tool[]
  ): Promise<string> {
    const messages: MessageParam[] = [
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await this.anthropic.messages.create({
      system: systemPrompt,
      model: this.model,
      max_tokens: 1000,
      messages,
      tools: tools,
    });
    console.log("response.content", response.content);
    const finalText = [];
    const toolResults = [];

    for (const content of response.content) {
      if (content.type === "text") {
        finalText.push(content.text);
      } else if (content.type === "tool_use") {
        const toolName = content.name;
        const toolArgs = content.input as { [x: string]: unknown } | undefined;

        const result = await mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        });
        console.log("result", result);
        toolResults.push(result);
        finalText.push(
          `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
        );

        messages.push({
          role: "user",
          content: result.content as string,
        });

        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 1000,
          messages,
        });

        finalText.push(
          response.content[0].type === "text" ? response.content[0].text : ""
        );
      }
    }

    return finalText.join("\n");
  }
}
