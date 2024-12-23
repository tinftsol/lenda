export interface ILendReserveSpecific {
    protocol: string,
    name: string; // name of the coin
    mintAddress: string; // Mint address of the stablecoin
    apy: number; // Current APY
    lendLiquidity: number; // Available liquidity for lending
    borrowLiquidity: number; // Available liquidity for borrowing
    utilizationRate: number; // Pool utilization rate (%)
    borrowCap: number; // Borrow limit
    supplyCap: number; // Supply limit
    LTV: number; // Loan-to-Value ratio
    updateTime: number;
    decimals?: number;
}