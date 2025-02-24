// GoogleLLMClient.ts
import { ILLMClient } from "./ILLMClient";
import {
  DynamicRetrievalMode,
  GoogleGenerativeAI,
} from "@google/generative-ai";

export class GoogleLLMClient implements ILLMClient {
  private apiKey: string;
  private modelName: string;
  private systemPrompt: string;

  constructor(
    apiKey: string,
    modelName: string = "gemini-1.5-flash",
    systemPrompt: string
  ) {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.systemPrompt = systemPrompt;
  }

  async generateContent(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel(
      {
        model: `models/${this.modelName}`,
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: DynamicRetrievalMode.MODE_DYNAMIC,
                dynamicThreshold: 0.3,
              },
            },
          },
        ],
      },
      { apiVersion: "v1beta" }
    );
    const result = await model.generateContent(this.systemPrompt + prompt);
    console.log(
      "Grounding metadata:",
      result.response.candidates?.[0]?.groundingMetadata
    );
    return result.response.text();
  }
}
