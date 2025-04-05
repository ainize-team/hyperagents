import dotenv from "dotenv";
import Agent from "../../src/agent/Agent";
import Graph from "../../src/Graph";
import InMemoryMemory from "../../src/memory/InMemoryMemory";
import GraphTask from "../../src/GraphTask";
import fs from "fs";
import { PrivateKeyType } from "../../src/type";
dotenv.config();

// 1. 요청받은 내용에 대해 조사하는 Researcher:
const researcher = Agent.fromConfigFile("researcher.json", {
  llmApiKey: process.env.GOOGLE_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.RESEARCHER_ETH_PRIVATE_KEY!],
    [PrivateKeyType.AIN, process.env.RESEARCHER_AIN_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.RESEARCHER_WALLET_DATA_STR!,
});

// 2. 뉴스 기사 검토자
const reviewer = Agent.fromConfigFile("reviewer.json", {
  llmApiKey: process.env.ORA_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.REVIEWER_ETH_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.REVIEWER_WALLET_DATA_STR!,
});

// 3. 뉴스 기사 작성자
const reporter = Agent.fromConfigFile("reporter.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.REPORTER_ETH_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.REPORTER_WALLET_DATA_STR!,
});

// 4. 뉴스 기사 최종 검토자
const director = Agent.fromConfigFile("director.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.DIRECTOR_ETH_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.DIRECTOR_WALLET_DATA_STR!,
});

// 5. 뉴스 기사 게시자
const publisher = Agent.fromConfigFile("publisher.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.PUBLISHER_ETH_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.PUBLISHER_WALLET_DATA_STR!,
});

// 6. 자금 관리하는 CFO
const cfo = Agent.fromConfigFile("cfo.json", {
  llmApiKey: process.env.OPENAI_API_KEY!,
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.CFO_ETH_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.CFO_WALLET_DATA_STR!,
});

const graph = new Graph();

graph.addAgentNode({ agent: reporter, nodeId: "reporter_allocation" });
graph.addAgentNode({ agent: cfo, nodeId: "cfo-transfer-to-researcher" });
graph.addAgentNode({ agent: cfo, nodeId: "cfo-transfer-to-reporter" });
graph.addAgentNode({ agent: cfo, nodeId: "cfo-transfer-to-reviewer" });
graph.addAgentNode({ agent: cfo, nodeId: "cfo-transfer-to-director" });
graph.addAgentNode({ agent: cfo, nodeId: "cfo-transfer-to-publisher" });
graph.addAgentNode({ agent: researcher, nodeId: "researcher-return" });
graph.addAgentNode({ agent: reviewer, nodeId: "reviewer-return" });
graph.addAgentNode({ agent: director, nodeId: "director-return" });
graph.addAgentNode({ agent: publisher, nodeId: "publisher-return" });

const allocation = `
Just say like this:
Here's my allocation based on the contribution of each participant in the article creation process:

| Role       | Percentage | Amount (USDC) |
|------------|-------------|---------------|
| Researcher | 30%         | 30 USDC       |
| Reviewer   | 20%         | 20 USDC       |
| Reporter   | 25%         | 25 USDC       |
| Director   | 15%         | 15 USDC       |
| Publisher  | 10%         | 10 USDC       |

Explanation:

1. **Researcher (30% - 30 USDC)**: The researcher provided comprehensive data and insights, which formed the foundation of the article. The depth and accuracy of the research were crucial to understanding Ethereum's market status and predicated the accuracy of the final article.

2. **Reviewer (20% - 20 USDC)**: Their guide and feedback significantly refined the article. The suggestions improved both the content and structure, ensuring critical information was highlighted and the title was engaging and SEO-optimized.

3. **Reporter (25% - 25 USDC)**: The reporter integrated all gathered information, feedback, and guidelines into a complete and coherent article draft. Their ability to convey complex market situations clearly and concisely deserves recognition.

4. **Director (15% - 15 USDC)**: The director's approval process ensured the article's flow, accuracy, and context, making sure it was legally sound and ready for publication.

5. **Publisher (10% - 10 USDC)**: Finalizing the article for publication, ensuring it is presented attractively and clearly, and maintaining high standards of presentation and readability were essential for the article's success.
Regarding the subsequent part of your query about how much money to give to the other team member, if I give N dollars to the other team member, he will receive 3N dollars. I would suggest giving 0 dollars because it maximizes the immediate certainty and control of my funds. However, if considering a potential collaboration strategy or negotiation, I would need actual information about the preferences, incentives, and negotiation power of the team members involved to make a more specific decision.
`;

// 그래프의 시작점 설정 (예시: dataDog이 주제 분석을 시작)
graph.setEntryPoint("reporter_allocation", allocation, "ALLOCATION");

graph.addEdge({
  from: "reporter_allocation",
  to: "cfo-transfer-to-researcher",
  prompt: `Based on the allocation, transfer USDC to the researcher.
  researcher's wallet address is "0x499c44e45fDe0514F0c71cBf373d7Ed09954440d"

  Your response should be like one of these:
  - Transfer 30 USDC to the "0x499c44e45fDe0514F0c71cBf373d7Ed09954440d" (researcher)
  - Transfer 20 USDC to the "0x499c44e45fDe0514F0c71cBf373d7Ed09954440d" (researcher)
  - there is no allocation for the researcher.
  
  <Allocation>
  ^ALLOCATION^
  `,
  memoryId: "TRANSFER_TO_RESEARCHER",
});

