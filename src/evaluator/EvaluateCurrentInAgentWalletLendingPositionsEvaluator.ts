import {elizaLogger, Evaluator, generateText, IAgentRuntime, Memory, MemoryManager, ModelClass} from "@ai16z/eliza";

export const EvaluateSwitchFeasibilityEvaluator: Evaluator = {
    name: "KAMINO_PROTOCOL_SPECIFICS_EVALUATOR",
    description: "Evaluates the current stats of Kamino Protocol positions. " +
        "Notice interesting information and put it in the memory for future usage. " +
        "Utilizes current information to send the message for client providers such as X and telegram",
    alwaysRun: true,
    similes: ["KAMINO_STATS", "KAMINO_STABLE_STATS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return false
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        console.log("Evaluating Kamino Protocol Specifics...");

        return "TBD"
    },
    examples: [
        {
            context: "User asks about trending tokens",
            messages: [
                {
                    user: "{{user}}",
                    content: {
                        text: "What are the trending tokens today?",
                    },
                },
            ],
            outcome: `[
                text: "🚀 Promising Tokens:\\n\\n🔹 STAR CAT (SC) - Price Change: 159.03%\\nCurrent Price: $0.000616\\n",
            ]`,
        },
    ],
};
