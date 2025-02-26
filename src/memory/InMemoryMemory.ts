import { Memory } from ".";
import { Message } from "../type";

class InMemoryMemory implements Memory {
  private static instance: InMemoryMemory;
  private memoryMap: Map<string, Message>;
  private memory: Array<Message>;

  private constructor() {
    this.memory = [];
    this.memoryMap = new Map();
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
    if (this.memoryMap.has(data.id)) {
      throw new Error(`Memory with id ${data.id} already exists`);
    }
    this.memoryMap.set(data.id, data);
    this.memory.push(data);
    return;
  }
  async load(): Promise<Array<Message>> {
    return this.memory;
  }

  async loadMap(): Promise<Map<string, Message>> {
    return this.memoryMap;
  }

  async getMessageById(id: string): Promise<Message> {
    if (!this.memoryMap.has(id)) {
      throw new Error(`Memory with id ${id} does not exist`);
    }
    return this.memoryMap.get(id)!;
  }

}

export default InMemoryMemory;