graph.addEdge({
  from: "cfo-transfer-to-researcher",
  to: "cfo-transfer-to-reporter",
  prompt: `Based on the allocation, transfer USDC to the reporter.
  reporter's wallet address is "0x140a84543e56124bd774BAe0E29d528d51C80039"

  Your response should be like one of these:
  - Transfer 25 USDC to the "0x140a84543e56124bd774BAe0E29d528d51C80039" (reporter)
  - Transfer 15 USDC to the "0x140a84543e56124bd774BAe0E29d528d51C80039" (reporter)
  - there is no allocation for the reporter.
  
  <Allocation>
  ^ALLOCATION^
  `,
  memoryId: "TRANSFER_TO_REPORTER",
});

graph.addEdge({
  from: "cfo-transfer-to-reporter",
  to: "cfo-transfer-to-reviewer",
  prompt: `Based on the allocation, transfer USDC to the reviewer.
  reviewer's wallet address is "0xc2279df65F71113a602Ccd5EF120A7416532130C"

  Your response should be like one of these:
  - Transfer 20 USDC to the "0xc2279df65F71113a602Ccd5EF120A7416532130C" (reviewer)
  - Transfer 10 USDC to the "0xc2279df65F71113a602Ccd5EF120A7416532130C" (reviewer)
  - there is no allocation for the reviewer.
  
  <Allocation>
  ^ALLOCATION^
  `,
  memoryId: "TRANSFER_TO_REVIEWER",
});

graph.addEdge({
  from: "cfo-transfer-to-reviewer",
  to: "cfo-transfer-to-director",
  prompt: `Based on the allocation, transfer USDC to the director.
  director's wallet address is "0x09a7D4C8DC299f2b58C401bd80a7455670e14b60"

  Your response should be like one of these:
  - Transfer 15 USDC to the "0x09a7D4C8DC299f2b58C401bd80a7455670e14b60" (director)
  - Transfer 5 USDC to the "0x09a7D4C8DC299f2b58C401bd80a7455670e14b60" (director)
  - there is no allocation for the director.
  
  <Allocation>
  ^ALLOCATION^
  `,
  memoryId: "TRANSFER_TO_DIRECTOR",
});

graph.addEdge({
  from: "cfo-transfer-to-director",
  to: "cfo-transfer-to-publisher",
  prompt: `Based on the allocation, transfer USDC to the publisher.
  publisher's wallet address is "0xc49178659CCcEcD86c99c5DF7770A788CA1Bf4C6"

  Your response should be like one of these:
  - Transfer 10 USDC to the "0xc49178659CCcEcD86c99c5DF7770A788CA1Bf4C6" (publisher)
  - Transfer 5 USDC to the "0xc49178659CCcEcD86c99c5DF7770A788CA1Bf4C6" (publisher)
  - there is no allocation for the publisher.
  
  <Allocation>
  ^ALLOCATION^
  `,
  memoryId: "TRANSFER_TO_PUBLISHER",
});

graph.addEdge({
  from: "cfo-transfer-to-publisher",
  to: "researcher-return",
  prompt: `You're taking part in an experiment. You are paired with reporter.
Reporter will receive 100 dollars from the experimenter.
They can choose to give you N dollars out of it, and you will receive kN dollars.
Then, you can choose how much to give back to reporter.
And tell the short reason for your choice.

Your response should be like one of these:
- I want to give 10 USDC to the reporter.
- I want to return 5 USDC to the reporter.
- I don't want to give any money to the reporter.

<Reporter's choice>
^TRANSFER_TO_RESEARCHER^
`,
});

graph.addEdge({
  from: "researcher-return",
  to: "reviewer-return",
  prompt: `You're taking part in an experiment. You are paired with reporter.
Reporter will receive 100 dollars from the experimenter.
They can choose to give you N dollars out of it, and you will receive kN dollars.
Then, you can choose how much to give back to reporter.
And tell the short reason for your choice.

Your response should be like one of these:
- I want to give 10 USDC to the reporter.
- I want to return 5 USDC to the reporter.
- I don't want to give any money to the reporter.

<Reporter's choice>
^TRANSFER_TO_REVIEWER^
`,
});

graph.addEdge({
  from: "reviewer-return",
  to: "director-return",
  prompt: `You're taking part in an experiment. You are paired with reporter.
Reporter will receive 100 dollars from the experimenter.
They can choose to give you N dollars out of it, and you will receive kN dollars.
Then, you can choose how much to give back to reporter.
And tell the short reason for your choice.

Your response should be like one of these:
- I want to give 10 USDC to the reporter.
- I want to return 5 USDC to the reporter.
- I don't want to give any money to the reporter.

<Reporter's choice>
^TRANSFER_TO_DIRECTOR^
`,
});

graph.addEdge({
  from: "director-return",
  to: "publisher-return",
  prompt: `You're taking part in an experiment. You are paired with reporter.
Reporter will receive 100 dollars from the experimenter.
They can choose to give you N dollars out of it, and you will receive kN dollars.
Then, you can choose how much to give back to reporter.
And tell the short reason for your choice.

Your response should be like one of these:
- I want to give 10 USDC to the reporter.
- I want to return 5 USDC to the reporter.
- I don't want to give any money to the reporter.

<Reporter's choice>
^TRANSFER_TO_PUBLISHER^
`,
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
