import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AzureChatOpenAI } from "@langchain/openai";
import * as fs from "fs";

/**
 * 에이전트 응답 타입
 * @typedef {Object} AgentResponse
 * @property {string} content - 응답 내용
 * @property {'agent' | 'tools'} type - 응답 타입
 */
export type AgentResponse = {
  content: string;
  type: "agent" | "tools";
};

/**
 * 에이전트 설정 옵션
 * @typedef {Object} AgentOptions
 * @property {string} openaiApiKey - OpenAI API 키
 * @property {string} cdpApiKeyName - CDP API 키 이름
 * @property {string} cdpApiKeyPrivateKey - CDP API 키 개인키
 * @property {string} [message] - 에이전트에게 전달할 메시지
 * @property {string} [networkId="base-mainnet"] - 블록체인 네트워크 ID
 * @property {string} [walletDataFile="wallet_data.txt"] - 지갑 데이터 저장 파일 경로
 * @property {string} [model="gpt-4o-mini"] - 사용할 OpenAI 모델
 * @property {boolean} [autonomous=false] - 자율 모드 활성화 여부
 * @property {Object} [azureOptions] - Azure OpenAI 설정 옵션
 * @property {string} [azureOptions.instanceName="gpt-4o-ptu-m"] - Azure OpenAI 인스턴스 이름
 * @property {string} [azureOptions.deploymentName="gpt-4o-2"] - Azure OpenAI 배포 이름
 * @property {string} [azureOptions.apiVersion="2024-02-15-preview"] - Azure OpenAI API 버전
 */
export interface AgentOptions {
  openaiApiKey: string;
  cdpApiKeyName: string;
  cdpApiKeyPrivateKey: string;
  message?: string;
  networkId?: string;
  walletDataStr?: string;
  model?: string;
  autonomous?: boolean;
  azureOptions?: {
    instanceName?: string;
    deploymentName?: string;
    apiVersion?: string;
  };
}

/**
 * 코인베이스 AgentKit 기반 AI 에이전트를 생성하고 실행합니다.
 *
 * @param {AgentOptions} options - 에이전트 설정 옵션
 * @returns {Promise<AgentResponse[]>} 에이전트 응답 배열
 * @example
 * ```typescript
 * import { runAgent } from 'coinbase-agent-lib';
 *
 * // 에이전트 실행
 * const responses = await runAgent({
 *   openaiApiKey: process.env.OPENAI_API_KEY || "",
 *   cdpApiKeyName: process.env.CDP_API_KEY_NAME || "",
 *   cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY || "",
 *   message: "내 지갑 정보를 알려주세요."
 * });
 *
 * // 결과 출력
 * responses.forEach(response => {
 *   console.log(`[${response.type}] ${response.content}`);
 * });
 * ```
 */
export async function runCoinbaseAgentkitWithAzureOpenAI(
  options: AgentOptions
): Promise<string> {
  const {
    openaiApiKey,
    cdpApiKeyName,
    cdpApiKeyPrivateKey,
    message,
    networkId = "base-mainnet",
    walletDataStr,
    autonomous = false,
    azureOptions = {
      instanceName: "gpt-4o-ptu-m",
      deploymentName: "gpt-4o-2",
      apiVersion: "2024-02-15-preview",
    },
  } = options;

  try {
    // LLM 초기화
    const llm = new AzureChatOpenAI({
      azureOpenAIApiKey: openaiApiKey,
      azureOpenAIApiInstanceName: azureOptions.instanceName,
      azureOpenAIApiDeploymentName: azureOptions.deploymentName,
      azureOpenAIApiVersion: azureOptions.apiVersion,
    });

    if (!walletDataStr) {
      throw new Error("walletDataStr is required");
    }

    // CDP 지갑 제공자 설정
    const walletConfig = {
      apiKeyName: cdpApiKeyName,
      apiKeyPrivateKey: cdpApiKeyPrivateKey,
      cdpWalletData: walletDataStr,
      networkId: networkId,
    };

    // 지갑 제공자 초기화
    const walletProvider = await CdpWalletProvider.configureWithWallet(
      walletConfig
    );

    // AgentKit 초기화
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: cdpApiKeyName,
          apiKeyPrivateKey: cdpApiKeyPrivateKey,
        }),
        cdpWalletActionProvider({
          apiKeyName: cdpApiKeyName,
          apiKeyPrivateKey: cdpApiKeyPrivateKey,
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // 대화 기록 메모리 저장
    const memory = new MemorySaver();
    const config = { configurable: { thread_id: "CDP AgentKit Example" } };

    // React Agent 생성
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
              You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
              empowered to interact onchain using your tools. If you ever need funds, you can request them from the 
              faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet details and request 
              funds from the user. Before executing your first action, get the wallet details to see what network 
              you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. Be concise and 
              helpful with your responses. USDC's contract address is "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913. All the assets are on base-mainnet."
            `,
    });

    // 에이전트 응답 배열
    const responses: AgentResponse[] = [];

    // 자율 모드 또는 채팅 모드
    const userMessage = autonomous
      ? message ||
        "Please perform some interesting tasks on the blockchain. Show me what you can do."
      : message || "Please show me my wallet information.";

    // 에이전트 실행
    const stream = await agent.stream(
      { messages: [new HumanMessage(userMessage)] },
      config
    );

    for await (const chunk of stream) {
      if ("agent" in chunk) {
        responses.push({
          content: chunk.agent.messages[0].content,
          type: "agent",
        });
      } else if ("tools" in chunk) {
        responses.push({
          content: chunk.tools.messages[0].content,
          type: "tools",
        });
      }
    }

    let stringResponse = "";
    responses.forEach((response) => {
      stringResponse += `[${response.type}] ${response.content}\n`;
    });

    return stringResponse;
  } catch (error) {
    console.error("에이전트 실행 오류:", error);
    throw error;
  }
}

/**
 * 지갑 데이터를 읽어오는 유틸리티 함수
 *
 * @param {string} walletDataFile - 지갑 데이터 파일 경로
 * @returns {string|null} 지갑 데이터 문자열 또는 null
 */
export function readWalletData(walletDataFile: string): string | null {
  if (fs.existsSync(walletDataFile)) {
    try {
      return fs.readFileSync(walletDataFile, "utf8");
    } catch (error) {
      console.error("지갑 데이터 읽기 오류:", error);
      return null;
    }
  }
  return null;
}

/**
 * 간편한 에이전트 사용을 위한 클래스
 */
export class CoinbaseAgent {
  private options: AgentOptions;

  /**
   * CoinbaseAgent 인스턴스 생성
   *
   * @param {AgentOptions} options - 에이전트 설정 옵션
   */
  constructor(options: AgentOptions) {
    this.options = { ...options };
  }

  /**
   * 에이전트에 메시지 전송하고 응답 받기
   *
   * @param {string} message - 에이전트에 전송할 메시지
   * @param {boolean} [autonomous=false] - 자율 모드 활성화 여부
   * @returns {Promise<AgentResponse[]>} 에이전트 응답 배열
   */

  async sendMessage(message: string, autonomous = false): Promise<string> {
    return runCoinbaseAgentkitWithAzureOpenAI({
      ...this.options,
      message,
      autonomous,
    });
  }

  /**
   * 자율 모드로 에이전트 실행
   *
   * @param {string} [message] - 선택적 시작 메시지
   * @returns {Promise<AgentResponse[]>} 에이전트 응답 배열
   */

  async runAutonomous(message?: string): Promise<string> {
    return this.sendMessage(
      message ||
        "Please perform some interesting tasks on the blockchain. Show me what you can do.",
      true
    );
  }
}
