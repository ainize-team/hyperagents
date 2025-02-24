import Agent from "../src/agent";
import Graph from "../src/graph";
import { LLMType } from "../src/type";
import dotenv from "dotenv";
dotenv.config();


const max = new Agent({
  prompt: "You are a max agent. you are a writer",
  llm: LLMType.gpt4o,
  public_desc: "Write a first draft of an article.",
  llm_endpoint: process.env.OPENAI_BASE_URL,
  llm_api_key: process.env.OPENAI_API_KEY,
});

const victoria = new Agent({
  prompt: "You are a victoria agnet. you are a reviewer.",
  llm: LLMType.gpt4o,
  public_desc: "review and give feedback of the article.",
  llm_endpoint: process.env.OPENAI_BASE_URL,
  llm_api_key: process.env.OPENAI_API_KEY,
});

const graph = new Graph();





// agent.runPrompt("What is the capital of the moon?").then((result) => {
//   console.log(result);
// });
