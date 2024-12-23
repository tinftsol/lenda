import {elizaLogger, IAgentRuntime, Memory, Provider, State} from "@ai16z/eliza";
import {KaminoMarket} from "@kamino-finance/klend-sdk";
import {PublicKey} from "@solana/web3.js";
import {CONNECTION, formatLargeNumber, getCurrentSlot, getSupportedPositionsFor} from "../helpers/Utils.ts";
import {
    KAMINO_HACKATHON_MARKET,
    KAMINO_JLP_MARKET,
    SupportedProtocols,
    USDC_MINT_ADDRESS_PK,
    USDT_MINT_ADDRESS_PK
} from "../helpers/Constants.ts";
import {ILendReserveSpecific} from "../base/ILendReserveSpecific.ts";
import {ILendProtocolSpecific} from "../base/ILendProtocolSpecific.ts";


export const KaminoProtocolSpecificsProvider: Provider = {
    async get(runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<ILendProtocolSpecific> {
        const market = await KaminoMarket.load(CONNECTION, KAMINO_HACKATHON_MARKET, 450);
        await market.loadReserves();

        const supportedPositions =
            getSupportedPositionsFor(SupportedProtocols.KAMINO);

        const reserves: ILendReserveSpecific[] = [];
        const currentSlot = await getCurrentSlot()

        for (const position of supportedPositions) {
            const reserve = market.getReserveByMint(position.pk);

            if (reserve) {

                const decimals = reserve.stats.decimals
                const borrowedAmount = reserve.getBorrowedAmount();
                const liqAvailableAmount = reserve.getLiquidityAvailableAmount();
                const utilizationRate = reserve.calculateUtilizationRatio() * 100
                const apy = reserve.totalSupplyAPY(currentSlot) * 100
                const formattedLendLiquidity = formatLargeNumber(liqAvailableAmount.toNumber(), decimals) * 10; // bug in the kamino lib
                const formattedBorrowLiquidity = formatLargeNumber(borrowedAmount.toNumber(), decimals);
                const formattedBorrowCap = formatLargeNumber(reserve.stats.reserveBorrowLimit.toNumber(), decimals);
                const formattedSupplyCap = formatLargeNumber(reserve.stats.reserveDepositLimit.toNumber(), decimals);

                reserves.push({
                    protocol: SupportedProtocols.KAMINO,
                    name: position.name,
                    mintAddress: position.mint,
                    apy: apy,
                    lendLiquidity: formattedLendLiquidity,
                    borrowLiquidity: formattedBorrowLiquidity,
                    utilizationRate: utilizationRate,
                    borrowCap: formattedBorrowCap,
                    supplyCap: formattedSupplyCap,
                    LTV: reserve.stats.loanToValue || 0,
                    updateTime: Date.now(),
                    decimals: decimals
                });
            }
        }

        return {
            protocol: SupportedProtocols.KAMINO,
            reserves: reserves,
        };
    },
};