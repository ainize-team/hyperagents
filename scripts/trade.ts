import dotenv from "dotenv";
import Agent from "../src/agent/Agent";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import fs from "fs";
import { PrivateKeyType } from "../src/type";
dotenv.config();

// 1. 요청받은 내용에 대해 조사하는 Researcher:
const researcher = Agent.fromConfigFile("researcher.json", {
  llmApiKey: process.env.GOOGLE_API_KEY!,
});

const reporter = Agent.fromConfigFile("reporter.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.CDPNAME, process.env.REPORTER_CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.REPORTER_CDPKEY!],
  ]),
});

const graph = new Graph();

graph.addAgentNode({ agent: researcher, nodeId: "researcher-1" });
graph.addAgentNode({ agent: reporter, nodeId: "reporter-1" });

graph.addEdge({
  from: "researcher-1",
  to: "reporter-1",
  prompt: `Based on the market research report provided below, Analyze the current market situation and make your own investment decision.
Decide whether to invest $1 worth of USDC into the reported asset.

Provide a brief explanation for your investment decision.

Your response should start with like this:
'Alright, I'll convert my 1 USDC to ETH.'

or if you would not invest, explain why.

<Market Research>
^MARKET_RESEARCH^
`,
  memoryId: "TRADE",
  functions: ["trade"],
});

// 그래프의 시작점 설정 (예시: dataDog이 주제 분석을 시작)
graph.setEntryPoint(
  "researcher-1",
  `Find relevant materials and include the content of <Materials> in your report to the Reviewer.

<Materials>
^USER_INPUT^
`,
  "MARKET_RESEARCH"
);

const task = new GraphTask(graph, InMemoryMemory.getInstance());

task
  .runTask("Please write a news article about Ethereum ETH")
  .then((result) => {
    fs.writeFileSync("result.html", result);
    return task.exportMemory();
  })
  .then((result) => {
    fs.writeFileSync("conversation.md", result);
    console.log("대화 내용이 conversation.md 파일로 저장되었습니다.");
  })
  .catch((error) => {
    console.error("오류 발생:", error);
  });
