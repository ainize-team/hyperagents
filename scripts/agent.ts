import Agent from "../src/Agent";
import Graph from "../src/Graph";
import { LLMType, MemoryType } from "../src/type";
import InMemoryMemory from "../src/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import dotenv from "dotenv";
dotenv.config();

const MEMORY_ID = "inmemory-1";


const max = new Agent({
  prompt: "You are a max agent. you are a writer",
  llm: LLMType.gpt4o,
  publicDesc: "Write a first draft of an article.",
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY,
  memoryType: MemoryType.inMemory,
  memoryId: MEMORY_ID,
});

const victoria = new Agent({
  prompt: "You are a victoria agnet. you are a reviewer.",
  llm: LLMType.gpt4o,
  publicDesc: "review and give feedback of the article.",
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY,
  memoryType: MemoryType.inMemory,
  memoryId: MEMORY_ID,
});

const graph = new Graph();

graph.addAgentNode({agent: max, name: "max"});
graph.addAgentNode({agent: victoria, name: "victoria"});

graph.addEdge({from: "max", to: "victoria", prompt: "max write a first draft of an article."});

const edges = graph.getEdges("max");

const memory = new InMemoryMemory();

const task = new GraphTask(graph);



// agent.runPrompt("What is the capital of the moon?").then((result) => {
//   console.log(result);
// });
