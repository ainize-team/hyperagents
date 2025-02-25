// OraLLMClient.ts
import axios from "axios";
import { ILLMClient } from "./ILLMClient";

export class OraLLMClient implements ILLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "deepseek-ai/DeepSeek-V3") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateContent(systemPrompt: string, prompt: string): Promise<string> {
    const response = await axios.post(
      "https://api.ora.io/v1/chat/completions",
      {
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices?.[0]?.message?.content || "";
  }
}
