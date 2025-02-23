import Agent from "../src/hyperagents";
import { LLMType } from "../src/type";
import dotenv from "dotenv";
dotenv.config();


const agent = new Agent({
  prompt: "You are a helpful assistant.",
  llm: LLMType.gpt4o,
  public_desc: "You are a helpful assistant.",
  llm_endpoint: process.env.OPENAI_BASE_URL,
  llm_api_key: process.env.OPENAI_API_KEY,
});

agent.runPrompt("What is the capital of the moon?").then((result) => {
  console.log(result);
});
