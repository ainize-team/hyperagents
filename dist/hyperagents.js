"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const client = new openai_1.default({
    baseURL: process.env['OPENAI_BASE_URL'],
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});
class Agent {
    constructor(config) {
        this.prompt = config.prompt;
        this.llm_model = config.llm_model;
        this.public_desc = config.public_desc;
    }
    getPrompt() {
        return this.prompt;
    }
    getLlmModel() {
        return this.llm_model;
    }
    getPublicDesc() {
        return this.public_desc;
    }
    async runPrompt(input) {
        if (!this.prompt || !this.llm_model) {
            throw new Error("Prompt and LLM model must be set before running");
        }
        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: this.getLlmModel(),
        });
        return chatCompletion.choices[0].message.content || "";
    }
}
exports.default = Agent;
//# sourceMappingURL=hyperagents.js.map