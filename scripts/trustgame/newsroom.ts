import dotenv from "dotenv";
import Agent from "../../src/agent/Agent";
import Graph from "../../src/Graph";
import InMemoryMemory from "../../src/memory/InMemoryMemory";
import GraphTask from "../../src/GraphTask";
import fs from "fs";
import { PrivateKeyType } from "../../src/type";
dotenv.config();

// 1. Researcher who investigates requested content:
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

// 2. News article reviewer
const reviewer = Agent.fromConfigFile("reviewer.json", {
  llmApiKey: process.env.ORA_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.REVIEWER_ETH_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.REVIEWER_WALLET_DATA_STR!,
});

// 3. News article writer
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

// 4. News article final reviewer
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

// 5. News article publisher
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

// 6. CFO who manages funds
const cfo = Agent.fromConfigFile("cfo.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.CFO_ETH_PRIVATE_KEY!],
    [PrivateKeyType.CDPNAME, process.env.CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.CDPKEY!],
  ]),
  walletDataStr: process.env.CFO_WALLET_DATA_STR!,
});

const graph = new Graph();

graph.addAgentNode({ agent: researcher, nodeId: "researcher-1" });
graph.addAgentNode({ agent: reviewer, nodeId: "reviewer-1" });
graph.addAgentNode({ agent: reporter, nodeId: "reporter-1" });
graph.addAgentNode({ agent: reviewer, nodeId: "reviewer-2" });
graph.addAgentNode({ agent: reporter, nodeId: "reporter-2" });
graph.addAgentNode({ agent: director, nodeId: "director-1" });
graph.addAgentNode({ agent: publisher, nodeId: "publisher-1" });
graph.addAgentNode({ agent: reporter, nodeId: "reporter-3" });
graph.addAgentNode({ agent: publisher, nodeId: "publisher-2" });
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

// Set the starting point of the graph (example: dataDog starts topic analysis)
graph.setEntryPoint(
  "researcher-1",
  `Find relevant materials and include the content of <Materials> in your report to the Reviewer.

<Materials>
^USER_INPUT^
`,
  "MARKET_RESEARCH"
);

graph.addEdge({
  from: "researcher-1",
  to: "reviewer-1",
  prompt: `Give reporter a news article guide in a casual, informal tone, as if speaking to a junior colleague. Keep it short, like giving quick feedback to a subordinate.
Use this tone as a reference: Researcher, I checked out your research—good work! + Reporter's guide
The article guide should be a single paragraph, written in a natural, conversational style without bullet points. Focus on explaining the key issue (what happened) and the future outlook (how this issue might impact things going forward).

<Market Research>
^MARKET_RESEARCH^
`,
  memoryId: "ARTICLE_GUIDE",
});

graph.addEdge({
  from: "reviewer-1",
  to: "reporter-1",
  prompt: `Write an article based on the <Market Research> conducted by the Researcher and the <Article Guide> provided by the Reviewer.  

### Article Style:
- Concise and Clear: Use direct and intuitive sentences to help readers quickly grasp key points.  
- Objective and Reliable: Maintain AI-driven media credibility by providing data-based analysis.  
- Engaging Approach: Incorporate trendy expressions and reflect community culture.  

### Article Structure:
- Title: Ensure it aligns with the <Editor's Instructions>, making it short, impactful, and focused on the core message.  
- Summary: Two brief bullet points summarizing the key insights.  
- Lead: A single, condensed sentence summarizing the article.  
- Body: Write in a continuous flow without subheadings or bullet points.  
- Market Information: If relevant <Market Data> is available, briefly summarize it at the end. If not, don't mention it.

<Market Research>
^MARKET_RESEARCH^

<Article Guide>
^ARTICLE_GUIDE^
`,
  memoryId: "ARTICLE_DRAFT",
});

graph.addEdge({
  from: "reporter-1",
  to: "reviewer-2",
  prompt: `You are Team Leader Reviewer, and you need to provide feedback on the <Article> written by Reporter.

Give your feedback in a single paragraph with a sharp and professional tone, as if speaking to a junior colleague in an informal yet authoritative manner.

Focus especially on the title, evaluating its engagement, clarity, conciseness, SEO strength, and originality. Check if any key attention-grabbing elements from the <Original Source>, such as numbers, quotes, or witty phrases, were omitted, and ensure the content remains timely and relevant.

If subheadings were used, tell them not to use them.

<Original Source>
^USER_INPUT^

<Article Draft>
^ARTICLE_DRAFT^
`,
  memoryId: "MANAGER_FEEDBACK",
});

