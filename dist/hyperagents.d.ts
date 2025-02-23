interface AgentConfig {
    prompt: string;
    llm_model: string;
    public_desc: string;
}
declare class Agent {
    private prompt;
    private llm_model;
    private public_desc;
    constructor(config: AgentConfig);
    getPrompt(): string;
    getLlmModel(): string;
    getPublicDesc(): string;
    runPrompt(input: string): Promise<string>;
}
export default Agent;
