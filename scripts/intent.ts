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

const foodie = await Agent.fromConfigFile("Foodie.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const artie = await Agent.fromConfigFile("Artie.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const graph = new Graph();

graph.addAgentNode({ agent: intentManager, nodeId: "intent_manager" });
graph.addAgentNode({
  agent: foodie,
  nodeId: "foodie taxi",
});
graph.addAgentNode({
  agent: artie,
  nodeId: "artie travel",
});

graph.setEntryPoint("intent_manager", `^USER_INPUT^`, "intent_manager");

graph.addEdge({
  from: "intent_manager",
  to: "foodie taxi",
  prompt: `^USER_INPUT^`,
});

graph.addEdge({
  from: "intent_manager",
  to: "artie travel",
  prompt: `^USER_INPUT^`,
});

const task = new GraphTask(graph, InMemoryMemory.getInstance());
task
  .runTask("Can you recommend some good places to visit in Seoul?") // I want to hail a taxi
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