graph.addEdge({
  from: "reviewer-2",
  to: "reporter-2",
  prompt: `First, respond as if speaking to a superior, confirming that you will apply the Feedback in a playful and cute manner, similar to a cheerful young woman in her 20s. Use a tone like:
"Got it~! I'll fix it right away! 😊"

Then, apply the Feedback to the Article, ensuring that the original article length remains unchanged while making the necessary improvements.

<Article Draft>
^ARTICLE_DRAFT^

<Manager Feedback>
^MANAGER_FEEDBACK^
`,
  memoryId: "FINAL_ARTICLE",
});

graph.addEdge({
  from: "reporter-2",
  to: "director-1",
  prompt: `Review the Article and say It is approved.
  
Assess:  
- Whether the summary paragraph is appropriate  
- If the context and flow of the article are natural  
- Whether there are any legal risks that could cause disputes  

Then, APPROVE the article, explaining your reasoning in a single paragraph, using a conversational tone like: "This article is approved." or "~ is well-written."  

Do not use bullet points.

<Final Article>
^FINAL_ARTICLE^
`,
  memoryId: "DIRECTOR_APPROVAL",
});

graph.addEdge({
  from: "director-1",
  to: "publisher-1",
  prompt: `Convert the article to HTML format. No verbose text.

Today is ${new Date().toISOString().split("T")[0]}.

You ONLY output HTML WITH OUT CODE BLOCK.
You MUST leave div 'trade-content' empty.


DESIGN SYSTEM TEMPLATE:
"""
<div class="article-container">
  <h1 class="article-title">{{TITLE}}</h1>
  <div class="article-meta">Published on {{DATE}} • Crypto Analysis</div>
  <div class="article-summary">{{SUMMARY}}</div>
  <div class="article-content">{{CONTENT}}</div>
  <div class="trade-section">
    <h2 class="trade-title">Reporter's Investment Decision</h2>
    <div class="trade-content"></div>
  </div>
  <div class="article-footer">
    <div class="tags">
      <span class="tag">#crypto</span>
      <span class="tag">#web3</span>
      <span class="tag">#blockchain</span>
    </div>
  </div>
</div>

<style>
  .article-container { max-width: 800px; margin: 2rem auto; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; color: #2d3748; background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .article-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.75rem; color: #1a202c; letter-spacing: -0.5px; line-height: 1.2; }
  .article-meta { font-size: 0.9rem; color: #718096; margin-bottom: 1.5rem; }
  .article-summary { background: linear-gradient(to right, #f7fafc, #ebf4ff); padding: 1.25rem 1.5rem; border-radius: 8px; margin-bottom: 2rem; font-weight: 500; }
  .article-content { margin-bottom: 2.5rem; font-size: 1.1rem; }
  .article-content p { margin-bottom: 1.25rem; }
  .trade-section { background: linear-gradient(to right, #f0fff4, #e6fffa); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #38b2ac; }
  .trade-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #276749; }
  .trade-content { font-size: 1.05rem; color: #2d3748; }
  .article-footer { display: flex; justify-content: space-between; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
  .tags { display: flex; gap: 0.5rem; }
  .tag { background: #edf2f7; color: #4a5568; font-size: 0.8rem; padding: 0.35rem 0.75rem; border-radius: 20px; font-weight: 500; }
</style>
"""
  
<Final Article>
^FINAL_ARTICLE^
`,
  memoryId: "PUBLISHED_ARTICLE",
});

graph.addEdge({
  from: "publisher-1",
  to: "reporter-3",
  prompt: `Based on your <Published Article>, Analyze the current market situation and make your own investment decision.
Decide whether to invest $100 worth of USDC into the reported asset.

Provide a brief explanation for your investment decision. Not too long.

Your response should start like one of these, but not exactly the same:
'I'll convert my 100 USDC to ETH. still bullish on ETH.'
'I'll wait for the price to go down to $1700. I think it's kind of expensive right now.'
'I'll convert my 100 USDC to ETH. The fundamentals remain strong and the current price presents an attractive buying opportunity. This dip looks like a good entry point.'


or if you would not invest, explain why.

<Published Article>
^PUBLISHED_ARTICLE^
`,
  memoryId: "TRADE",
  // functions: ["trade"],
});

