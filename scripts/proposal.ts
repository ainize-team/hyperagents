import dotenv from "dotenv";
import Agent from "../src/agent/Agent";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import fs from "fs";
import { PrivateKeyType } from "../src/type";
dotenv.config();

const PROPOSAL_VOTE_PROMPT = `
Read the proposal carefully.
You should choose one of the following options:
1. Agree
2. Disagree
3. Abstain
Provide your short reason on whether you agree or disagree.
Your response must include either texts:
'%function_call(vote, proposalId, true)%' if you agree.
'%function_call(vote, proposalId, false)%' if you disagree or abstain.
There is no giveup.
Replace proposalId with the actual proposal ID.

Proposal
^USER_INPUT^
`;
// 1. 요청받은 내용에 대해 조사하는 Researcher:
const researcher = Agent.fromConfigFile("researcher.json", {
  llmApiKey: process.env.GOOGLE_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.RESEARCHER_ETH_PRIVATE_KEY!],
  ]),
});

const reviewer = Agent.fromConfigFile("reviewer.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.REVIEWER_ETH_PRIVATE_KEY!],
  ]),
});

const reporter = Agent.fromConfigFile("reporter.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.REPORTER_ETH_PRIVATE_KEY!],
  ]),
});

const director = Agent.fromConfigFile("director.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.DIRECTOR_ETH_PRIVATE_KEY!],
  ]),
});

const publisher = Agent.fromConfigFile("publisher.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.PUBLISHER_ETH_PRIVATE_KEY!],
    [PrivateKeyType.AIN, process.env.PUBLISHER_AIN_PRIVATE_KEY!],
  ]),
});

const graph = new Graph();
graph.addAgentNode({ agent: researcher, nodeId: "researcher" });
graph.addAgentNode({ agent: reporter, nodeId: "reporter" });
graph.addAgentNode({ agent: reviewer, nodeId: "reviewer" });
graph.addAgentNode({ agent: director, nodeId: "director" });
graph.addAgentNode({ agent: publisher, nodeId: "publisher" });

graph.addEdge({
  from: "researcher",
  to: "reporter",
  prompt: PROPOSAL_VOTE_PROMPT,
  memoryId: "researcher-reporter",
});
graph.addEdge({
  from: "reporter",
  to: "reviewer",
  prompt: PROPOSAL_VOTE_PROMPT,
  memoryId: "reporter-reviewer",
});
graph.addEdge({
  from: "reviewer",
  to: "director",
  prompt: PROPOSAL_VOTE_PROMPT,
  memoryId: "reviewer-director",
});
graph.addEdge({
  from: "director",
  to: "publisher",
  prompt: PROPOSAL_VOTE_PROMPT,
  memoryId: "director-publisher",
});

graph.setEntryPoint("researcher", PROPOSAL_VOTE_PROMPT);

const graphTask = new GraphTask(graph, InMemoryMemory.getInstance());

graphTask
  .runTask(
    `ProposalId: 1
  Proposal: The CEO of Bybit has donated 1B$ to etherdenver. Write a news article praising this action.`
  )
  .then((result) => {
    // console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });
