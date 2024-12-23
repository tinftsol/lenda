import { Database } from "better-sqlite3";
import { ILendReserveSpecific } from "../base/ILendReserveSpecific.ts";
export declare class LendingProtocolSpecificsDatabase {
    private db;
    constructor(db: Database);
    /**
     * Initialize the database table.
     */
    private initTable;
    /**
     * Retrieve all specifics for a given protocol name.
     * @param protocol Name of the protocol.
     * @param mintAddress
     * @returns Array of ILendReserveSpecific.
     */
    getProtocolSpecificsByMintAddress(protocol: string, mintAddress: string): ILendReserveSpecific[];
    /**
     * Retrieve all specifics for a given protocol name.
     * @param protocol Name of the protocol.
     * @returns Array of ILendReserveSpecific.
     */
    getProtocolSpecifics(protocol: string): ILendReserveSpecific[];
    /**
     * Insert a specific reserve's details (allow duplicates).
     * @param reserve ILendReserveSpecific model.
     */
    putProtocolSpecifics(reserve: ILendReserveSpecific): void;
    /**
     * Delete a reserve's details based on its mintAddress.
     * @param mintAddress Mint address of the reserve to delete.
     */
    deleteProtocolSpecifics(mintAddress: string): void;
}
