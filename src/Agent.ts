import axios from 'axios';
import { LLMType } from './type';
interface AgentConfig {
  prompt: string;
  llm: LLMType;
  public_desc: string;
  llm_endpoint?: string;
  llm_api_key?: string;
}

class Agent {
  private prompt: string;
  private llm: LLMType;
  private public_desc: string;
  private llm_endpoint?: string;
  private llm_api_key?: string;
  constructor(config: AgentConfig) {
    this.prompt = config.prompt;
    this.llm = config.llm;
    this.public_desc = config.public_desc;
    this.llm_endpoint = config.llm_endpoint;
    this.llm_api_key = config.llm_api_key;
  }

  public getPrompt() {
    return this.prompt;
  }

  public getLlm() {
    return this.llm;
  }

  public getPublicDesc() {
    return this.public_desc;
  }

  public async runPrompt(input: string): Promise<string> {
    const chatCompletion = await axios.post(this.llm_endpoint!,{
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
        "api-key":  `${this.llm_api_key}`
      }
    }
  )
    return chatCompletion.data.choices[0].message.content || "";
  }
  
}

export default Agent;
