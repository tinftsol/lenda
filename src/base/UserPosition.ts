/**
 * Represents an active lending position for a wallet.
 */
export interface IWalletPosition {
    id?: number; // Auto-increment primary key
    walletAddress: string; // Wallet address for the position
    protocolName: string; // Lending protocol name (e.g., Kamino, Solend)
    coinName: string; // Stablecoin name (e.g., USDC, USDT)
    mintAddress: string; // Mint address of the stablecoin
    amount: number; // Initial lent amount
    startApy: number; // APY at the time of lending
    startTime: number; // Start timestamp
    currentPosition: number; // Represents the current lent amount
    latestApy: number; // latest known apy
}

/**
 * Represents a completed historical lending position.
 */
export interface IUserPositionHistory {
    id?: number; // Auto-increment primary key
    walletAddress: string; // Wallet address for the position
    protocolName: string; // Lending protocol name
    coinName: string; // Stablecoin name
    mintAddress: string; // Mint address of the stablecoin

    startAmount: number; // Initial amount lent
    currentPosition: number; // Final current position before closure
    endAmount: number; // Final amount after closing position
    profit: number; // Profit or loss amount
    profitInUSD: number; // Profit in USD equivalent

    // for the internal wallet
    startApy: number; // APY at the start of lending
    endApy: number; // APY at the time of withdrawal

    // for the internal wallet
    startTime: number; // Start timestamp
    endTime: number; // End timestamp
}
