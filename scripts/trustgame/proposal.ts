import dotenv from "dotenv";
import Agent from "../src/agent/Agent";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import { PrivateKeyType } from "../src/type";
dotenv.config();

const PROPOSAL_VOTE_PROMPT = `
starts your response with 'ProposalId:proposalId' and replace proposalId with the actual proposal ID.
Read the proposal carefully.
You should choose one of the following options:
1. Agree
2. Disagree
3. Abstain
Provide your short reason on whether you agree or disagree.
Your response must include either texts:
end response with 'I Agree.' if you agree.
There is no giveup

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
  llmApiKey: process.env.ORA_API_KEY!,
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

graph.addAgentNode({ agent: researcher, nodeId: "researcher"});
graph.addAgentNode({ agent: reporter, nodeId: "reporter" });
graph.addAgentNode({ agent: reviewer, nodeId: "reviewer" });
graph.addAgentNode({ agent: director, nodeId: "director" });
graph.addAgentNode({ agent: publisher, nodeId: "publisher" });

graph.setEntryPoint("researcher", PROPOSAL_VOTE_PROMPT, "researcher-vote", ["vote"]);
graph.setEntryPoint("publisher", PROPOSAL_VOTE_PROMPT, "publisher-vote", ["vote"]);
graph.setEntryPoint("director", PROPOSAL_VOTE_PROMPT, "director-vote", ["vote"]);
graph.setEntryPoint("reviewer", PROPOSAL_VOTE_PROMPT, "reviewer-vote", ["vote"]);
graph.setEntryPoint("reporter", PROPOSAL_VOTE_PROMPT, "reporter-vote", ["vote"]);


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
