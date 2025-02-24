import Graph from "./graph";
import { Memory } from "./type";

class GraphTask {
  private graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  async run() {
    let currentNode = this.graph.getEntryPoint();
    while (this.graph.getEdges(currentNode).length > 0) {
      const edge = this.graph.getEdges(currentNode)[0];
      const agent = this.graph.getNode(edge.to);
      if (!agent) {
        return;
      }
      const result = await agent.runPrompt(edge.prompt);
      currentNode = edge.to;
    }
  }
}
export default GraphTask;