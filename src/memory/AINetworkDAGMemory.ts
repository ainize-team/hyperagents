import { Message } from "../type";
import { Memory } from ".";
import { update_root_to_ain_blockchain, get_root_from_ain_blockchain } from "./AINetworkDAGRootUpdater";

// Import the AINetworkDAGClient
const AINetworkDAGClient = require('ai-network-dag-client');

/**
 * Memory implementation using AINetworkDAG
 */
export class AINetworkDAGMemory implements Memory {
  private client: any;
  private serverAddress: string;
  private memoryId: string;
  private rootCid: string | null;
  private messages: Array<Message>;
  private initialized: boolean;
  
  /**
   * @param serverAddress AINetworkDAG server address
   * @param memoryId Unique identifier for this memory instance
   */
  constructor(serverAddress: string = 'localhost:50051', memoryId: string = 'default') {
    this.client = null;
    this.serverAddress = serverAddress;
    this.memoryId = memoryId;
    this.rootCid = null;
    this.messages = [];
    this.initialized = false;
  }

  getMessageById(id: string): Promise<Message> {
    throw new Error("Method not implemented.");
  }

  loadMap(): Promise<Map<string, Message>> {
    throw new Error("Method not implemented.");
  }
    
  /**
   * Initialize the memory
   */
  async init(): Promise<void> {
    try {
      // Create AINetworkDAG client
      this.client = new AINetworkDAGClient(this.serverAddress);
      console.log(`AINetworkDAGMemory: Connected to ${this.serverAddress}`);
      
      try {
        // Try to get the memory root using memoryId
        const rootCid = await get_root_from_ain_blockchain(this.memoryId);
        
        if (rootCid) {
          this.rootCid = rootCid;
          console.log(`AINetworkDAGMemory: Found existing memory with ID "${this.memoryId}", root CID: ${this.rootCid}`);
          
          // Load existing messages
          await this.load();
        }
      } catch (error) {
        // Memory with this ID doesn't exist yet, which is fine
        console.log(`AINetworkDAGMemory: No existing memory found with ID "${this.memoryId}"`);
      }
      
      this.initialized = true;
      
    } catch (error) {
      console.error('AINetworkDAGMemory: Failed to connect to server:', error);
      throw new Error('Failed to connect to AINetworkDAG server');
    }
  }
  
  /**
   * Add a message to memory
   * @param message Message to add
   */
  async add(message: Message): Promise<void> {
    if (!this.initialized) {
      throw new Error('Memory not initialized. Call init() first.');
    }
    
    try {
      // Add timestamp if not provided
      if (!message.timestamp) {
        message.timestamp = Date.now();
      }
      
      // Store just the single message
      const content = await this.client.add({
        message: JSON.stringify(message),
        children: this.rootCid ? [this.rootCid] : [] // Link to previous message as child
      });
      
      // Update the root CID
      const oldRootCid = this.rootCid;
      this.rootCid = content.cid;
      
      // Add to local message array for caching
      this.messages.push(message);
      
      console.log(`AINetworkDAGMemory: Added message with CID: ${this.rootCid}`);
      
      // Update the memory index with the new root CID
      if (this.rootCid) {
        await update_root_to_ain_blockchain(this.rootCid, this.memoryId);
      }
      console.log(`AINetworkDAGMemory: Updated memory index for ID "${this.memoryId}"`);
      
    } catch (error) {
      console.error('AINetworkDAGMemory: Error adding message:', error);
      throw new Error('Failed to add message to memory');
    }
  }
  
  /**
   * Load messages from memory
   * @returns Array of messages
   */
  async load(): Promise<Array<Message>> {
    if (!this.client) {
      throw new Error('Memory not initialized. Call init() first.');
    }
    
    // Clear the messages array
    this.messages = [];
    
    // If no root CID, return empty array
    if (!this.rootCid) {
      console.warn('AINetworkDAGMemory: No messages found.');
      return this.messages;
    }
    
    try {
      // Recursively load all messages
      await this.loadMessageChain(this.rootCid);
      
      // Reverse the array to get chronological order (oldest first)
      this.messages.reverse();
      
      console.log(`AINetworkDAGMemory: Loaded ${this.messages.length} messages from memory "${this.memoryId}"`);
      return this.messages;
      
    } catch (error) {
      console.error('AINetworkDAGMemory: Error loading messages:', error);
      throw new Error('Failed to load messages');
    }
  }
  
  /**
   * Recursively load message chain from a given CID
   * @param cid The CID to start loading from
   */
  private async loadMessageChain(cid: string): Promise<void> {
    try {
      // Get content from CID
      const content = await this.client.get(cid);
      
      if (content && content.message) {
        // Parse the message
        try {
          const message = JSON.parse(content.message);
          this.messages.push(message);
          
          // If has children, load them recursively
          if (content.children && content.children.length > 0) {
            // Load only the first child (that's our message chain)
            await this.loadMessageChain(content.children[0]);
          }
        } catch (parseError) {
          console.error('AINetworkDAGMemory: Error parsing message JSON:', parseError);
        }
      }
    } catch (error) {
      console.error(`AINetworkDAGMemory: Error loading message with CID ${cid}:`, error);
    }
  }
  
  /**
   * Clean up resources
   */
  close(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.initialized = false;
      console.log('AINetworkDAGMemory: Connection closed');
    }
  }
}
