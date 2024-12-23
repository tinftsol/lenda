import { PublicKey } from "@solana/web3.js";
export interface ISupportedPositionDetails {
    name: string;
    mint: string;
    pk: PublicKey;
    supportedProtocols: string[];
}
