import Graph from "./Graph";
import { Memory } from "./type";

class GraphTask {
  private graph: Graph;
  private memory: Memory; 

  constructor(graph: Graph, memory: Memory) {
    this.graph = graph;
    this.memory = memory;
  }

  async runTask(input: string) {
    this.memory.add({
      author: "user",
      content: input
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