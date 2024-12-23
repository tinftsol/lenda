import sqlite3, {Database} from "better-sqlite3";
import {UserWallet} from "../base/UserWallet.ts";


export class UserWalletsDatabase {
    private db: sqlite3.Database;

    constructor(db: Database) {
        this.db = db;
        this.initTable();
    }

    /**
     * Initialize the database table.
     */
    private initTable() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS user_wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                telegramUserId TEXT NOT NULL,
                walletAddress TEXT NOT NULL,
                createdAt INTEGER NOT NULL
            )
        `;
        this.db.exec(createTableQuery);
    }

    getWallets(): UserWallet[] {
        const selectQuery = `
            SELECT * FROM user_wallets
        `;
        return this.db.prepare(selectQuery).all() as UserWallet[];
    }

    /**
     * Add a new wallet for a user.
     * @param wallet UserWallet object containing userId, telegramUserId, and walletAddress.
     */
    addWallet(wallet: UserWallet) {
        const insertQuery = `
            INSERT INTO user_wallets (userId, telegramUserId, walletAddress, createdAt)
            VALUES (@userId, @telegramUserId, @walletAddress, @createdAt)
        `;
        this.db.prepare(insertQuery).run({
            ...wallet,
            createdAt: wallet.createdAt || Date.now(),
        });
    }

    /**
     * Retrieve all wallets linked to a specific user ID.
     * @param userId Internal user ID.
     * @returns List of wallets linked to the user.
     */
    getWalletsByUserId(userId: string): UserWallet[] {
        const selectQuery = `
            SELECT * FROM user_wallets
            WHERE userId = ?
        `;
        return this.db.prepare(selectQuery).all(userId) as UserWallet[];
    }

    /**
     * Retrieve all wallets linked to a specific Telegram user ID.
     * @param telegramUserId Telegram-specific user ID.
     * @returns List of wallets linked to the Telegram user.
     */
    getWalletsByTelegramUserId(telegramUserId: string): UserWallet[] {
        const selectQuery = `
            SELECT * FROM user_wallets
            WHERE telegramUserId = ?
        `;
        return this.db.prepare(selectQuery).all(telegramUserId) as UserWallet[];
    }

    /**
     * Retrieve Telegram user ID based on the wallet address.
     * @param walletAddress Wallet address to search for.
     * @returns Telegram user ID or null if not found.
     */
    getTelegramIdByWallet(walletAddress: string): string | null {
        const selectQuery = `
            SELECT telegramUserId FROM user_wallets
            WHERE walletAddress = ?
            LIMIT 1
        `;
        const result = this.db.prepare(selectQuery).get(walletAddress) as UserWallet;
        return result ? result.telegramUserId : null;
    }

    /**
     * Remove a wallet linked to a specific user and wallet address.
     * @param userId Internal user ID.
     * @param walletAddress Wallet address to unlink.
     */
    removeWallet(userId: string, walletAddress: string) {
        const deleteQuery = `
            DELETE FROM user_wallets
            WHERE userId = ? AND walletAddress = ?
        `;
        this.db.prepare(deleteQuery).run(userId, walletAddress);
    }

    /**
     * Remove all wallets from the user_wallets table.
     */
    removeAllWallets() {
        const deleteQuery = `
        DELETE FROM user_wallets
    `;
        this.db.prepare(deleteQuery).run();
    }

}
