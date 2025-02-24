interface AgentConfig {
    prompt: string;
    llmModel: string;
    publicDesc: string;
}
declare class Agent {
    private prompt;
    private llmModel;
    private publicDesc;
    constructor(config: AgentConfig);
    getPrompt(): string;
    getLlmModel(): string;
    getPublicDesc(): string;
    runPrompt(input: string): Promise<string>;
}
export default Agent;
