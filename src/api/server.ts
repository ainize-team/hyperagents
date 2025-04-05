import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Graph from "../Graph";
import InMemoryMemory from "../memory/InMemoryMemory";
import GraphTask from "../GraphTask";
import IntentManagerAgent from "../agent/IntentManagerAgent";
import Agent from "../agent/Agent";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// 그래프 생성 함수
async function createGraph() {
  // 1. intent manager
  const intentManager = await IntentManagerAgent.fromConfigFile(
    "IntentManager.json",
    {
      embeddingApiKey: process.env.AZURE_OPENAI_EMBEDDING_API_KEY!,
      embeddingEndpoint: process.env.AZURE_OPENAI_EMBEDDING_BASE_URL!,
      embeddingApiVersion: process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!,
      embeddingDeploymentName:
        process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME!,
    }
  );

  const foodie = await Agent.fromConfigFile("Foodie.json", {
    llmApiKey: process.env.GOOGLE_API_KEY!,
  });

  const artie = await Agent.fromConfigFile("Artie.json", {
    llmApiKey: process.env.GOOGLE_API_KEY!,
  });

  const actors = await Agent.fromConfigFile("Actors.json", {
    llmApiKey: process.env.GOOGLE_API_KEY!,
  });

  const muzie = await Agent.fromConfigFile("Muzie.json", {
    llmEndpoint: process.env.OPENAI_BASE_URL!,
    llmApiKey: process.env.OPENAI_API_KEY!,
  });

  const welly = await Agent.fromConfigFile("Welly.json", {
    llmEndpoint: process.env.OPENAI_BASE_URL!,
    llmApiKey: process.env.OPENAI_API_KEY!,
  });

  const master = await Agent.fromConfigFile("Master.json", {
    llmEndpoint: process.env.OPENAI_BASE_URL!,
    llmApiKey: process.env.OPENAI_API_KEY!,
  });

  const graph = new Graph();

  graph.addAgentNode({ agent: intentManager, nodeId: "intent_manager" });
  graph.addAgentNode({ agent: foodie, nodeId: "foodie" });
  graph.addAgentNode({ agent: artie, nodeId: "artie" });
  graph.addAgentNode({ agent: actors, nodeId: "actors" });
  graph.addAgentNode({ agent: muzie, nodeId: "muzie" });
  graph.addAgentNode({ agent: welly, nodeId: "welly" });
  graph.addAgentNode({ agent: master, nodeId: "master" });

  graph.addAgentNode({ agent: foodie, nodeId: "foodie-food_recommendation" });

  graph.setEntryPoint("intent_manager", `^USER_INPUT^`, "foodie");

  graph.addEdge({
    from: "intent_manager",
    to: "foodie",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
    intent: ["general_recommandation"],
    memoryId: "foodie-general_recommendation",
  });

  graph.addEdge({
    from: "foodie",
    to: "artie",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
    memoryId: "artie-general_recommendation",
  });

  graph.addEdge({
    from: "artie",
    to: "actors",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
    memoryId: "actors-general_recommendation",
  });

  graph.addEdge({
    from: "actors",
    to: "muzie",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
    memoryId: "muzie-general_recommendation",
  });

  graph.addEdge({
    from: "muzie",
    to: "welly",
    prompt: `Answer the user's question based on the following information:
      User Question: ^USER_INPUT^`,
    memoryId: "welly-general_recommendation",
  });

  graph.addEdge({
    from: "welly",
    to: "master",
    prompt: `Provide the summary of the agents's conversation:
    <Foodie>
      ^foodie-general_recommendation^
    </Foodie>
    <Artie>
      ^artie-general_recommendation^
    </Artie>
    <Actors>
      ^actors-general_recommendation^
    </Actors>
    <Muzie>
      ^muzie-general_recommendation^
    </Muzie>
    <Welly>
      ^welly-general_recommendation^
    </Welly>
    
      User Question: ^USER_INPUT^`,
    memoryId: "master-summary",
  });

  graph.addEdge({
    from: "intent_manager",
    to: "foodie-food_recommendation",
    prompt: `Answer the user's question based on the following information:
      - Please recommend only 3 places
      - Use polite speech endings in Korean

      User Question: ^USER_INPUT^`,
    intent: ["food_recommendation"],
    memoryId: "foodie-food_recommendation",
  });

  return graph;
}

// API 엔드포인트 설정
app.post("/api/intent", async (req: Request, res: Response) => {
  try {
    const { userInput } = req.body as { userInput: string };

    if (!userInput) {
      res.status(400).json({ error: "사용자 입력이 필요합니다" });
      return;
    }

    const graph = await createGraph();
    const task = new GraphTask(graph, InMemoryMemory.getInstance());

    // SSE 스트리밍을 위한 헤더 설정
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.flushHeaders(); // 헤더 즉시 전송

    // 각 결과를 스트리밍으로 클라이언트에 전송
    for await (const result of task.runTask(userInput)) {
      // 각 메시지를 SSE 형식(data: {내용}\n\n)으로 전송합니다.
      res.write(`data: ${JSON.stringify(result)}\n\n`);
    }

    // 스트리밍 완료 후 종료 메시지 전송
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error("Error processing intent:", error);
    // 스트리밍 중 에러가 발생할 경우, 에러를 클라이언트에 전달할 수도 있습니다.
    res.status(500).json({
      success: false,
      error: "서버 오류가 발생했습니다",
      message: error instanceof Error ? error.message : "알 수 없는 오류",
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});

export default app;
