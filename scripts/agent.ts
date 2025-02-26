import Agent from "../src/agent/Agent";
import Graph from "../src/Graph";
import { LLMType, MemoryType } from "../src/type";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import dotenv from "dotenv";
dotenv.config();

// 1. 요청받은 내용에 대해 조사하는 Researcher: DATA DOG
const dataDog = Agent.fromConfigFile("dataDog.json", {
  llmApiKey: process.env.GOOGLE_API_KEY!
});

// 2. 프로젝트 자체 + 최신 이슈를 분석하는 Researcher: GOSSIP FOX
const gossipFox = Agent.fromConfigFile("gossipFox.json", {
  llmApiKey: process.env.GOOGLE_API_KEY!,
});

// 3. 강력하게 비판하는 비판가: FUD BEAR
const fudBear = Agent.fromConfigFile("fudBear.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

// 4. 극찬하는 긍정맨: MOON BULL
const moonBull = Agent.fromConfigFile("moonBull.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

// 5. 종합하여 기사를 쓰고 매수/매도 결정을 하는 기자: SIGNAL SHARK
const signalShark = Agent.fromConfigFile("signalShark.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

// 6. 더 흥미롭게 내용을 다듬고, 첨삭을 해서 최종 기사를 내는 에디터: STORY OCTOPUS
const storyOctopus = Agent.fromConfigFile("storyOctopus.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

// 7. HTML 퍼블리싱하는 퍼블리셔: DEPLOY PANDA
const deployPanda = Agent.fromConfigFile("deployPanda.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const graph = new Graph();

// 각 Agent 노드를 그래프에 순차적으로 추가
graph.addAgentNode({ agent: dataDog, nodeId: "dataDog" });
graph.addAgentNode({ agent: gossipFox, nodeId: "gossipFox" });
graph.addAgentNode({ agent: fudBear, nodeId: "fudBear" });
graph.addAgentNode({ agent: moonBull, nodeId: "moonBull" });
graph.addAgentNode({ agent: signalShark, nodeId: "signalShark" });
graph.addAgentNode({ agent: storyOctopus, nodeId: "storyOctopus" });
graph.addAgentNode({ agent: deployPanda, nodeId: "deployPanda" });

// 순차적인 파이프라인 구축
graph.addEdge({
  from: "dataDog",
  to: "gossipFox",
  prompt:
    "Analyze both the project fundamentals and latest developments. Focus on:\n1. Core technology and infrastructure\n2. Recent updates and developments\n3. Market performance and metrics\n4. Community engagement and growth\n5. Partnerships and integrations\n6. Challenges and solutions\n7. Future roadmap and potential\nProvide a comprehensive analysis that combines both long-term fundamentals and current events.",
});
graph.addEdge({
  from: "gossipFox",
  to: "fudBear",
  prompt:
    "Combine the previous analysis and include recent news and issue insights.",
});
graph.addEdge({
  from: "fudBear",
  to: "moonBull",
  prompt:
    "Review the analysis and counterbalance with positive insights and strengths.",
});
graph.addEdge({
  from: "moonBull",
  to: "signalShark",
  prompt:
    "Synthesize all inputs to write a detailed article, including a clear buy/sell recommendation.",
});
graph.addEdge({
  from: "signalShark",
  to: "storyOctopus",
  prompt:
    "Transform the analysis into a captivating narrative that engages readers and delivers actionable insights.",
});
graph.addEdge({
  from: "storyOctopus",
  to: "deployPanda",
  prompt: "Convert the final article into HTML format for web publication.",
});

// 그래프의 시작점 설정 (예시: dataDog이 주제 분석을 시작)
graph.setEntryPoint(
  "dataDog",
  "Analyze the topic: write a detailed research report."
);

// 작업 실행
const task = new GraphTask(graph, InMemoryMemory.getInstance());

task
  .runTask("Write about the launch of Lido v3")
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

// "Analyze AIN(AI Network). 0x3A810ff7211b40c4fA76205a14efe161615d0385"

// "
// "Bybit ETH 해킹을 당했지만 열심히 잘 대응하고 있다.라는 내용으로 기사를 써줘"
// "Write about the launch of Lido v3"
// ""
