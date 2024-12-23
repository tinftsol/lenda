import { ILendReserveSpecific } from "./ILendReserveSpecific.ts";
export interface LendProtocolSpecific {
    protocol: string;
    reserves: ILendReserveSpecific[];
}
