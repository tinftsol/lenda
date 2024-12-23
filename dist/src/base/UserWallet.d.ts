/**
 * Represents a user's linked wallet.
 */
export interface UserWallet {
    userId: string;
    telegramUserId: string;
    walletAddress: string;
    createdAt?: number;
}
