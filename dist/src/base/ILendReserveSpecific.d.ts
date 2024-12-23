export interface ILendReserveSpecific {
    protocol: string;
    name: string;
    mintAddress: string;
    apy: number;
    lendLiquidity: number;
    borrowLiquidity: number;
    utilizationRate: number;
    borrowCap: number;
    supplyCap: number;
    LTV: number;
    updateTime: number;
    decimals?: number;
}
