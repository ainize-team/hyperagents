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

graph.addAgentNode({agent: max, name: "max"});
graph.addAgentNode({agent: victoria, name: "victoria"});

graph.addEdge({from: "max", to: "victoria", prompt: "max write a first draft of an article.", bandwith: 1});

const edges = graph.getEdges("max");
console.log(edges);




// agent.runPrompt("What is the capital of the moon?").then((result) => {
//   console.log(result);
// });
