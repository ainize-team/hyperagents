// AzureLLMClient.ts
import axios from "axios";
import { ILLMClient } from "./ILLMClient";

export class AzureLLMClient implements ILLMClient {
  private llmEndpoint: string;
  private llmApiKey: string;
  private model: string;

  constructor(
    llmEndpoint: string,
    llmApiKey: string,
    model: string = "gpt-4o-2024-05-13"
  ) {
    this.llmEndpoint = llmEndpoint;
    this.llmApiKey = llmApiKey;
    this.model = model;
  }

  async generateContent(systemPrompt: string, prompt: string): Promise<string> {
    const response = await axios.post(
      this.llmEndpoint,
      {
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          "api-key": this.llmApiKey,
        },
      }
    );
    return response.data.choices?.[0]?.message?.content || "";
  }
}
