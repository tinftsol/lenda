import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger, ActionExample,
} from "@ai16z/eliza";
import { KaminoProtocolWalletPositionProvider } from "../provider/KaminoProtocolWalletPositionProvider.ts";
import { UserWalletsDatabase } from "../db/UserWalletsDatabase.ts";
import { PublicKey } from "@solana/web3.js";
import { SupportedProtocols } from "../helpers/Constants.ts";
import {WalletPositionsDb} from "../db/LendingPositions.ts";

const WALLET_ADDRESS_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/;

export const GetWalletPositionsAction: Action = {
    name: "GET_WALLET_POSITIONS",
    similes: ["FETCH_WALLET_POSITIONS", "GET_LENDING_POSITIONS"],
    description:
        "Fetch wallet lending positions and update the active lending positions in the database.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return WALLET_ADDRESS_REGEX.test(message.content.text) || !!message.userId;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<any[]> => {
        const walletDb = new WalletPositionsDb(runtime.databaseAdapter.db);
        const isLogsIncluded = _options["includeLogs"] ?? true;

        let walletsToCheck: string[] = [];

        const matchedWallets = message.content.text.match(WALLET_ADDRESS_REGEX);
        if (matchedWallets) {
            walletsToCheck.push(...matchedWallets);
        }

        walletsToCheck = Array.from(new Set(walletsToCheck)); // Remove duplicates

        if (walletsToCheck.length === 0 && isLogsIncluded) {
            callback?.({ text: "No valid wallet addresses were found to check positions." });
            return []
        }

        const allPositions = [];

        for (const walletAddress of walletsToCheck) {
            try {
                const publicKey = new PublicKey(walletAddress);

                if (isLogsIncluded) {
                    elizaLogger.info(`Fetching positions for wallet: ${walletAddress}`);
                }

                state.walletAddress = publicKey.toBase58()

                const positions = await KaminoProtocolWalletPositionProvider.get(runtime, message, state);

                if (walletAddress == runtime.character.settings.secrets.WALLET_PUBLIC_KEY) {
                    for (const position of positions) {
                        walletDb.insertOrUpdateCurrentPosition(position);

                        if (isLogsIncluded) {
                            elizaLogger.info(
                                `Updated position for ${position.coinName} (${position.mintAddress}) with amount ${position.amount}`
                            );
                        }
                    }
                }

                allPositions.push(...positions);
            } catch (error) {
                console.log("error" + error.toString())
                elizaLogger.error(`Error processing wallet ${walletAddress}:`, error);
            }
        }

        if (isLogsIncluded && allPositions.length > 0) {
            let responseText = `📊 **Wallet Positions**:\n\n`;

            for (const position of allPositions) {
                responseText += `🔹 **${position.coinName}** (${position.protocolName}):\n`;
                responseText += `   - **Start Amount**: ${position.amount}\n`;
                responseText += `   - **Start APY**: ${position.startApy}\n`;
                responseText += `   - **Current Position**: ${position.currentPosition}\n`;
                responseText += `   - **Current APY**: ${position.latestApy}\n\n`;
            }

            callback?.({ text: responseText.trim() });
        } else if (allPositions.length === 0 && isLogsIncluded) {
            callback?.({ text: "No active positions were found for the specified wallets." });
        }

        return allPositions;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Fetch positions for wallet Fh3k9W9L3qJz6KLt3Wa3BjLjwq9P6ZDZmzNsZMV4eFwQ" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Get all my wallet positions" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "What are my linked wallet positions?" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Check all lending positions for my wallets." },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Update my wallet positions." },
            },
        ],
    ] as ActionExample[][],
};
