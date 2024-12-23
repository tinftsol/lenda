import { Database } from "better-sqlite3";
export interface ProtocolRule {
    protocolName: string;
    rule: string;
    confidence: number;
}
export declare class ProtocolRulesDb {
    private db;
    constructor(db: Database);
    /**
     * Initialize the database table.
     */
    private initTable;
    /**
     * Save a new rule for a protocol.
     * @param rule ProtocolRule object containing protocolName, rule, and confidence.
     */
    saveProtocolRule(rule: ProtocolRule): void;
    /**
     * Get all rules for a specific protocol.
     * @param protocolName Name of the protocol.
     * @returns List of ProtocolRule objects for the given protocol.
     */
    getProtocolRule(protocolName: string): ProtocolRule[];
    /**
     * Get all rules for a specific protocol with confidence equal to or greater than the given value.
     * @param protocolName Name of the protocol.
     * @param confidence Minimum confidence score.
     * @returns List of ProtocolRule objects matching the criteria.
     */
    getProtocolRuleWithConfidence(protocolName: string, confidence: number): ProtocolRule[];
    dropAllRecords(): void;
}
