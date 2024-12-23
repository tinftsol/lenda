import sqlite3, {Database} from "better-sqlite3";
import {ILendReserveSpecific} from "../base/ILendReserveSpecific.ts";

export class LendingProtocolSpecificsDatabase {
    private db: sqlite3.Database;

    constructor(db: Database) {
        this.db = db;
        this.initTable();
    }

    /**
     * Initialize the database table.
     */
    private initTable() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS lending_protocol_specifics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                protocol TEXT NOT NULL,
                name TEXT NOT NULL,
                mintAddress TEXT NOT NULL,
                apy REAL NOT NULL,
                lendLiquidity REAL NOT NULL,
                borrowLiquidity REAL NOT NULL,
                utilizationRate REAL NOT NULL,
                borrowCap REAL NOT NULL,
                supplyCap REAL NOT NULL,
                LTV REAL NOT NULL,
                updateTime INTEGER NOT NULL
            )
        `;
        this.db.exec(createTableQuery);
    }

    /**
     * Retrieve all specifics for a given protocol name.
     * @param protocol Name of the protocol.
     * @param mintAddress
     * @returns Array of ILendReserveSpecific.
     */
    getProtocolSpecificsByMintAddress(protocol: string, mintAddress: string): ILendReserveSpecific[] {
        const query = `
        SELECT * FROM lending_protocol_specifics
        WHERE protocol = ? AND mintAddress = ?
        ORDER BY updateTime DESC
        LIMIT 10
    `;
        const rows = this.db.prepare(query).all(protocol, mintAddress);
        return rows as ILendReserveSpecific[];
    }

    /**
     * Retrieve all specifics for a given protocol name.
     * @param protocol Name of the protocol.
     * @returns Array of ILendReserveSpecific.
     */
    getProtocolSpecifics(protocol: string): ILendReserveSpecific[] {
        const query = `
        SELECT * FROM lending_protocol_specifics
        WHERE protocol = ?
        ORDER BY updateTime DESC
        LIMIT 20
    `;
        const rows = this.db.prepare(query).all(protocol);
        return rows as ILendReserveSpecific[];
    }



    /**
     * Insert a specific reserve's details (allow duplicates).
     * @param reserve ILendReserveSpecific model.
     */
    putProtocolSpecifics(reserve: ILendReserveSpecific) {
        const insertQuery = `
            INSERT INTO lending_protocol_specifics (
                protocol, name, mintAddress, apy, lendLiquidity, borrowLiquidity, 
                utilizationRate, borrowCap, supplyCap, LTV, updateTime
            ) VALUES (
                @protocol, @name, @mintAddress, @apy, @lendLiquidity, @borrowLiquidity,
                @utilizationRate, @borrowCap, @supplyCap, @LTV, @updateTime
            )
        `;
        this.db.prepare(insertQuery).run(reserve);
    }

    /**
     * Delete a reserve's details based on its mintAddress.
     * @param mintAddress Mint address of the reserve to delete.
     */
    deleteProtocolSpecifics(mintAddress: string) {
        const deleteQuery = `
            DELETE FROM lending_protocol_specifics
            WHERE mintAddress = ?
        `;
        this.db.prepare(deleteQuery).run(mintAddress);
    }


}
