import axios from 'axios';
import { LLMType, MemoryType } from './type';
interface AgentConfig {
  prompt: string;
  llm: LLMType;
  publicDesc: string;
  llmEndpoint?: string;
  llmApiKey?: string;
  memoryType: MemoryType;
  memoryId: string;
}

class Agent {
  private prompt: string;
  private llm: LLMType;
  private publicDesc: string;
  private llmEndpoint?: string;
  private llmApiKey?: string;
  private memoryType: MemoryType;
  private memoryId: string;
  constructor(config: AgentConfig) {
    this.prompt = config.prompt;
    this.llm = config.llm;
    this.publicDesc = config.publicDesc;
    this.llmEndpoint = config.llmEndpoint;
    this.llmApiKey = config.llmApiKey;
    this.memoryType = config.memoryType;
    this.memoryId = config.memoryId;
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

    const chatCompletion = await axios.post(this.llmEndpoint!,{
      "model": "gpt-4o-2024-05-13",
      "messages": [{
        "role": "system",
        "content": this.prompt
      },
      {
        "role": "user",
        "content": input
      }
    ]
    },
    {
      headers: {
        "api-key":  `${this.llmApiKey}`
      }
    }
  )
  
    return chatCompletion.data.choices[0].message.content || "";
  }
  
}

export default Agent;
