import { Database } from "better-sqlite3";
import { UserWallet } from "../base/UserWallet.ts";
export declare class UserWalletsDatabase {
    private db;
    constructor(db: Database);
    /**
     * Initialize the database table.
     */
    private initTable;
    getWallets(): UserWallet[];
    /**
     * Add a new wallet for a user.
     * @param wallet UserWallet object containing userId, telegramUserId, and walletAddress.
     */
    addWallet(wallet: UserWallet): void;
    /**
     * Retrieve all wallets linked to a specific user ID.
     * @param userId Internal user ID.
     * @returns List of wallets linked to the user.
     */
    getWalletsByUserId(userId: string): UserWallet[];
    /**
     * Retrieve all wallets linked to a specific Telegram user ID.
     * @param telegramUserId Telegram-specific user ID.
     * @returns List of wallets linked to the Telegram user.
     */
    getWalletsByTelegramUserId(telegramUserId: string): UserWallet[];
    /**
     * Retrieve Telegram user ID based on the wallet address.
     * @param walletAddress Wallet address to search for.
     * @returns Telegram user ID or null if not found.
     */
    getTelegramIdByWallet(walletAddress: string): string | null;
    /**
     * Remove a wallet linked to a specific user and wallet address.
     * @param userId Internal user ID.
     * @param walletAddress Wallet address to unlink.
     */
    removeWallet(userId: string, walletAddress: string): void;
    /**
     * Remove all wallets from the user_wallets table.
     */
    removeAllWallets(): void;
}
