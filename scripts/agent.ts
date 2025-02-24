import Agent from "../src/Agent";
import Graph from "../src/Graph";
import { LLMType, MemoryType } from "../src/type";
import InMemoryMemory from "../src/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import dotenv from "dotenv";
dotenv.config();

const max = new Agent({
  prompt: "You are a max agent. you are a writer",
  llm: LLMType.gpt4o,
  publicDesc: "Write a first draft of an article.",
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY,
  memoryType: MemoryType.inMemory,
});

const victoria = new Agent({
  prompt: "You are a victoria agnet. you are a reviewer.",
  llm: LLMType.gpt4o,
  publicDesc: "review and give feedback of the article.",
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY,
  memoryType: MemoryType.inMemory,
});

const graph = new Graph();

graph.addAgentNode({agent: max, name: "max"});
graph.addAgentNode({agent: victoria, name: "victoria"});

graph.addEdge({from: "max", to: "victoria", prompt: "please review the article and give feedback."});
graph.setEntryPoint("max", "write a first draft of an article.");

const task = new GraphTask(graph, InMemoryMemory.getInstance());

task.runTask("write a article about dogecoin.");


// agent.runPrompt("What is the capital of the moon?").then((result) => {
//   console.log(result);
// });
