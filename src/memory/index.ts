import { Message } from "../type";

export interface Memory {
  init(): Promise<void>;
  add(data: Message): Promise<void>;
  load(): Promise<Array<Message>>;
  getMessageById(id: string): Promise<Message>;
  loadMap(): Promise<Map<string, Message>>;
}