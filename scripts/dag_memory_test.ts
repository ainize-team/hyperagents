import { AINetworkDAGMemory } from "../src/memory/AINetworkDAGMemory";
import { Message } from "../src/type";
import { v4 as uuidv4 } from "uuid";

/**
 * Example script demonstrating the usage of AINetworkDAGMemory
 */
async function main() {
  // Create memory instance with memory ID
  const memoryId = "example-chat";
  const memory = new AINetworkDAGMemory("localhost:50051", memoryId);
  
  try {
    // Initialize memory
    console.log(`Initializing memory with ID "${memoryId}"...`);
    await memory.init();
    
    // Load current messages
    console.log("Loading messages...");
    const messages = await memory.load();
    console.log(`Loaded ${messages.length} messages from memory "${memoryId}".`);
    
    // Display existing messages
    if (messages.length > 0) {
      console.log("Existing messages:");
      for (const msg of messages) {
        console.log(`${msg.author}: ${msg.content}`);
      }
    }
    
    // Add a new message
    const newMessage: Message = {
      id: uuidv4(),
      author: "user",
      content: "Hello! This is a message stored in AI Network DAG Memory with ID. 5"
    };
    
    console.log("\nAdding new message...");
    await memory.add(newMessage);
    console.log("Message added.");
    
    // Add a response message
    const responseMessage: Message = {
      id: uuidv4(),
      author: "assistant",
      content: "Hello! Your message was successfully stored in memory ID " + memoryId
    };
    
    console.log("Adding response message...");
    await memory.add(responseMessage);
    
    // Load updated messages
    console.log("\nLoading updated messages...");
    const updatedMessages = await memory.load();
    
    console.log(`Loaded ${updatedMessages.length} messages.`);
    console.log("All messages:");
    for (const msg of updatedMessages) {
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : "unknown";
      console.log(`[${time}] ${msg.author}: ${msg.content}`);
    }
    
    console.log("\nYou can access this memory later by using the same memory ID:");
    console.log(`Memory ID: ${memoryId}`);
    
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    // Clean up resources
    memory.close();
    console.log("Memory connection closed");
  }
}

// Run the main function
main().catch(console.error);
