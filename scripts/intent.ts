import dotenv from "dotenv";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import fs from "fs";
import IntentManagerAgent from "../src/agent/IntentManagerAgent";

dotenv.config();

// 1. intent manager
const intentManager = IntentManagerAgent.fromConfigFile("IntentManager.json", {
  embeddingApiKey: process.env.AZURE_OPENAI_EMBEDDING_API_KEY!,
  embeddingEndpoint: process.env.AZURE_OPENAI_EMBEDDING_BASE_URL!,
  embeddingApiVersion: process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!,
  embeddingDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!,
});

const graph = new Graph();

graph.addAgentNode({ agent: intentManager, nodeId: "intent_manager" });
graph.addAgentNode({ agent: intentManager, nodeId: "intent_manager_2" });

graph.setEntryPoint("intent_manager", `^USER_INPUT^`, "intent");

graph.addEdge({
  from: "intent_manager",
  to: "intent_manager_2",
  prompt: `^USER_INPUT^`,
});

const task = new GraphTask(graph, InMemoryMemory.getInstance());
task
  .runTask("Please allocate the USDC to the participants.")
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
