import Graph from "./Graph";
import { Memory } from "./memory";

class GraphTask {
  private graph: Graph;
  private memory: Memory;

  constructor(graph: Graph, memory: Memory) {
    this.graph = graph;
    this.memory = memory;
  }

  getMemory() {
    return this.memory;
  }

  async exportMemory(): Promise<string> {
    const messages = await this.memory.load();
    let markdown = "# 대화 내보내기\n\n";

    for (const message of messages) {
      // author를 더 강조하고 명확하게 표시
      markdown += `### 😀 ${message.author}\n\n`;

      // content를 인용 블록(>)으로 감싸서 시각적으로 구분
      // 각 줄마다 > 를 추가하여 여러 줄의 content도 인용 블록으로 처리
      const contentLines = message.content.split("\n");
      const quotedContent = contentLines.map((line) => `> ${line}`).join("\n");

      markdown += `${quotedContent}\n\n---\n\n`; // 구분선 추가
    }

    return markdown;
  }

  async runTask(input: string) {
    this.memory.add({
      id: "USER_INPUT",
      author: "user",
      content: input,
      timestamp: Date.now(),
    });
    let edge = this.graph.getEntryPoint();
    while (true) {
      const agent = this.graph.getNode(edge.to);
      await agent.run(edge.prompt);
      const edges = this.graph.getEdges(edge.to);
      if (edges.length == 0) {
        const messages = await this.memory.load();
        return messages[messages.length - 1].content;
      }
      edge = edges[0];
    }
  }
}
export default GraphTask;
