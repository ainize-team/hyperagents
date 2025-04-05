import Agent from "./agent/Agent";
import IntentManagerAgent from "./agent/IntentManagerAgent";
import Graph from "./Graph";
import { Memory } from "./memory";

class GraphTask {
  private graph: Graph;
  private memory: Memory;

  constructor(graph: Graph, memory: Memory) {
    this.graph = graph;
    this.memory = memory;
  }

  getMemory() {
    return this.memory;
  }

  async exportMemory(): Promise<string> {
    const messages = await this.memory.load();
    let html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversation Export</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
      }
      h1 {
        text-align: center;
        margin-bottom: 30px;
        color: #333;
      }
      .message {
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 20px;
      }
      .author {
        font-weight: bold;
        font-size: 1.2em;
        color: #2c3e50;
        margin-bottom: 5px;
      }
      .metadata {
        font-size: 0.8em;
        color: #7f8c8d;
        margin-bottom: 10px;
      }
      .content {
        background-color: #f9f9f9;
        border-left: 4px solid #3498db;
        padding: 10px 15px;
        margin-top: 10px;
      }
      
      /* Add styles for markdown elements */
      h2, h3, h4 {
        margin-top: 1em;
        margin-bottom: 0.5em;
        color: #2c3e50;
      }
      p {
        margin-bottom: 1em;
      }
      code {
        background-color: #f0f0f0;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
      }
      pre {
        background-color: #f0f0f0;
        padding: 10px;
        border-radius: 5px;
        overflow-x: auto;
      }
      blockquote {
        border-left: 3px solid #ccc;
        margin-left: 0;
        padding-left: 10px;
        color: #555;
      }
    </style>
  </head>
  <body>
    <h1>Conversation Export</h1>
  `;

    for (const message of messages) {
      html += `
    <div class="message">
      <div class="author">😀 ${this.escapeHTML(message.author)}</div>
      <div class="metadata">
        ID: ${this.escapeHTML(message.id)}<br>
        Timestamp: ${this.escapeHTML(message.timestamp?.toString() || "")}
      </div>
      <div class="content">
        ${this.convertToHTML(message.content)}
      </div>
    </div>
  `;
    }

    html += `
  </body>
  </html>`;

    return html;
  }

  // Helper method to escape HTML special characters
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Convert content to HTML, with special handling for markdown and HTML code blocks
  private convertToHTML(content: string): string {
    // First, check if the content appears to be HTML code (starts with a code block containing HTML)
    if (content.trim().startsWith("```html")) {
      // Extract the HTML code from between the code blocks
      const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch && htmlMatch[1]) {
        // Return the HTML code directly, without escaping
        return htmlMatch[1];
      }
    }

    // Process markdown headers
    let html = content
      .replace(/### (.*?)(\n|$)/g, "<h3>$1</h3>")
      .replace(/## (.*?)(\n|$)/g, "<h2>$1</h2>")
      .replace(/# (.*?)(\n|$)/g, "<h1>$1</h1>");

    // Process markdown lists
    html = html
      .replace(/^\s*- (.*?)(\n|$)/gm, "<li>$1</li>")
      .replace(/(<li>.*?<\/li>)(\n<li>.*?<\/li>)+/g, "<ul>$&</ul>");

    // Process markdown code blocks (non-HTML)
    html = html.replace(
      /```(?!html)(.*?)\n([\s\S]*?)```/g,
      "<pre><code>$2</code></pre>"
    );

    // Process markdown inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Process markdown bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Process markdown italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Process markdown blockquotes
    html = html.replace(/^> (.*?)(\n|$)/gm, "<blockquote>$1</blockquote>");

    // Convert newlines to <br> tags for non-HTML content
    if (!html.includes("<div") && !html.includes("<p>")) {
      html = html.replace(/\n/g, "<br>");
    }

    return html;
  }

  async runTask(input: string) {
    this.memory.add({
      id: "USER_INPUT",
      author: "user",
      content: input,
      timestamp: Date.now(),
    });
    let queue = this.graph.getEntryPoint();
    while (true) {
      const edge = queue.shift();

      if (!edge) {
        const messages = await this.memory.load();
        return messages[messages.length - 1].content;
      }
      const agent = this.graph.getNode(edge.to);

      const agentRunOutput = await agent.run(
        edge.prompt,
        edge.memoryId,
        edge.functions
      );

      console.log("\n--------- AGENT INFO ---------");
      console.log("agent: ", agent?.getName());
      console.log("\n--------- AGENT OUTPUT ---------");
      console.log("agentRunOutput: ", agentRunOutput);

      const edges = this.graph.getEdges(edge.to);

      if (agent instanceof IntentManagerAgent) {
        edges.forEach((e) => {
          const agent = this.graph.getNode(e.to);
          if (agent.getValidIntents().includes(agentRunOutput)) {
            queue.push(e);
          }
        });
      } else {
        edges.forEach((e) => {
          queue.push(e);
        });
      }
    }
  }
}
export default GraphTask;
