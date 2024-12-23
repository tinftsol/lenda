import {composeContext, elizaLogger, generateText, IAgentRuntime, Memory, ModelClass} from "@ai16z/eliza";
import {SUPPORTED_POSITIONS_DETAILS, SupportedProtocols} from "./Constants.ts";

const extractCoinTemplate = `
# Task: Extract stablecoin names from the userPrompt.

From the following list of supported stablecoins: {{supportedCoins}}  
Identify any stablecoin names that were explicitly mentioned in the conversation.

If no stablecoins are mentioned, respond with ALL.

Recent userPrompt is:
{{userPrompt}}

Which stablecoins are mentioned? Return names without dots or special symbols. If there are few coins, use comma as separator.

Example #1: 
userPrompt: predict APY for USDC on Kamino
response: USDC

Example #2:
userPrompt: what will happen to USDT on MarginFi?
response: USDT

Example #3:
userPrompt: forecast lending trends for Kamino pools
response: ALL

Example #4: 
userPrompt: predict APY for USDC and USDT on Kamino
response: USDC,USDT
`;

export const determineCoinsToEvaluate = async (
    runtime: IAgentRuntime,
    message: Memory
): Promise<string[]> => {
    const supportedCoins = SUPPORTED_POSITIONS_DETAILS.map((coin) => coin.name).join(", ");
    const state = await runtime.composeState(message);
    state.supportedCoins = supportedCoins;
    state.userPrompt = message.content.text;

    const context = composeContext({
        state,
        template: extractCoinTemplate,
    });

    const coinsResponse = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
    });

    elizaLogger.info(`Extracted coins: ${coinsResponse}`);

    const coinsToCheck = coinsResponse
        .split(",")
        .map((coin) => coin.trim().toUpperCase())
        .filter((coin) => coin !== "");

    return coinsToCheck.includes("ALL") || coinsToCheck.length === 0
        ? SUPPORTED_POSITIONS_DETAILS.map((coin) => coin.name.toUpperCase())
        : coinsToCheck;
};
