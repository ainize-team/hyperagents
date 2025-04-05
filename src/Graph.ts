import Agent from "./agent/Agent";
import IntentManagerAgent from "./agent/IntentManagerAgent";

interface EdgeData {
  to: string;
  from: string;
  prompt: string;
  memoryId?: string;
  intent?: string[];
  functions?: string[];
}

class Graph {
  private readonly ENTRY_POINT_KEY = "ROOTNODE";
  private node: Map<string, Agent | IntentManagerAgent>;
  private edge: Map<string, Map<string, EdgeData>>;
  constructor() {
    this.node = new Map();
    this.edge = new Map([[this.ENTRY_POINT_KEY, new Map()]]);
  }

  getEntryPoint() {
    const entryPoint = this.getEdges(this.ENTRY_POINT_KEY);
    if (!entryPoint || entryPoint.length == 0) {
      throw new Error("Entry point not set");
    }
    return entryPoint;
  }

  setEntryPoint(
    name: string,
    prompt: string,
    memoryId?: string,
    functions?: string[]
  ) {
    this.edge.get(this.ENTRY_POINT_KEY)?.set(name, {
      to: name,
      from: this.ENTRY_POINT_KEY,
      prompt,
      memoryId: memoryId || undefined,
      functions: functions || undefined,
    });
  }

  addAgentNode(nodeconfig: {
    agent: Agent | IntentManagerAgent;
    nodeId: string;
  }) {
    this.node.set(nodeconfig.nodeId, nodeconfig.agent);
  }

  addEdge(edgeConfig: EdgeData) {
    if (this.edge.get(edgeConfig.from)) {
      this.edge.get(edgeConfig.from)?.set(edgeConfig.to, edgeConfig);
    } else {
      this.edge.set(edgeConfig.from, new Map([[edgeConfig.to, edgeConfig]]));
    }
  }

  getNode(name: string): Agent | IntentManagerAgent {
    const agent = this.node.get(name);
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
