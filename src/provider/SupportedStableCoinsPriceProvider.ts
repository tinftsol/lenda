import {IAgentRuntime, Memory, Provider, State} from "@ai16z/eliza";
import {KaminoMarket} from "@kamino-finance/klend-sdk";
import {PublicKey} from "@solana/web3.js";
import {CONNECTION, getCurrentSlot, getSupportedPositionsFor} from "../helpers/Utils.ts";
import {SupportedProtocols, USDC_MINT_ADDRESS_PK, USDT_MINT_ADDRESS_PK} from "../helpers/Constants.ts";
import {ILendReserveSpecific} from "../base/ILendReserveSpecific.ts";
import {ILendProtocolSpecific} from "../base/ILendProtocolSpecific.ts";

// export const SupportedStableCoinsPriceProvider: Provider = {
//     async get(runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<LendProtocolSpecific> {
//         console.log("Fetching stables prices");
//     },
// };