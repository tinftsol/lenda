import { elizaLogger, IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import {KaminoMarket, ObligationTypeTag} from "@kamino-finance/klend-sdk";
import { PublicKey } from "@solana/web3.js";
import { CONNECTION, formatLargeNumber, getCurrentSlot } from "../helpers/Utils.ts";
import {
    KAMINO_HACKATHON_MARKET,
    KAMINO_JLP_MARKET,
    KAMINO_MAIN_MARKET,
    SupportedProtocols
} from "../helpers/Constants.ts";
import { KaminoProtocolSpecificsProvider } from "./KaminoProtocolSpecificsProvider.ts";
import {IWalletPosition} from "../base/UserPosition.ts";
import {WalletPositionsDb} from "../db/LendingPositions.ts";


export const KaminoProtocolWalletPositionProvider: Provider = {
    async get(runtime: IAgentRuntime, message: Memory, _state?: State): Promise<IWalletPosition[]> {
        const walletAddress = _state.walletAddress ?? runtime.character.settings.secrets.WALLET_PUBLIC_KEY
        console.log("fetching wallet address: " + walletAddress)
        const market = await KaminoMarket.load(CONNECTION, KAMINO_HACKATHON_MARKET, 450);
        await market.loadReserves()
        const userPublicKey = new PublicKey(walletAddress);
        const allObligations = await market.getAllUserObligations(userPublicKey);
        const currentData = await KaminoProtocolSpecificsProvider.get(runtime, message);
        const walletPositionsDb = new WalletPositionsDb(runtime.databaseAdapter.db)
        const positions: IWalletPosition[] = [];

        for (const obligation of allObligations) {
            if (!obligation) continue;

            obligation.deposits.forEach((deposit, reserveKey) => {
                const matchingReserve = currentData.reserves.find(
                    (reserve) => reserve.mintAddress == deposit.mintAddress
                );

                if (matchingReserve) {
                    const activePosition = walletPositionsDb.getActivePositionByMintAndProtocol(
                        userPublicKey.toBase58(),
                        deposit.mintAddress.toBase58(),
                        SupportedProtocols.KAMINO,
                    );

                    let startAmount = formatLargeNumber(deposit.amount.toNumber(), matchingReserve.decimals);
                    let startApy = matchingReserve.apy;
                    let startTime = Date.now();

                    if (activePosition) {
                        startAmount = activePosition.amount;
                        startApy = activePosition.startApy;
                        startTime = activePosition.startTime;
                    }

                    const currentAmount = formatLargeNumber(deposit.amount.toNumber(), matchingReserve.decimals);

                    positions.push({
                        walletAddress: userPublicKey.toBase58(),
                        protocolName: SupportedProtocols.KAMINO,
                        coinName: matchingReserve.name,
                        mintAddress: deposit.mintAddress.toBase58(),
                        amount: startAmount,
                        startApy: startApy,
                        startTime: startTime,
                        currentPosition: currentAmount,
                        latestApy: matchingReserve.apy
                    });
                } else {
                    elizaLogger.warn(`Reserve stats not found for reserveKey: ${reserveKey.toBase58()}`);
                }
            });
        }

        elizaLogger.info(`Extracted ${positions.length} wallet positions for user ${userPublicKey.toString()}`);
        console.log(JSON.stringify(positions))
        return positions;
    },
};
