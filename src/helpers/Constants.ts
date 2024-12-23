import {PublicKey} from "@solana/web3.js";
import {ISupportedPositionDetails} from "../base/SupportedPositionDetails.ts";
import {KaminoProtocolSpecificsProvider} from "../provider/KaminoProtocolSpecificsProvider.ts";

export const KAMINO_JLP_MARKET = new PublicKey("DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek");
export const KAMINO_MAIN_MARKET = new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");

// TODO: support list of marketss
export const KAMINO_HACKATHON_MARKET = KAMINO_MAIN_MARKET

export enum SupportedProtocols {
    KAMINO = "KAMINO",
    SOLEND = "SOLEND",
}

export const USDC_MINT_ADDRESS =
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

export const USDS_MINT_ADDRESS =
    "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"

export const USDT_MINT_ADDRESS =
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"

export const USDC_MINT_ADDRESS_PK =
    new PublicKey(USDC_MINT_ADDRESS)

export const USDT_MINT_ADDRESS_PK =
    new PublicKey(USDT_MINT_ADDRESS)

export const USDS_MINT_ADDRESS_PK =
    new PublicKey(USDS_MINT_ADDRESS)

export const USDS_POSITION_DETAILS: ISupportedPositionDetails = {
    name: "USDS",
    mint: USDS_MINT_ADDRESS,
    pk: USDS_MINT_ADDRESS_PK,
    supportedProtocols: [SupportedProtocols.KAMINO, SupportedProtocols.SOLEND],
};

export const USDC_POSITION_DETAILS: ISupportedPositionDetails = {
    name: "USDC",
    mint: USDC_MINT_ADDRESS,
    pk: USDC_MINT_ADDRESS_PK,
    supportedProtocols: [SupportedProtocols.KAMINO, SupportedProtocols.SOLEND],
};

export const USDT_POSITION_DETAILS: ISupportedPositionDetails = {
    name: "USDT",
    mint: USDT_MINT_ADDRESS,
    pk: USDT_MINT_ADDRESS_PK,
    supportedProtocols: [SupportedProtocols.KAMINO, SupportedProtocols.SOLEND],
};

export const PROTOCOL_MEMORY_POSTFIX = "_protocol_memory"

export const SUPPORTED_POSITIONS_DETAILS: ISupportedPositionDetails[] = [
    USDC_POSITION_DETAILS,
    USDT_POSITION_DETAILS,
    USDS_POSITION_DETAILS
]

export const PROTOCOLS_AND_PROVIDERS = {
    [SupportedProtocols.KAMINO]: KaminoProtocolSpecificsProvider,
    // Add future providers when available
};

