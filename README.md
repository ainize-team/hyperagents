# Hyperagents Project

This project implements an automated system for writing, reviewing, and publishing news articles using various agents. Each agent performs a specific role and interacts through a graph structure.

## Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/kmh4500/hyperagents.git
cd hyperagents
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variables
Create a `.env` file in the project root directory and set the following environment variables:
```
GOOGLE_API_KEY=your_google_api_key
ORA_API_KEY=your_ora_api_key
OPENAI_BASE_URL=your_openai_base_url
OPENAI_API_KEY=your_openai_api_key
RESEARCHER_ETH_PRIVATE_KEY=your_researcher_eth_private_key
RESEARCHER_AIN_PRIVATE_KEY=your_researcher_ain_private_key
RESEARCHER_WALLET_DATA_STR=your_researcher_wallet_data_str
REVIEWER_ETH_PRIVATE_KEY=your_reviewer_eth_private_key
REVIEWER_WALLET_DATA_STR=your_reviewer_wallet_data_str
REPORTER_ETH_PRIVATE_KEY=your_reporter_eth_private_key
REPORTER_WALLET_DATA_STR=your_reporter_wallet_data_str
DIRECTOR_ETH_PRIVATE_KEY=your_director_eth_private_key
DIRECTOR_WALLET_DATA_STR=your_director_wallet_data_str
PUBLISHER_ETH_PRIVATE_KEY=your_publisher_eth_private_key
PUBLISHER_WALLET_DATA_STR=your_publisher_wallet_data_str
CFO_ETH_PRIVATE_KEY=your_cfo_eth_private_key
CFO_WALLET_DATA_STR=your_cfo_wallet_data_str
CDPNAME=your_cdpname
CDPKEY=your_cdpkey
```

## Usage

### 1. Run the Script
Execute the script to write a news article:
```bash
npm run start
```

### 2. Check the Results
After running the script, the results will be saved in the `result.html` file, and the conversation will be saved in the `conversation.md` file.

## Agent Configuration

Each agent is configured through a JSON file. For example, the `researcher.json` file has the following format:
```json
{
  "name": "Researcher",
  "role": "Research",
  "description": "Responsible for researching the requested content."
}
```

## Graph Structure

Interactions between agents are defined through a graph structure. For example, the edge from the `researcher-1` node to the `reviewer-1` node is defined as follows:
```typescript
graph.addEdge({
  from: "researcher-1",
  to: "reviewer-1",
  prompt: `...`,
  memoryId: "ARTICLE_GUIDE",
});
```

## Contribution

Contributions are welcome! You can contribute to the project by reporting bugs, requesting features, or submitting pull requests.

## License

This project is distributed under the MIT License. See the `LICENSE` file for more information.