import sqlite3, {Database} from "better-sqlite3";

export interface ProtocolRule {
    protocolName: string; // Name of the protocol
    rule: string; // Rule description
    confidence: number; // Confidence score (e.g., 0-100)
}

export class ProtocolRulesDb {
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
            CREATE TABLE IF NOT EXISTS protocol_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                protocolName TEXT NOT NULL,
                rule TEXT NOT NULL,
                confidence INTEGER NOT NULL
            )
        `;
        this.db.exec(createTableQuery);
    }

    /**
     * Save a new rule for a protocol.
     * @param rule ProtocolRule object containing protocolName, rule, and confidence.
     */
    saveProtocolRule(rule: ProtocolRule) {
        const insertQuery = `
            INSERT INTO protocol_rules (protocolName, rule, confidence)
            VALUES (@protocolName, @rule, @confidence)
        `;
        this.db.prepare(insertQuery).run(rule);
    }

    /**
     * Get all rules for a specific protocol.
     * @param protocolName Name of the protocol.
     * @returns List of ProtocolRule objects for the given protocol.
     */
    getProtocolRule(protocolName: string): ProtocolRule[] {
        const selectQuery = `
            SELECT protocolName, rule, confidence FROM protocol_rules
            WHERE protocolName = ?
            ORDER BY id DESC 
            LIMIT 10
        `;
        return this.db.prepare(selectQuery).all(protocolName) as ProtocolRule[];
    }

    /**
     * Get all rules for a specific protocol with confidence equal to or greater than the given value.
     * @param protocolName Name of the protocol.
     * @param confidence Minimum confidence score.
     * @returns List of ProtocolRule objects matching the criteria.
     */
    getProtocolRuleWithConfidence(protocolName: string, confidence: number): ProtocolRule[] {
        const selectQuery = `
            SELECT protocolName, rule, confidence FROM protocol_rules
            WHERE protocolName = ? AND confidence >= ?
        `;
        return this.db.prepare(selectQuery).all(protocolName, confidence) as ProtocolRule[];
    }

    dropAllRecords() {
        const deleteQuery = `
            DELETE FROM protocol_rules
        `;
        this.db.prepare(deleteQuery).run();
    }
}
