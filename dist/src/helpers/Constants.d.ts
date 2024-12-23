import { PublicKey } from "@solana/web3.js";
import { ISupportedPositionDetails } from "../base/SupportedPositionDetails.ts";
export declare const KAMINO_JLP_MARKET: PublicKey;
export declare const KAMINO_MAIN_MARKET: PublicKey;
export declare const KAMINO_HACKATHON_MARKET: PublicKey;
export declare enum SupportedProtocols {
    KAMINO = "KAMINO",
    SOLEND = "SOLEND"
}
export declare const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export declare const USDS_MINT_ADDRESS = "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA";
export declare const USDT_MINT_ADDRESS = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
export declare const USDC_MINT_ADDRESS_PK: PublicKey;
export declare const USDT_MINT_ADDRESS_PK: PublicKey;
export declare const USDS_MINT_ADDRESS_PK: PublicKey;
export declare const USDS_POSITION_DETAILS: ISupportedPositionDetails;
export declare const USDC_POSITION_DETAILS: ISupportedPositionDetails;
export declare const USDT_POSITION_DETAILS: ISupportedPositionDetails;
export declare const PROTOCOL_MEMORY_POSTFIX = "_protocol_memory";
export declare const SUPPORTED_POSITIONS_DETAILS: ISupportedPositionDetails[];
export declare const PROTOCOLS_AND_PROVIDERS: {
    KAMINO: import("@ai16z/eliza").Provider;
};
