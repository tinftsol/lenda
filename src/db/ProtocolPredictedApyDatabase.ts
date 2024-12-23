import { Database } from "better-sqlite3";
import {ProtocolPredictedApy} from "../base/PredictedApy.ts";

export class ProtocolPredictedApyDatabase {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
        this.init();
    }

    private init() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS protocol_predicted_apy (
                protocolName TEXT,
                mintAddress TEXT,
                coinName TEXT,
                predictedApy TEXT,
                timeStamp INTEGER,
                PRIMARY KEY (protocolName, mintAddress)
            )
        `;
        this.db.prepare(createTableQuery).run();
    }

    savePrediction(prediction: ProtocolPredictedApy) {
        const insertQuery = `
            INSERT OR REPLACE INTO protocol_predicted_apy (
                protocolName,
                mintAddress,
                coinName,
                predictedApy,
                timeStamp
            ) VALUES (
                @protocolName,
                @mintAddress,
                @coinName,
                @predictedApy,
                @timeStamp
            )
        `;
        this.db.prepare(insertQuery).run({
            protocolName: prediction.protocolName,
            mintAddress: prediction.mintAddress,
            coinName: prediction.coinName,
            predictedApy: JSON.stringify(prediction.predictedApy),
            timeStamp: prediction.timeStamp,
        });
    }

    getPredictionsByProtocol(protocolName: string): ProtocolPredictedApy[] {
        const selectQuery = `
            SELECT * FROM protocol_predicted_apy
            WHERE protocolName = ?
        `;
        const rows = this.db.prepare(selectQuery).all(protocolName) as any[];
        return rows.map((row) => ({
            protocolName: row.protocolName,
            mintAddress: row.mintAddress,
            coinName: row.coinName,
            predictedApy: JSON.parse(row.predictedApy),
            timeStamp: row.timeStamp,
        })) as ProtocolPredictedApy[];
    }

    getLatestPrediction(protocolName: string, mintAddress: string): ProtocolPredictedApy | null {
        const selectQuery = `
            SELECT * FROM protocol_predicted_apy
            WHERE protocolName = ? AND mintAddress = ?
            ORDER BY timeStamp DESC
            LIMIT 1
        `;
        const row = this.db.prepare(selectQuery).get(protocolName, mintAddress) as any;
        return row
            ? {
                protocolName: row.protocolName,
                mintAddress: row.mintAddress,
                coinName: row.coinName,
                predictedApy: JSON.parse(row.predictedApy),
                timeStamp: row.timeStamp,
            }
            : null;
    }

    getAllPredictions(): ProtocolPredictedApy[] {
        const selectQuery = `
            SELECT * FROM protocol_predicted_apy
        `;
        const rows = this.db.prepare(selectQuery).all() as any[];
        return rows.map((row) => ({
            protocolName: row.protocolName,
            mintAddress: row.mintAddress,
            coinName: row.coinName,
            predictedApy: JSON.parse(row.predictedApy),
            timeStamp: row.timeStamp,
        })) as ProtocolPredictedApy[];
    }
}
