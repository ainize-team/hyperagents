import Agent from "../src/agent/Agent";
import Graph from "../src/Graph";
import GraphTask from "../src/GraphTask";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import { PrivateKeyType } from "../src/type";

const reviewer = Agent.fromConfigFile("reviewer.json", {
  llmApiKey: process.env.ORA_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.REVIEWER_ETH_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.REVIEWER_WALLET_DATA_STR!,
  
});

const graph = new Graph();

graph.addAgentNode({ agent: reviewer, nodeId: "reviewer" });
graph.setEntryPoint("reviewer",`
  you must say amount of DAHOtoken for payback you want to give and proposalId.
  proposalId is 10.
  paybackAmount is 1 to 100.'
  don't say other things. you must say only amount of DAHOtoken and proposalId.
  example:
  
  "proposalId: {proposalId}
   payback: {paybackAmount}"
  `,
  "reviewer-payback",
  ['sign-payback']
);

const task = new GraphTask(graph, InMemoryMemory.getInstance());

task.runTask("")
.then((result) => {
  console.log(result);
})
.catch((error) => {
  console.error(error);
});;