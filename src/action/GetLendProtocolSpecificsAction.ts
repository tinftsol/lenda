import {Action, elizaLogger, HandlerCallback, IAgentRuntime, Memory, MemoryManager, State,} from "@ai16z/eliza";
import {PROTOCOL_MEMORY_POSTFIX, PROTOCOLS_AND_PROVIDERS, SupportedProtocols} from "../helpers/Constants.ts";
import {ILendProtocolSpecific} from "../base/ILendProtocolSpecific.ts";
import {LendingProtocolSpecificsDatabase} from "../db/LendingProtocolSpecificsDatabase.ts";
import {determineProtocolsToEvaluate} from "../helpers/DetermineProtocolsToEvaluate.ts";
import {sendToX} from "../helpers/Utils.ts";
import {KaminoProtocolWalletPositionProvider} from "../provider/KaminoProtocolWalletPositionProvider.ts";

const MAX_MEMORY_ENTRIES = 20;

// ✅
export const LendProtocolSpecificsAction: Action = {
    name: "LEND_PROTOCOL_SPECIFICS_ACTION",
    similes: ["LEND_STATS", "CHECK_APY", "LENDING_INFO", "LEND_POOLS"],
    description:
        "Fetch lending protocol stats (Kamino, MarginFi), save data to memory and database, and respond with APY details.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = ["lend", "apy", "kamino", "marginfi", "liquidity", "borrow"];
        return keywords.some((keyword) =>
            message.content.text.toLowerCase().includes(keyword)
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        const isLogsIncluded = _options["includeLogs"] ?? true

        if (isLogsIncluded) {
            elizaLogger.info(`Evaluating lending positions: ${message.content.text}`);
        }

        const lendingDb = new LendingProtocolSpecificsDatabase(runtime.databaseAdapter.db);

        const protocolsToEvaluate = await determineProtocolsToEvaluate(runtime, message);

        if (isLogsIncluded) {
            elizaLogger.info(`Evaluating Lending Protocol Specifics... Protocols: ${protocolsToEvaluate}`);
        }

        let responseText = `📊 Lending Protocol Stats:\n\n`;

        for (const protocol of protocolsToEvaluate) {
            const provider = PROTOCOLS_AND_PROVIDERS[protocol as SupportedProtocols];
            if (!provider && isLogsIncluded) {
                elizaLogger.warn(`No provider found for protocol: ${protocol}`);
                continue;
            }

            const protocolData: ILendProtocolSpecific = await provider.get(runtime, message);

            const memoryManager = new MemoryManager({
                runtime,
                tableName: `${protocol.toLowerCase()}${PROTOCOL_MEMORY_POSTFIX}`,
            });

            const updatedMemories: Memory[] = [];

            for (const reserve of protocolData.reserves) {
                lendingDb.putProtocolSpecifics({
                    protocol: protocol,
                    name: reserve.name,
                    mintAddress: reserve.mintAddress,
                    apy: reserve.apy,
                    lendLiquidity: reserve.lendLiquidity,
                    borrowLiquidity: reserve.borrowLiquidity,
                    utilizationRate: reserve.utilizationRate,
                    borrowCap: reserve.borrowCap,
                    supplyCap: reserve.supplyCap,
                    LTV: reserve.LTV,
                    updateTime: reserve.updateTime,
                });

                updatedMemories.push({
                    userId: message.userId,
                    agentId: runtime.agentId,
                    roomId: message.roomId,
                    content: { text: JSON.stringify(reserve) },
                    createdAt: Date.now(),
                });

                const text = `At a time: ${new Date().toLocaleString()}, Stablecoin: ${
                    reserve.name
                }, APY: ${reserve.apy.toFixed(2)}%, Protocol: ${protocol}`;

                await runtime.messageManager.createMemory({
                    userId: message.userId,
                    agentId: runtime.agentId,
                    roomId: message.roomId,
                    content: { text },
                    createdAt: Date.now(),
                });

                responseText += `🔹 Protocol ${reserve.protocol}, ${reserve.name} - APY: ${reserve.apy.toFixed(
                    2
                )}%, Utilization: ${reserve.utilizationRate.toFixed(2)}%\n`;
            }

            const existingMemories = await memoryManager.getMemories({
                roomId: message.roomId,
                count: MAX_MEMORY_ENTRIES - updatedMemories.length,
            });


            const allMemories = [...updatedMemories, ...existingMemories].slice(0, MAX_MEMORY_ENTRIES);

            for (const memory of allMemories) {
                await memoryManager.createMemory(memory, true);
            }

            if (isLogsIncluded) {
                elizaLogger.info(`Saved ${protocol} specifics to memory and database.`);
            }

        }

        if (isLogsIncluded) {
            callback?.({
                text:
                    responseText.trim() ||
                    "No data was retrieved for the specified lending protocols.",
            });

            elizaLogger.info("Lending Protocol specifics evaluation completed.");
        }

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Fetch Kamino stats." },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "📊 **Lending Protocol Stats**:\n\n🔹 **Kamino**:\n- Stablecoin: **USDC**\n  APY: **3.25%** | Utilization: **45.5%**\n  Lend Liquidity: **500,000** | Borrow Cap: **1,000,000**\n",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Show me APY for lending pools." },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "📊 **Lending Protocol Stats**:\n\n🔹 **Kamino**:\n- Stablecoin: **USDC**\n  APY: **3.25%** | Utilization: **45.5%**\n\n🔹 **MarginFi**:\n- Stablecoin: **USDT**\n  APY: **4.10%** | Utilization: **50.2%**\n",
                },
            },
        ],
    ],
};


