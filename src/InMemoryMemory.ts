import { Memory, Message } from "./type";

class InMemoryMemory implements Memory {
  private static instance: InMemoryMemory;
  private memory: Array<Message>;

  private constructor() {
    this.memory = [];
  }

  public static getInstance(): InMemoryMemory {
    if (!InMemoryMemory.instance) {
      InMemoryMemory.instance = new InMemoryMemory();
    }
    return InMemoryMemory.instance;
  }

  async init(): Promise<void> {
    this.memory = [];
    return;
  }
  async add(data: Message): Promise<void> {
    this.memory.push(data);
    return;
  }
  async load(): Promise<Array<Message>> {
    return this.memory;
  }
  
}

export default InMemoryMemory;
