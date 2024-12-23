import { IAgentRuntime, Memory } from "@ai16z/eliza";
export declare const determineProtocolsToEvaluate: (runtime: IAgentRuntime, message: Memory) => Promise<string[]>;
