import { AzureOpenAI } from "openai";
import {
  IntentManagerConfig,
  loadIntentManagerConfig,
} from "./IntentManagerAgentConfig";
import { IndexFlatL2 } from "faiss-node";
import path from "path";
import fs from "fs";
import { Memory } from "../memory";
import InMemoryMemory from "../memory/InMemoryMemory";
import { MemoryType } from "../type";

interface Intent {
  type: string;
  example: string[];
}

class IntentManagerAgent {
  private name: string;
  private embeddingApiKey?: string;
  private embeddingEndpoint?: string;
  private embeddingApiVersion?: string;
  private embeddingDeploymentName: string = "text-embedding-002-ada";
  private embeddingClient: AzureOpenAI;
  private intentCandidates: Intent[] = [];
  private intentIndex?: IndexFlatL2;
  private intentEmbeddings: number[][] = [];
  private intentTypes: string[] = [];
  private indexFilePath?: string;
  private memory: Memory;
  private memoryType: MemoryType;
  constructor(config: IntentManagerConfig) {
    this.name = config.name;
    this.embeddingApiKey = config.embeddingApiKey;
    this.embeddingEndpoint = config.embeddingEndpoint;
    this.embeddingApiVersion = config.embeddingApiVersion;
    if (config.embeddingDeploymentName) {
      this.embeddingDeploymentName = config.embeddingDeploymentName;
    }
    this.embeddingClient = this.createEmbeddingOpenAIClient();

    // 설정에서 의도 정보 로드
    if (config.intent && Array.isArray(config.intent)) {
      this.intentCandidates = config.intent;
    }

    this.memoryType = config.memoryType || MemoryType.inMemory;

    if (this.memoryType === MemoryType.inMemory) {
      this.memory = InMemoryMemory.getInstance();
    } else {
      throw new Error("Memory type not supported");
    }
  }

  static async fromConfigFile(
    configPath: string,
    overrides?: Partial<IntentManagerConfig>
  ): Promise<IntentManagerAgent> {
    const config = loadIntentManagerConfig(configPath);

    // 인덱스 파일 경로 설정 (configPath에서 파일 이름만 추출하여 사용)
    const configFileName = path.basename(configPath, path.extname(configPath));
    const indexFilePath = path.join(
      __dirname,
      `../../.data/${configFileName}.index`
    );

    const agent = new IntentManagerAgent({
      ...config,
      ...overrides,
    });

    // 인덱스 파일 경로 설정
    agent.setIndexFilePath(indexFilePath);

    // 인덱스 파일이 존재하면 로드하고, 존재하지 않으면 초기화
    if (fs.existsSync(indexFilePath)) {
      agent.loadIntentIndex();
    } else {
      // 파일이 없을 때만 인덱스 초기화 수행
      await agent.initializeIntentIndex();
    }

    return agent;
  }

  private createEmbeddingOpenAIClient() {
    return new AzureOpenAI({
      baseURL: null,
      endpoint: this.embeddingEndpoint,
      apiKey: this.embeddingApiKey,
      apiVersion: this.embeddingApiVersion,
    });
  }

  public async getEmbedding(text: string): Promise<number[]> {
    const embedding = await this.embeddingClient.embeddings.create({
      model: this.embeddingDeploymentName,
      input: text,
    });
    return embedding.data[0].embedding;
  }