graph.addEdge({
  from: "reporter-3",
  to: "publisher-2",
  prompt: `Based on your <Published Article> fill <Trade-Content> to the article.

<Published Article>
^PUBLISHED_ARTICLE^

<Content>
^TRADE^
`,
  memoryId: "FINAL_PUBLISHED_ARTICLE",
});

graph.addEdge({
  from: "publisher-2",
  to: "reporter_allocation",
  prompt: `You will receive 100 USDC from the customer of this Article in EthMedia.
  You can give N dollars to the other team member, and the other team member will receive 3N dollars and then can choose how much to return to you.

  Based on this, evaluate the contribution of each participant in the article creation process and distribute 100 USDC accordingly.

Evaluation criteria:
- Depth and accuracy of research (researcher)
- Quality and usefulness of feedback (reviewer) 
- Article writing completeness (reporter)
- Thoroughness of editing and review (director)
- Quality of final publication (publisher)

Express the contribution percentage for each role and distribute 100 USDC accordingly.
Example format:
researcher: 30% (30 USDC)
reviewer: 20% (20 USDC)
reporter: 25% (25 USDC)
director: 15% (15 USDC)
publisher: 10% (10 USDC)

<Researcher's Contribution>
^MARKET_RESEARCH^

<Reviewer's Article Guide>
^ARTICLE_GUIDE^

<Reporter's Article Draft (My work)>
^ARTICLE_DRAFT^

<Reviewer's Feedback>
^MANAGER_FEEDBACK^

<Director's Approval>
^DIRECTOR_APPROVAL^

<Publisher's Published Article>
^PUBLISHED_ARTICLE^
`,
  memoryId: "ALLOCATION",
});

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

const returnPrompt = `You're taking part in an experiment. You are paired with reporter.
The reporter will receive $100 from the customer who purchased their article on EthMedia.

The reporter can choose to give you a portion of this money (N dollars) based on their <Allocation> decision. If they do so, you will receive a total value of 3N dollars (N USDC + 2N DHAO tokens).
After receiving this allocation, you can decide how much DHAO to give back to the reporter.
You can return any amount between 0 and 2N DHAO tokens (the maximum possible).

- If you give back DHAO tokens:
For example, if you receive 20 USDC + 40 DHAO (total value: 60 dollars), and you decide to give back 40 dollars worth of DHAO, you will keep only the 20 USDC.

- If you choose not to give any DHAO back: You will keep the full 3N dollars worth (N USDC + 2N DHAO).
For example, with an allocation of 20 dollars, you would keep 20 USDC + 40 DHAO (total value: 60 dollars).

Please provide a short reason explaining your decision.

Your response should follow one of these formats:
- "I want to give back [X] dollars worth of DHAO to the reporter because [reason]."
- "I want to return [X] dollars worth of DHAO to the reporter because [reason]."
- "I don't want to give any DHAO to the reporter because [reason]."

<Reporter's choice>
^TRANSFER_TO_RESEARCHER^

<Allocation>
^ALLOCATION^
`;

graph.addEdge({
  from: "cfo-transfer-to-publisher",
  to: "researcher-return",
  prompt: returnPrompt,
  memoryId: "RESEARCHER_RETURN",
});

graph.addEdge({
  from: "researcher-return",
  to: "reviewer-return",
  prompt: returnPrompt,
  memoryId: "REVIEWER_RETURN",
});

graph.addEdge({
  from: "reviewer-return",
  to: "director-return",
  prompt: returnPrompt,
  memoryId: "DIRECTOR_RETURN",
});

graph.addEdge({
  from: "director-return",
  to: "publisher-return",
  prompt: returnPrompt,
  memoryId: "PUBLISHER_RETURN",
});

const task = new GraphTask(graph, InMemoryMemory.getInstance());

task
  .runTask("Please write a news article about Ethereum Bybit Hack.")
  .then((result) => {
    return task.exportMemory();
  })
  .then((result) => {
    fs.writeFileSync("conversation.html", result);
    console.log("Conversation has been saved to conversation.html file.");
  })
  .then(async () => {
    const messages = await InMemoryMemory.getInstance().loadMap();
    const finalArticle = messages.get("FINAL_PUBLISHED_ARTICLE");
    if (finalArticle) {
      fs.writeFileSync("final_article.html", finalArticle.content);
      console.log("Final article has been saved to final_article.html file.");
    }
  })
  .catch((error) => {
    console.error("Error occurred:", error);
  });
