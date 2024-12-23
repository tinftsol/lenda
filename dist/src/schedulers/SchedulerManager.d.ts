import { IAgentRuntime } from "@ai16z/eliza";
export declare class SchedulerManager {
    runtime: IAgentRuntime;
    private stopAllSchedulers;
    constructor(runtime: IAgentRuntime);
    startAll(): Promise<void>;
    private startLendProtocolSpecificsScheduler;
    private startRulesEvaluatorScheduler;
    private startAnalyzesAction;
    private startAnalyzeWalletPositionsAction;
    stopAll(): void;
}
