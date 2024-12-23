import {Action, ActionExample, HandlerCallback, IAgentRuntime, Memory, State} from "@ai16z/eliza";
import { elizaLogger } from "@ai16z/eliza";
import {UserWalletsDatabase} from "../db/UserWalletsDatabase.ts";


// ✅
export const GetLinkedWalletsAction: Action = {
    name: "GET_LINKED_WALLETS",
    similes: ["MY_WALLETS", "SHOW_LINKED_WALLETS", "FETCH_MY_WALLETS"],
    description: "Fetch the wallets linked to the user.",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        return (
            text.includes("wallets") ||
            text.includes("addresses") ||
            text.includes("get my wallets")
        );
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        const userId = message.userId;

        if (!userId) {
            const responseMsg = { text: "I couldn't identify your user ID. Please try again." };
            callback?.(responseMsg);
            return false;
        }

        const walletDb = new UserWalletsDatabase(runtime.databaseAdapter.db);
        try {
            const linkedWallets = await walletDb.getWalletsByUserId(userId);

            if (!linkedWallets.length) {
                const responseMsg = { text: "You don't have any linked wallets yet. Use 'link my wallet' to add one!" };
                callback?.(responseMsg);
                return true;
            }

            const walletList = linkedWallets
                .map((wallet, index) => `${index + 1}. ${wallet.walletAddress}`)
                .join("\n");

            const responseMsg = {
                text: `🔗 Here are your linked wallets:\n\n${walletList}`,
            };

            callback?.(responseMsg);

            elizaLogger.info(`Fetched linked wallets for user ${userId}`);
            return true;
        } catch (error) {
            elizaLogger.error("Error fetching linked wallets:", error);
            const responseMsg = { text: "❌ There was an error fetching your linked wallets. Please try again later!" };
            callback?.(responseMsg);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Do I have any wallets linked?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Show me my linked wallets.",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me my addresses",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "my addresses",
                },
            },
        ],
    ] as ActionExample[][],
};
