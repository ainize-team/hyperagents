import dotenv from "dotenv";
import Agent from "../src/agent/Agent";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
dotenv.config();

// 1. 요청받은 내용에 대해 조사하는 Researcher:
const researcher  = Agent.fromConfigFile("researcher.json", {
  llmApiKey: process.env.GOOGLE_API_KEY!,
});

const reviewer = Agent.fromConfigFile("reviewer.json", {
  llmEndpoint: process.env.OPENAI_API_KEY!,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const reporter = Agent.fromConfigFile("reporter.json", {
  llmEndpoint: process.env.OPENAI_API_KEY!,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const director = Agent.fromConfigFile("director.json", {
  llmEndpoint: process.env.OPENAI_API_KEY!,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const publisher = Agent.fromConfigFile("publisher.json", {
  llmEndpoint: process.env.OPENAI_API_KEY!,
  llmApiKey: process.env.OPENAI_API_KEY!,
}); 

const graph = new Graph();

graph.addAgentNode({ agent: researcher, nodeId: "researcher-1" });
graph.addAgentNode({ agent: reviewer, nodeId: "reviewer-1" });
graph.addAgentNode({ agent: reporter, nodeId: "reporter-1" });
graph.addAgentNode({ agent: director, nodeId: "reviewer-2" });
graph.addAgentNode({ agent: reporter, nodeId: "reporter-2" });
graph.addAgentNode({ agent: director, nodeId: "director-1" });
graph.addAgentNode({ agent: publisher, nodeId: "publisher-1" });

graph.addEdge({
  from: "researcher-1",
  to: "reviewer-1",
  prompt: "기사 가이드를 제작해.",
});

graph.addEdge({
  from: "reviewer-1",
  to: "reporter-1",
  prompt: "기사 초안 작성.",
});

graph.addEdge({
  from: "reporter-1",
  to: "reviewer-2",
  prompt: "기사 초안 검수.",
});

graph.addEdge({
  from: "reviewer-2",
  to: "reporter-2",
  prompt: "기사 초안 수정.",
});

graph.addEdge({
  from: "reporter-2",
  to: "director-1",
  prompt: "기사 완성본 검수.",
});

graph.addEdge({
  from: "director-1",
  to: "publisher-1",
  prompt: "기사 발행.",
});
// 그래프의 시작점 설정 (예시: dataDog이 주제 분석을 시작)
graph.setEntryPoint(
  "researcher-1",
  "기사 작성에 필요한 정보를 수집해."
);

const task = new GraphTask(graph, InMemoryMemory.getInstance());

task
  .runTask("Write about the launch of Lido v3.")
  .then((result) => {
    console.log(result);
    return task.exportMemory();
  })
  .then((result) => {
    const fs = require("fs");
    fs.writeFileSync("conversation.md", result);
    console.log("대화 내용이 conversation.md 파일로 저장되었습니다.");
  })
  .catch((error) => {
    console.error("오류 발생:", error);
  });








