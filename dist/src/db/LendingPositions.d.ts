import { Database } from "better-sqlite3";
import { IWalletPosition } from "../base/UserPosition.ts";
export declare class WalletPositionsDb {
    private db;
    constructor(db: Database);
    /**
     * Initialize the `current_positions` table if it does not exist.
     */
    private initializeTable;
    /**
     * Insert or update a lending position.
     */
    insertOrUpdateCurrentPosition(position: IWalletPosition): void;
    /**
     * Get all active positions for a given wallet address.
     */
    getActivePositions(walletAddress: string): IWalletPosition[];
    /**
     * Get a single active position by wallet address, mint address, and protocol name.
     */
    getActivePositionByMintAndProtocol(walletAddress: string, mintAddress: string, protocolName: string): IWalletPosition | null;
    /**
     * Remove a specific position by wallet address and mint address.
     */
    removePosition(walletAddress: string, mintAddress: string): void;
    /**
     * Remove all positions from the `current_positions` table.
     */
    removeAllPositions(): void;
}
