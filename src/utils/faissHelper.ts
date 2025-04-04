import { IndexFlatL2 } from "faiss-node";
import { AzureOpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

/**
 * OpenAI 임베딩 클라이언트를 생성하는 함수
 */
function createEmbeddingClient(): AzureOpenAI {
  return new AzureOpenAI({
    baseURL: null,
    endpoint: process.env.AZURE_OPENAI_EMBEDDING_BASE_URL as string,
    apiKey: process.env.AZURE_OPENAI_EMBEDDING_API_KEY as string,
    apiVersion: process.env.AZURE_OPENAI_EMBEDDING_API_VERSION as string,
  });
}

/**
 * 주어진 텍스트에 대해 임베딩을 생성하는 함수
 * @param client AzureOpenAI 클라이언트 인스턴스
 * @param text 임베딩을 생성할 텍스트
 * @returns 임베딩 벡터
 */
async function getEmbedding(
  client: AzureOpenAI,
  text: string
): Promise<number[]> {
  const response = await client.embeddings.create({
    model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME as string,
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * 여러 임베딩 벡터를 Faiss 인덱스에 추가하는 함수
 * @param index Faiss 인덱스 객체
 * @param embeddings 임베딩 벡터 배열
 */
function addEmbeddingsToIndex(
  index: IndexFlatL2,
  embeddings: number[][]
): void {
  embeddings.forEach((embedding) => {
    index.add(embedding);
  });
}

/**
 * Faiss 인덱스에서 검색을 수행하는 함수
 * @param index Faiss 인덱스 객체
 * @param query 검색에 사용할 쿼리 벡터
 * @param k 검색할 이웃의 개수
 * @returns 검색 결과 (라벨 및 거리)
 */
function searchIndex(index: IndexFlatL2, query: number[], k: number) {
  return index.search(query, k);
}

/**
 * 텍스트를 입력받아 임베딩을 생성하고, 이를 사용해 Faiss 인덱스에서 검색하는 함수
 * @param index Faiss 인덱스 객체
 * @param client AzureOpenAI 클라이언트 인스턴스
 * @param text 검색할 텍스트
 * @param k 검색할 이웃의 개수
 * @returns 검색 결과 (라벨 및 거리)
 */
async function searchByText(
  index: IndexFlatL2,
  client: AzureOpenAI,
  text: string,
  k: number
) {
  const queryEmbedding = await getEmbedding(client, text);
  return searchIndex(index, queryEmbedding, k);
}

/**
 * Faiss 인덱스를 파일로 저장하는 함수
 * @param index Faiss 인덱스 객체
 * @param filename 저장할 파일 이름
 */
function saveIndex(index: IndexFlatL2, filename: string): void {
  index.write(filename);
}

/**
 * 파일에서 Faiss 인덱스를 로드하는 함수
 * @param filename 로드할 파일 이름
 * @returns 로드된 Faiss 인덱스 객체
 */
function loadIndex(filename: string): IndexFlatL2 {
  return IndexFlatL2.read(filename);
}

async function main() {
  const client = createEmbeddingClient();

  // 샘플 텍스트 배열
  const texts = [
    "The weather is beautiful today",
    "I love programming and coding",
    "Artificial intelligence is fascinating",
    "Learning new things is exciting",
  ];

  try {
    // 각 텍스트에 대해 임베딩 생성
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await getEmbedding(client, text);
      embeddings.push(embedding);
    }

    console.log("첫 번째 텍스트 임베딩:", embeddings[0]);

    // Faiss 인덱스 생성 (임베딩 차원: 1536)
    const dimension = 1536;
    const index = new IndexFlatL2(dimension);

    // 인덱스에 임베딩 추가
    addEmbeddingsToIndex(index, embeddings);

    // 텍스트를 통한 검색 예시
    const queryText = "I enjoy AI and coding";
    const k = 4;
    const textSearchResult = await searchByText(index, client, queryText, k);
    console.log("텍스트 검색 결과 (라벨):", textSearchResult.labels);
    console.log("텍스트 검색 결과 (거리):", textSearchResult.distances);

    // 인덱스를 파일로 저장
    const filename = "faiss.index";
    saveIndex(index, filename);

    // 파일에서 인덱스를 로드하여 검증
    const loadedIndex = loadIndex(filename);
    console.log("로드된 인덱스 차원:", loadedIndex.getDimension());
    console.log("로드된 인덱스 총 개수:", loadedIndex.ntotal());
    const loadedSearchResult = searchIndex(loadedIndex, embeddings[0], k);
    console.log("로드된 인덱스 검색 결과 (라벨):", loadedSearchResult.labels);
    console.log(
      "로드된 인덱스 검색 결과 (거리):",
      loadedSearchResult.distances
    );
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

main();
