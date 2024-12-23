import {Connection} from '@solana/web3.js';
import * as dotenv from 'dotenv';
import {SUPPORTED_POSITIONS_DETAILS, SupportedProtocols} from "./Constants.ts";
import {ISupportedPositionDetails} from "../base/SupportedPositionDetails.ts";
import {createJupiterApiClient} from '@jup-ag/api';
import {Scraper} from "agent-twitter-client";
import {DEFAULT_RECENT_SLOT_DURATION_MS, KaminoMarket, KaminoObligation} from "@kamino-finance/klend-sdk";

dotenv.config();
const scraper = new Scraper();

export const CONNECTION = createSolanaConnection()
const config = {
    basePath: 'https://mainnet.helius-rpc.com/?api-key=687f31e4-7909-407c-9c37-e7887b4bd311'
};
const jupiterApiClient = createJupiterApiClient(config); // config is optional

function createSolanaConnection(): Connection {
    const rpcUrl = process.env.RPC_URL;
    const apiKey = process.env.HELIUS_API_KEY;
    const fullUrl = rpcUrl + "/?api-key" + apiKey

    return new Connection("https://mainnet.helius-rpc.com/?api-key=687f31e4-7909-407c-9c37-e7887b4bd311", 'confirmed');
}

export async function getCurrentSlot(): Promise<number> {
    try {
        return await CONNECTION.getSlot();
    } catch (error) {
        console.error("Failed to fetch current slot:", error);
        throw error;
    }
}

// Filtering by Supported Protocol
export function getSupportedPositionsFor(protocol: SupportedProtocols): ISupportedPositionDetails[] {
    return SUPPORTED_POSITIONS_DETAILS.filter(position =>
        position.supportedProtocols.includes(protocol)
    );
}

export async function sendToX(text: String) {
    const isLoggedIn = await scraper.isLoggedIn();

    if (isLoggedIn) {
        const cookies = await scraper.getCookies();
        await scraper.setCookies(cookies);
        await scraper.sendTweet(`${text}`);
    } else {
        await scraper.login(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD);
        const cookies = await scraper.getCookies();
        await scraper.setCookies(cookies);

        await scraper.sendTweet(`${text}`);
    }
}

export function formatLargeNumber(value: number, decimals: number): number {
    return value / Math.pow(10, decimals); // Adjust the value using decimals
}

export async function getMarket({ connection, marketPubkey }) {
    const market = await KaminoMarket.load(connection, marketPubkey, DEFAULT_RECENT_SLOT_DURATION_MS);
    if (!market) {
        throw Error(`Could not load market ${marketPubkey.toString()}`);
    }
    return market;
}


export async function loadReserveData({ connection, marketPubkey, mintPubkey }) {
    const market = await getMarket({ connection, marketPubkey });
    const reserve = market.getReserveByMint(mintPubkey);
    if (!reserve) {
        throw Error(`Could not load reserve for ${mintPubkey.toString()}`);
    }
    const currentSlot = await connection.getSlot();

    return { market, reserve, currentSlot };
}