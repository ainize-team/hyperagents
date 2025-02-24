import { Memory } from "./type";

class InMemoryMemory implements Memory {
  private memory: Array<string>;

  constructor() {
    this.memory = [];
  }

  async init(): Promise<void> {
    this.memory = [];
    return;
  }
  async add(data: string): Promise<void> {
    this.memory.push(data);
    return;
  }
  async load(): Promise<Array<string>> {
    return this.memory;
  }
  
}

export default InMemoryMemory;
