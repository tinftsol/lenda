import { IAgentRuntime } from "@ai16z/eliza";
export declare class LendProtocolSpecificsScheduler {
    private runtime;
    private intervalId;
    private isProcessing;
    private stopProcessing;
    constructor(runtime: IAgentRuntime);
    start(): Promise<void>;
    stop(): Promise<void>;
    private sleep;
}
