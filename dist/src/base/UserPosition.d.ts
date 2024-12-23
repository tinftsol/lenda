/**
 * Represents an active lending position for a wallet.
 */
export interface IWalletPosition {
    id?: number;
    walletAddress: string;
    protocolName: string;
    coinName: string;
    mintAddress: string;
    amount: number;
    startApy: number;
    startTime: number;
    currentPosition: number;
    latestApy: number;
}
/**
 * Represents a completed historical lending position.
 */
export interface IUserPositionHistory {
    id?: number;
    walletAddress: string;
    protocolName: string;
    coinName: string;
    mintAddress: string;
    startAmount: number;
    currentPosition: number;
    endAmount: number;
    profit: number;
    profitInUSD: number;
    startApy: number;
    endApy: number;
    startTime: number;
    endTime: number;
}
