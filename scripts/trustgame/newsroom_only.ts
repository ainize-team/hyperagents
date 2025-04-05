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
  privateKey: new Map([
    [PrivateKeyType.ETH, process.env.RESEARCHER_ETH_PRIVATE_KEY!],
    [PrivateKeyType.AIN, process.env.RESEARCHER_AIN_PRIVATE_KEY!],
  ]),
});

const reviewer = Agent.fromConfigFile("reviewer.json", {
  llmApiKey: process.env.ORA_API_KEY!,
});

const reporter = Agent.fromConfigFile("reporter.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
  privateKey: new Map([
    [PrivateKeyType.CDPNAME, process.env.REPORTER_CDPNAME!],
    [PrivateKeyType.CDPKEY, process.env.REPORTER_CDPKEY!],
  ]),
});

const director = Agent.fromConfigFile("director.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const publisher = Agent.fromConfigFile("publisher.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
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
Decide whether to invest $1 worth of USDC into the reported asset.

Provide a brief explanation for your investment decision.

Your response should start with like this:
'I'll convert my 1 USDC to ETH.'
'I'll wait for the price to go down to $1700. I think it's kind of expensive right now.'

or if you would not invest, explain why.

<Published Article>
^PUBLISHED_ARTICLE^
`,
  memoryId: "TRADE",
  functions: ["trade"],
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
  .runTask("Please write a news article about Ethereum ETF.")
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
