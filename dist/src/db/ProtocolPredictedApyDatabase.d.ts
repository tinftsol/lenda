import { Database } from "better-sqlite3";
import { ProtocolPredictedApy } from "../base/PredictedApy.ts";
export declare class ProtocolPredictedApyDatabase {
    private db;
    constructor(db: Database);
    private init;
    savePrediction(prediction: ProtocolPredictedApy): void;
    getPredictionsByProtocol(protocolName: string): ProtocolPredictedApy[];
    getLatestPrediction(protocolName: string, mintAddress: string): ProtocolPredictedApy | null;
    getAllPredictions(): ProtocolPredictedApy[];
}
