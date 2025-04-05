import dotenv from "dotenv";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import fs from "fs";
import IntentManagerAgent from "../src/agent/IntentManagerAgent";
import Agent from "../src/agent/Agent";
dotenv.config();

// 1. intent manager
const intentManager = IntentManagerAgent.fromConfigFile("IntentManager.json", {
  embeddingApiKey: process.env.AZURE_OPENAI_EMBEDDING_API_KEY!,
  embeddingEndpoint: process.env.AZURE_OPENAI_EMBEDDING_BASE_URL!,
  embeddingApiVersion: process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!,
  embeddingDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!,
});

const foodie = Agent.fromConfigFile("Foodie.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const graph = new Graph();

graph.addAgentNode({ agent: intentManager, nodeId: "intent_manager" });
graph.addAgentNode({
  agent: foodie,
  nodeId: "foodie",
});

graph.setEntryPoint("intent_manager", `^USER_INPUT^`, "foodie");

graph.addEdge({
  from: "intent_manager",
  to: "foodie",
  prompt: `Answer the user's question based on the following information:
    - Recommend 3 places to visit
    - End the sentence with a polite tone
    User Question: ^USER_INPUT^`,
});

const task = new GraphTask(graph, InMemoryMemory.getInstance());
task
  .runTask(
    "체크인 하기 전에 밥 먹으려고 하는데 워커힐 호텔 근처에 가볼만한 곳 추천해줘"
  ) // I want to hail a taxi
  .then((result) => {
    return task.exportMemory();
  })
  .then((result) => {
    fs.writeFileSync("conversation.html", result);
    console.log("Conversation has been saved to conversation.html file.");
  })
  .catch((error) => {
    console.error("Error occurred:", error);
  });
