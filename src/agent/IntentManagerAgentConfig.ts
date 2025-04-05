import fs from "fs";
import path from "path";
import { Memory } from "../memory";
import { MemoryType } from "../type";

interface Intent {
  type: string;
  example: string[];
}

export interface IntentManagerConfig {
  name: string;
  embeddingApiKey?: string;
  embeddingEndpoint?: string;
  embeddingApiVersion?: string;
  embeddingDeploymentName?: string;
  intent?: Intent[];
  memory?: Memory;
  memoryType?: MemoryType;
}

export function isIntentManagerConfig(
  obj: unknown
): obj is IntentManagerConfig {
  return typeof obj === "object" && obj !== null;
}

export function loadIntentManagerConfig(fileName: string): IntentManagerConfig {
  const filePath = path.join(__dirname, "../../agentConfigs", fileName);
  try {
    const rawData = fs.readFileSync(filePath, "utf8");
    const config = JSON.parse(rawData);

    if (!isIntentManagerConfig(config)) {
      throw new Error(`Invalid configuration format in ${filePath}`);
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to load agent config from ${filePath}: ${error}`);
  }
}
