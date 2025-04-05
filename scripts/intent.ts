import dotenv from "dotenv";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import fs from "fs";
import IntentManagerAgent from "../src/agent/IntentManagerAgent";
import Agent from "../src/agent/Agent";
dotenv.config();

async function main() {
  // 1. intent manager
  const intentManager = await IntentManagerAgent.fromConfigFile(
    "IntentManager.json",
    {
      embeddingApiKey: process.env.AZURE_OPENAI_EMBEDDING_API_KEY!,
      embeddingEndpoint: process.env.AZURE_OPENAI_EMBEDDING_BASE_URL!,
      embeddingApiVersion: process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!,
      embeddingDeploymentName:
        process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!,
    }
  );

  const foodie = await Agent.fromConfigFile("Foodie.json", {
    llmEndpoint: process.env.OPENAI_BASE_URL!,
    llmApiKey: process.env.OPENAI_API_KEY!,
  });

  const artie = await Agent.fromConfigFile("Artie.json", {
    llmEndpoint: process.env.OPENAI_BASE_URL!,
    llmApiKey: process.env.OPENAI_API_KEY!,
  });

  const actors = await Agent.fromConfigFile("Actors.json", {
    llmEndpoint: process.env.OPENAI_BASE_URL!,
    llmApiKey: process.env.OPENAI_API_KEY!,
  });

  const muzie = await Agent.fromConfigFile("Muzie.json", {
    llmEndpoint: process.env.OPENAI_BASE_URL!,
    llmApiKey: process.env.OPENAI_API_KEY!,
  });

  const welly = await Agent.fromConfigFile("Welly.json", {
    llmEndpoint: process.env.OPENAI_BASE_URL!,
    llmApiKey: process.env.OPENAI_API_KEY!,
  });

  const graph = new Graph();

  graph.addAgentNode({ agent: intentManager, nodeId: "intent_manager" });
  graph.addAgentNode({ agent: foodie, nodeId: "foodie" });
  graph.addAgentNode({ agent: artie, nodeId: "artie" });
  graph.addAgentNode({ agent: actors, nodeId: "actors" });
  graph.addAgentNode({ agent: muzie, nodeId: "muzie" });
  graph.addAgentNode({ agent: welly, nodeId: "welly" });

  graph.setEntryPoint("intent_manager", `^USER_INPUT^`, "foodie");

  graph.addEdge({
    from: "intent_manager",
    to: "foodie",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
  });

  graph.addEdge({
    from: "intent_manager",
    to: "artie",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
  });

  graph.addEdge({
    from: "intent_manager",
    to: "actors",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
  });

  graph.addEdge({
    from: "intent_manager",
    to: "muzie",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
  });

  graph.addEdge({
    from: "intent_manager",
    to: "welly",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
  });

  const task = new GraphTask(graph, InMemoryMemory.getInstance());
  task
    .runTask(
      "체크인 하기전에 3시간 정도 시간이 뜨는데 근처에서 할만한거 추천해줘"
    ) // "체크인 하기 전에 밥 먹으려고 하는데 워커힐 호텔 근처에 가볼만한 곳 추천해줘"
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
}

main();
