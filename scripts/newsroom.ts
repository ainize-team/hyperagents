import dotenv from "dotenv";
import Agent from "../src/agent/Agent";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import fs from "fs";
dotenv.config();

// 1. 요청받은 내용에 대해 조사하는 Researcher:
const researcher = Agent.fromConfigFile("researcher.json", {
  llmApiKey: process.env.GOOGLE_API_KEY!,
});

const reviewer = Agent.fromConfigFile("reviewer.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
});

const reporter = Agent.fromConfigFile("reporter.json", {
  llmEndpoint: process.env.OPENAI_BASE_URL!,
  llmApiKey: process.env.OPENAI_API_KEY!,
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

graph.addEdge({
  from: "researcher-1",
  to: "reviewer-1",
  prompt: `Give reporter a news article guide in a casual, informal tone, as if speaking to a junior colleague. Keep it short, like giving quick feedback to a subordinate.
Use this tone as a reference: Researcher, I checked out your research—good work! + Reporter's guide
The article guide should be a single paragraph, written in a natural, conversational style without bullet points. Focus on explaining the key issue (what happened) and the future outlook (how this issue might impact things going forward).`,
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
- Title: Ensure it aligns with the <Editor’s Instructions>, making it short, impactful, and focused on the core message.  
- Summary: Two brief bullet points summarizing the key insights.  
- Lead: A single, condensed sentence summarizing the article.  
- Body: Write in a continuous flow without subheadings or bullet points.  
- Market Information: If relevant <Market Data> is available, briefly summarize it at the end. If not, don't mention it.
`,
});

graph.addEdge({
  from: "reporter-1",
  to: "reviewer-2",
  prompt: `You are Team Leader Reviewer, and you need to provide feedback on the <Article> written by Reporter.

Give your feedback in a single paragraph with a sharp and professional tone, as if speaking to a junior colleague in an informal yet authoritative manner.

Focus especially on the title, evaluating its engagement, clarity, conciseness, SEO strength, and originality. Check if any key attention-grabbing elements from the <Original Source>, such as numbers, quotes, or witty phrases, were omitted, and ensure the content remains timely and relevant.

If subheadings were used, tell them not to use them.`,
});

graph.addEdge({
  from: "reviewer-2",
  to: "reporter-2",
  prompt: `First, respond as if speaking to a superior, confirming that you will apply the Feedback in a playful and cute manner, similar to a cheerful young woman in her 20s. Use a tone like:
"Got it~! I’ll fix it right away! 😊"

Then, apply the Feedback to the Article, ensuring that the original article length remains unchanged while making the necessary improvements.`,
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

Do not use bullet points.`,
});

graph.addEdge({
  from: "director-1",
  to: "publisher-1",
  prompt: "Convert the article to HTML format.",
});
// 그래프의 시작점 설정 (예시: dataDog이 주제 분석을 시작)
graph.setEntryPoint(
  "researcher-1",
  "Find relevant materials and include the content of <Materials> in your report to the Reviewer."
);

const task = new GraphTask(graph, InMemoryMemory.getInstance());

task
  .runTask(
    "The CEO of Bybit has declared war on Lazarus. Write a news article praising this action."
  )
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
