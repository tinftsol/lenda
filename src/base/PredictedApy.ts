export interface PredictedApyModel {
    timestamp: number;
    apy: number;
}

// Main model for storing protocol APY predictions
export interface ProtocolPredictedApy {
    id?: number;
    protocolName: string;
    mintAddress: string;
    coinName: string;
    predictedApy: PredictedApyModel[];
    timeStamp: number;
}