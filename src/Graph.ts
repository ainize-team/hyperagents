import { join } from "path";
import Agent from "./Agent";

interface EdgeData {
  to: string;
  from: string;
  prompt: string;
}

class Graph {
  private readonly ENTRY_POINT_KEY = "ROOTNODE";
  private node: Map<string, Agent>;
  private edge: Map<string, Map<string, EdgeData>>;
  constructor() {
    this.node = new Map();
    this.edge = new Map();
  }

  getEntryPoint() {
    const entryPoint = this.getEdges(this.ENTRY_POINT_KEY);
    if (!entryPoint || entryPoint.length == 0) {
      throw new Error("Entry point not set");
    }
    return entryPoint[0];
  }

  setEntryPoint(name: string, prompt: string) {
    this.edge.set(this.ENTRY_POINT_KEY, new Map([[name, {to: name, from: this.ENTRY_POINT_KEY, prompt: prompt}]]));
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
    const agent  = this.node.get(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }
    return agent;
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