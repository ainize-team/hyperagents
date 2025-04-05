import dotenv from "dotenv";
import Graph from "../src/Graph";
import InMemoryMemory from "../src/memory/InMemoryMemory";
import GraphTask from "../src/GraphTask";
import Agent from "../src/agent/Agent";
dotenv.config();

async function runFoodieAgent(userInput: string): Promise<string> {
  // Foodie 에이전트 초기화
  const foodie = Agent.fromConfigFile("Foodie.json", {
    llmApiKey: process.env.OPENAI_API_KEY!,
    llmEndpoint: process.env.OPENAI_BASE_URL!,
  });

  // 그래프 설정
  const graph = new Graph();
  graph.addAgentNode({ agent: foodie, nodeId: "foodie" });
  graph.setEntryPoint(
    "foodie",
    `Answer the user's question based on the following information:
    - Recommend just 3 places to visit
    - End the sentence with a polite tone
    User Question: ^USER_INPUT^`
  );

  // 태스크 실행
  const task = new GraphTask(graph, InMemoryMemory.getInstance());
  const result = await task.runTask(userInput);

  return result;
}

// 사용 예시
if (require.main === module) {
  (async () => {
    try {
      const result = await runFoodieAgent(
        "Can you recommend some good places to visit in Seoul?"
      );
      console.log("결과:", result);
    } catch (error) {
      console.error("에러 발생:", error);
    }
  })();
}
