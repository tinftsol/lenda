/**
 * Represents a user's linked wallet.
 */
export interface UserWallet {
    userId: string; // Internal user ID
    telegramUserId: string; // Telegram user ID
    walletAddress: string; // Wallet address
    createdAt?: number; // Timestamp when the wallet was linked
}