import { Database } from "better-sqlite3";
import { IUserPositionHistory, IWalletPosition } from "../base/UserPosition.ts";

export class WalletPositionsDb {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
        this.initializeTable();
    }

    /**
     * Initialize the `current_positions` table if it does not exist.
     */
    private initializeTable() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS current_positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                walletAddress TEXT NOT NULL,
                protocolName TEXT NOT NULL,
                coinName TEXT NOT NULL,
                mintAddress TEXT NOT NULL,
                amount REAL NOT NULL,
                startApy REAL NOT NULL,
                startTime INTEGER NOT NULL,
                currentPosition REAL NOT NULL,
                latestApy REAL DEFAULT 0,
                UNIQUE(walletAddress, mintAddress)
            );
        `;
        this.db.prepare(createTableQuery).run();
    }

    /**
     * Insert or update a lending position.
     */
    insertOrUpdateCurrentPosition(position: IWalletPosition) {
        const insertOrUpdateQuery = `
            INSERT INTO current_positions (walletAddress, protocolName, coinName, mintAddress, amount, startApy, startTime, currentPosition, latestApy)
            VALUES (@walletAddress, @protocolName, @coinName, @mintAddress, @amount, @startApy, @startTime, @currentPosition, @latestApy)
            ON CONFLICT(walletAddress, mintAddress) DO UPDATE SET
                amount = excluded.amount,
                startApy = excluded.startApy,
                startTime = excluded.startTime,
                currentPosition = excluded.currentPosition,
                latestApy = excluded.latestApy;
        `;
        this.db.prepare(insertOrUpdateQuery).run(position);
    }

    /**
     * Get all active positions for a given wallet address.
     */
    getActivePositions(walletAddress: string): IWalletPosition[] {
        const query = `
            SELECT * FROM current_positions
            WHERE walletAddress = ?
        `;
        return this.db.prepare(query).all(walletAddress) as IWalletPosition[];
    }

    /**
     * Get a single active position by wallet address, mint address, and protocol name.
     */
    getActivePositionByMintAndProtocol(walletAddress: string, mintAddress: string, protocolName: string): IWalletPosition | null {
        const query = `
            SELECT * FROM current_positions
            WHERE walletAddress = ? AND mintAddress = ? AND protocolName = ?
            LIMIT 1;
        `;
        return this.db.prepare(query).get(walletAddress, mintAddress, protocolName) as IWalletPosition | null;
    }

    /**
     * Remove a specific position by wallet address and mint address.
     */
    removePosition(walletAddress: string, mintAddress: string) {
        const deleteQuery = `
            DELETE FROM current_positions
            WHERE walletAddress = ? AND mintAddress = ?;
        `;
        this.db.prepare(deleteQuery).run(walletAddress, mintAddress);
    }

    /**
     * Remove all positions from the `current_positions` table.
     */
    removeAllPositions() {
        const deleteQuery = `
            DELETE FROM current_positions;
        `;
        this.db.prepare(deleteQuery).run();
    }
}
