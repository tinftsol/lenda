import {Action, ActionExample, elizaLogger, HandlerCallback, IAgentRuntime, Memory, State} from "@ai16z/eliza";
import {PublicKey} from "@solana/web3.js";
import {UserWalletsDatabase} from "../db/UserWalletsDatabase.ts";

const WALLET_ADDRESS_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/;

// ✅
// !telegramId bounded needed!
export const LinkWalletAction: Action = {
    name: "LINK_WALLET",
    similes: ["ADD_WALLET", "LINK_WALLET", "REGISTER_WALLET"],
    description: "Link / add / register the user's wallet address based on conversation",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return WALLET_ADDRESS_REGEX.test(message.content.text);
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("HAHA")
        const text = message.content.text;
        const matchedWallet = text.match(WALLET_ADDRESS_REGEX);

        if (!matchedWallet) {
            const responseMsg = { text: "I couldn't find a valid wallet address in your message. Please try again!" };
            callback?.(responseMsg);
            return false;
        }

        const walletAddress = matchedWallet[0];

        try {
            new PublicKey(walletAddress);
        } catch (error) {
            const responseMsg = { text: "The wallet address you provided is invalid. Please check and try again!" };
            callback?.(responseMsg);
            return false;
        }

        const walletDb = new UserWalletsDatabase(runtime.databaseAdapter.db);
        const userId = message.userId || "unknown_user"; // Internal user ID
        const telegramId = "TODO"; // Get Telegram ID

        try {
            const addedWallets = walletDb.getWalletsByUserId(userId.toString());
            const isAlreadyAdded = addedWallets.some(
                (wallet) => wallet.walletAddress === walletAddress
            );

            if (isAlreadyAdded) {
                callback?.({
                    text: `⚠️ Wallet address ${walletAddress} is already linked to your account.`,
                });
                return false;
            }

            walletDb.addWallet({
                userId: userId.toString(),
                telegramUserId: telegramId,
                walletAddress: walletAddress,
                createdAt: Date.now(),
            });
            const responseMsg = {
                text: `✅ Your wallet address \`${walletAddress}\` has been successfully linked! I'll notify you regarding updates to your positions.`,
            };

            callback?.(responseMsg);

            elizaLogger.info(`Wallet linked: UserId=${userId}, Wallet=${walletAddress}`);
            return true;
        } catch (error) {
            elizaLogger.error("Error saving wallet to database:", error);
            const responseMsg = { text: "❌ There was an error linking your wallet. Please try again later!" };
            callback?.(responseMsg);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "3hAKKmR6XyBooQBPezCbUMhrmcyTkt38sRJm2thKytWc this is my address which lends",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Could you add my address 3hAKKmR6XyBooQBPezCbUMhrmcyTkt38sRJm2thKytWc",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Add my wallet 3hAKKmR6XyBooQBPezCbUMhrmcyTkt38sRJm2thKytWc",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "My wallet is 5TQwHyZbedaH4Pcthj1Hxf5GqcigL6qWuB7YEsBtqvhr",
                },
            },
        ],
    ] as ActionExample[][],

};
