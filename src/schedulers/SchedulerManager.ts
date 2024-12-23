import {elizaLogger, IAgentRuntime, stringToUuid} from "@ai16z/eliza";
import {CreateRulesBasedOnHistoricalDataAction} from "../action/CreateRulesBasedOnHistoricalDataEvaluatorAction.ts";
import {LendProtocolSpecificsAction} from "../action/GetLendProtocolSpecificsAction.ts";
import {AnalyzeSpecificsPoolDynamicsAction} from "../action/AnalyzeSpecificsPoolDynamicsAction.ts";
import {GetWalletPositionsAction} from "../action/GetWalletPositionsAction.ts";
import {UserWalletsDatabase} from "../db/UserWalletsDatabase.ts";

export class SchedulerManager {
    runtime: IAgentRuntime;
    private stopAllSchedulers: boolean = false;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
    }

    async startAll() {
        elizaLogger.log("Starting all schedulers...");

        // Start schedulers as independent async tasks
        this.startLendProtocolSpecificsScheduler();
        this.startRulesEvaluatorScheduler();
        this.startAnalyzesAction();
        this.startAnalyzeWalletPositionsAction()
    }

    private async startLendProtocolSpecificsScheduler() {
        const interval = 60_000 * 20;

        const runTask = async () => {
            if (this.stopAllSchedulers) return;
            try {
                const message = {
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    roomId: this.runtime.agentId,
                    content: {text: "Fetch lending specifics for all protocols"},
                };

                const state = await this.runtime.composeState(message);

                await LendProtocolSpecificsAction.handler(this.runtime, message, state, {
                    includeLogs: true
                });

                elizaLogger.log("Successfully executed LendProtocolSpecificsAction.");
            } catch (error) {
                console.log("error: " + error.toString());
                elizaLogger.error("Error in Lend Protocol Specifics Scheduler:", error);
            } finally {
                if (!this.stopAllSchedulers) {
                    setTimeout(runTask, interval);
                }
            }
        };

        runTask();
    }

    private async startRulesEvaluatorScheduler() {
        const interval = 60_000 * 60; // 2 hours


        elizaLogger.log("Starting Rules Evaluator Scheduler...");

        const runTask = async () => {
            if (this.stopAllSchedulers) return;
            try {
                const message = {
                    userId: stringToUuid("global_user"),
                    agentId: this.runtime.agentId,
                    roomId: this.runtime.agentId,
                    content: {text: "CreateRulesBasedOnHistoricalDataAction"},
                };

                const state = await this.runtime.composeState(message);

                await CreateRulesBasedOnHistoricalDataAction.handler(this.runtime, message, state);
            } catch (error) {
                elizaLogger.error("Error in Rules Evaluator Scheduler:", error);
            } finally {
                if (!this.stopAllSchedulers) {
                    setTimeout(runTask, interval);
                }
            }
        };

        runTask();
    }

    private async startAnalyzesAction() {
        const interval = 60_000 * 30; // 30 minutes


        elizaLogger.log("Starting Rules Evaluator Scheduler...");

        const runTask = async () => {
            if (this.stopAllSchedulers) return;

            try {
                const message = {
                    userId: stringToUuid("global_user"),
                    agentId: this.runtime.agentId,
                    roomId: this.runtime.agentId,
                    content: {text: "Analyze Kamino USDC, USDS and USDT markets"},
                };

                const state = await this.runtime.composeState(message);

                await AnalyzeSpecificsPoolDynamicsAction.handler(this.runtime, message, state, {
                    includeLogs: false,
                    shouldSendToX: true
                });

            } catch (error) {
                elizaLogger.error("Error in Rules Evaluator Scheduler:", error);
            } finally {
                if (!this.stopAllSchedulers) {
                    setTimeout(runTask, interval);
                }
            }
        };

        runTask();
    }

    private async startAnalyzeWalletPositionsAction() {
        const interval = 60_000 * 30;

        const runTask = async () => {
            if (this.stopAllSchedulers) return;
            try {
                const walletDb = new UserWalletsDatabase(this.runtime.databaseAdapter.db);
                const wallets = walletDb.getWallets()
                for (const wallet of wallets) {
                    const message = {
                        userId: this.runtime.agentId,
                        agentId: this.runtime.agentId,
                        roomId: this.runtime.agentId,
                        content: {text: `fetch wallet positions: ${wallet.walletAddress}`},
                    };

                    const state = await this.runtime.composeState(message);

                    await GetWalletPositionsAction.handler(this.runtime, message, state, {
                        includeLogs: false
                    });
                }

                elizaLogger.log("Successfully executed LendProtocolSpecificsAction.");
            } catch (error) {
                elizaLogger.error("Error in Lend Protocol Specifics Scheduler:", error);
            } finally {
                if (!this.stopAllSchedulers) {
                    setTimeout(runTask, interval);
                }
            }
        };

        runTask();
    }


    stopAll() {
        elizaLogger.log("Stopping all schedulers...");
        this.stopAllSchedulers = true;
    }
}
