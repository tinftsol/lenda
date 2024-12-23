import { Connection } from '@solana/web3.js';
import { SupportedProtocols } from "./Constants.ts";
import { ISupportedPositionDetails } from "../base/SupportedPositionDetails.ts";
import { KaminoMarket } from "@kamino-finance/klend-sdk";
export declare const CONNECTION: Connection;
export declare function getCurrentSlot(): Promise<number>;
export declare function getSupportedPositionsFor(protocol: SupportedProtocols): ISupportedPositionDetails[];
export declare function sendToX(text: String): Promise<void>;
export declare function formatLargeNumber(value: number, decimals: number): number;
export declare function getMarket({ connection, marketPubkey }: {
    connection: any;
    marketPubkey: any;
}): Promise<KaminoMarket>;
export declare function loadReserveData({ connection, marketPubkey, mintPubkey }: {
    connection: any;
    marketPubkey: any;
    mintPubkey: any;
}): Promise<{
    market: KaminoMarket;
    reserve: import("@kamino-finance/klend-sdk").KaminoReserve;
    currentSlot: any;
}>;