  private async initializeIntentIndex(): Promise<void> {
    if (this.intentCandidates.length === 0) return;

    // 인덱스가 이미 초기화되었으면 건너뛰기
    if (this.intentIndex) {
      console.log("Intent index already initialized");
      return;
    }

    // 모든 의도 예제에 대한 임베딩 생성
    for (const intent of this.intentCandidates) {
      for (const example of intent.example) {
        const embedding = await this.getEmbedding(example);
        this.intentEmbeddings.push(embedding);
        this.intentTypes.push(intent.type);
      }
    }

    // Faiss 인덱스 초기화 (임베딩 차원: 1536)
    const dimension = 1536;
    this.intentIndex = new IndexFlatL2(dimension);

    console.log("intentIndex: ", this.intentIndex);

    // 인덱스에 임베딩 추가
    for (const embedding of this.intentEmbeddings) {
      this.intentIndex.add(embedding);
    }

    console.log(
      `Intent index initialized with ${this.intentEmbeddings.length} examples`
    );

    // 인덱스 파일 저장
    if (this.indexFilePath) {
      this.saveIntentIndex();
    }
  }

  private async loadIntentIndex(): Promise<void> {
    if (!this.indexFilePath || !fs.existsSync(this.indexFilePath)) {
      console.warn("Index file does not exist, cannot load index");
      return;
    }

    try {
      // 인덱스 파일 로드
      this.intentIndex = IndexFlatL2.read(this.indexFilePath);

      // 인덱스 메타데이터 파일 경로
      const metadataPath = `${this.indexFilePath}.metadata.json`;

      if (fs.existsSync(metadataPath)) {
        // 메타데이터 로드 (intentTypes)
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        this.intentTypes = metadata.intentTypes;
        this.intentEmbeddings = metadata.intentEmbeddings || [];

        console.log(
          `Intent index loaded from ${this.indexFilePath} with ${this.intentTypes.length} examples`
        );
      } else {
        console.warn(
          "Index metadata file not found, index may not work correctly"
        );
      }
    } catch (error) {
      console.error("Error loading intent index:", error);
    }
  }

  private saveIntentIndex(): void {
    if (!this.indexFilePath || !this.intentIndex) {
      console.warn(
        "Cannot save index: index file path not set or index not initialized"
      );
      return;
    }

    try {
      // 디렉토리가 없으면 생성
      const dir = path.dirname(this.indexFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 인덱스 파일 저장
      this.intentIndex.write(this.indexFilePath);

      // 메타데이터 저장 (intentTypes)
      const metadataPath = `${this.indexFilePath}.metadata.json`;
      fs.writeFileSync(
        metadataPath,
        JSON.stringify({
          intentTypes: this.intentTypes,
          intentEmbeddings: this.intentEmbeddings,
        })
      );

      console.log(`Intent index saved to ${this.indexFilePath}`);
    } catch (error) {
      console.error("Error saving intent index:", error);
    }
  }

  public async classifyIntent(text: string): Promise<string> {
    if (!this.intentIndex || this.intentTypes.length === 0) {
      throw new Error("Intent index not initialized");
    }

    console.log("Searching intent for text: ", text);

    // 입력 텍스트의 임베딩 생성
    const queryEmbedding = await this.getEmbedding(text);

    // 가장 유사한 의도 검색
    const k = 3; // 상위 3개 결과 검색
    const searchResult = this.intentIndex.search(queryEmbedding, k);

    // 가장 유사한 의도가 거리 0.5 이상이면 None 반환
    if (searchResult.distances[0] >= 0.5) {
      return "None";
    }

    // 가장 유사한 의도 반환
    const topMatchIndex = searchResult.labels[0] as unknown as number;
    return this.intentTypes[topMatchIndex];
  }

  public async run(input: string): Promise<string> {
    const messages = await this.memory.loadMap();
    const processedInput = input.replace(/\^(.*?)\^/g, (_, memoryId) => {
      const memoryData = messages.get(memoryId);
      return memoryData?.content || memoryId;
    });

    try {
      const intent = await this.classifyIntent(processedInput);
      console.log("Intent: ", intent);
      return intent;
    } catch (error) {
      console.error("Error classifying intent:", error);
      return "Failed to classify intent";
    }
  }

  public getName(): string {
    return this.name;
  }

  public setIndexFilePath(indexFilePath: string): void {
    this.indexFilePath = indexFilePath;
  }
}

export default IntentManagerAgent;
