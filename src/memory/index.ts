import { Message } from "../type";

export interface Memory {
  init(): Promise<void>;
  add(data: Message): Promise<void>;
  load(): Promise<Array<Message>>;
}