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
    let markdown = "# Conversation Export\n\n";

    for (const message of messages) {
      markdown += `## ${message.author}\n\n${message.content}\n\n`;
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
