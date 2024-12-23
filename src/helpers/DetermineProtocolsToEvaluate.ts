import {composeContext, elizaLogger, generateText, IAgentRuntime, Memory, ModelClass} from "@ai16z/eliza";
import {SupportedProtocols} from "./Constants.ts";

const extractProtocolTemplate = `
# Task: Extract protocol names from the userPrompt.

From the following list of supported protocols: {{supportedProtocols}}  
Identify any protocol names that were explicitly mentioned in the conversation.

If no protocols are mentioned, respond with ALL.

Recent userPrompt is:
{{userPrompt}}

Which protocols are mentioned? Return it name without dots or special symbols. If there are few protocols, use comma as separator

Example #1: 
userPrompt: what are the lending details in Kamino?
response: KAMINO

Example #2:
userPrompt: what are the stats of Solend and Kamino currently?
response: SOLEND,KAMINO
`;

export const determineProtocolsToEvaluate = async (
    runtime: IAgentRuntime,
    message: Memory
): Promise<string[]> => {
    const supportedProtocols = Object.values(SupportedProtocols).join(", ");
    const state = await runtime.composeState(message)
    state.supportedProtocols = supportedProtocols
    state.userPrompt = message.content.text

    const context = composeContext({
        state: state,
        template: extractProtocolTemplate,
    });

    const protocolsResponse = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
    });

    elizaLogger.info(`So protocols responses are: ${protocolsResponse}`)

    const protocolsToCheck = protocolsResponse
        .split(",")
        .map((p) => p.trim().toUpperCase())
        .filter((p) => p !== "");

    return protocolsToCheck.includes("ALL") || protocolsToCheck.length === 0
        ? Object.values(SupportedProtocols)
        : protocolsToCheck;
};