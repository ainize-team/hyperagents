import dotenv from "dotenv";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import fs from "fs";
import { McpAgent } from "../src/agent/McpAgent";
dotenv.config();

async function main() {
  const mcp = await McpAgent.fromConfigFile("Mcp.json", {
    llmApiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const graph = new Graph();

  graph.addAgentNode({
    agent: mcp,
    nodeId: "mcp",
  });

  graph.setEntryPoint("mcp", `^USER_INPUT^`, "mcp");

  const task = new GraphTask(graph, InMemoryMemory.getInstance());
  try {
    const result = await task.runTask("get weather alert for CA");
    const memoryResult = await task.exportMemory();
    fs.writeFileSync("conversation.html", memoryResult);
    console.log("Conversation has been saved to conversation.html file.");
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

// 함수 실행
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
