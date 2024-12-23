export interface PredictedApyModel {
    timestamp: number;
    apy: number;
}
export interface ProtocolPredictedApy {
    id?: number;
    protocolName: string;
    mintAddress: string;
    coinName: string;
    predictedApy: PredictedApyModel[];
    timeStamp: number;
}
