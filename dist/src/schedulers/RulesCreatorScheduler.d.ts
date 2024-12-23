import { IAgentRuntime } from "@ai16z/eliza";
export declare class HistoricalRulesScheduler {
    runtime: IAgentRuntime;
    private isProcessing;
    private stopProcessing;
    constructor(runtime: IAgentRuntime);
    start(): Promise<void>;
    stop(): Promise<void>;
    private sleep;
}
