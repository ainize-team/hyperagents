import Agent from "./Agent";

interface EdgeData {
  to: string;
  from: string;
  prompt: string;
}

class Graph {
  private node: Map<string, Agent>;
  private edge: Map<string, Map<string, EdgeData>>;
  private entryPoint?: string;
  constructor() {
    this.node = new Map();
    this.edge = new Map();
  }

  getEntryPoint() {
    if (!this.entryPoint) {
      throw new Error("Entry point not set");
    }
    return this.entryPoint;
  }

  setEntryPoint(name: string) {
    this.entryPoint = name;
  }

  addAgentNode(nodeconfig: {agent: Agent, name: string}) {
    this.node.set(nodeconfig.name, nodeconfig.agent);
  }
  
  addEdge(edgeConfig: {from: string, to: string, prompt: string}) {
    if(this.edge.get(edgeConfig.from)){
      this.edge.get(edgeConfig.from)?.set(edgeConfig.to, edgeConfig);
    } else {
      this.edge.set(edgeConfig.from, new Map([[edgeConfig.to, edgeConfig]]));
    }
  }

  getNode(name: string) {
    return this.node.get(name);
  }

  getEdges(from: string) {
    const edges = this.edge.get(from);
    return Array.from(edges?.values() || []);
  }

  getEdge(from: string, to: string) {
    return this.edge.get(from)?.get(to);
  }

}
export default Graph;