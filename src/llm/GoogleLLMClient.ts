// GoogleLLMClient.ts
import { ILLMClient } from "./ILLMClient";
import {
  DynamicRetrievalMode,
  GoogleGenerativeAI,
} from "@google/generative-ai";

export class GoogleLLMClient implements ILLMClient {
  private apiKey: string;
  private modelName: string;

  constructor(
    apiKey: string,
    modelName: string = "gemini-1.5-flash",
  ) {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  async generateContent(systemPrompt: string, prompt: string): Promise<string> {
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
    const result = await model.generateContent(systemPrompt + prompt);
    return result.response.text();
  }
}
