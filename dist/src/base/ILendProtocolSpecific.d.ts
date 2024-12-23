import { ILendReserveSpecific } from "./ILendReserveSpecific.ts";
export interface ILendProtocolSpecific {
    protocol: string;
    reserves: ILendReserveSpecific[];
}
