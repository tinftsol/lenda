import {
    Action,
    ActionExample,
    elizaLogger,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
} from "@ai16z/eliza";

import {determineCoinsToEvaluate} from "../helpers/DetermineCoinsToEvaluate.ts";
import {PublicKey, Keypair, Connection, ComputeBudgetProgram} from "@solana/web3.js";
import BN from 'bn.js';
import {
    KaminoAction,
    buildVersionedTransaction,
    sendAndConfirmVersionedTransaction,
    VanillaObligation, PROGRAM_ID
} from "@kamino-finance/klend-sdk";
import {CONNECTION, getCurrentSlot, loadReserveData} from "../helpers/Utils.ts";
import {KaminoProtocolSpecificsProvider} from "../provider/KaminoProtocolSpecificsProvider.ts";
import {
    KAMINO_MAIN_MARKET,
    USDC_MINT_ADDRESS,
    USDC_MINT_ADDRESS_PK,
    USDT_MINT_ADDRESS_PK
} from "../helpers/Constants.ts";
import {WalletPositionsDb} from "../db/LendingPositions.ts";
import bs58 from "bs58";

export const LendLiquidityKaminoProtocolAction: Action = {
    name: "LEND_LIQUIDITY_KAMINO_PROTOCOL",
    description:
        "Allows users to lend a specified amount of a coin (e.g., USDC) to the Kamino protocol.",
    similes: ["LEND_LIQUIDITY", "DEPOSIT", "SUPPLY"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        const walletPositionsDb = new WalletPositionsDb(runtime.databaseAdapter.db);

        // Determine the coin and amount to lend
        const coinsToEvaluate = await determineCoinsToEvaluate(runtime, message);
        const amountMatch = message.content.text.match(/\b\d+(\.\d+)?\b/);

        if (coinsToEvaluate.length !== 1 || !amountMatch) {
            callback?.({text: "Please specify exactly one coin and a valid amount to lend."});
            return false;
        }

        const coin = coinsToEvaluate[0].toUpperCase();
        const amount = parseFloat(amountMatch[0]);

        elizaLogger.info(`Lending ${amount} ${coin} on Kamino`);

        try {

            const userKeypair = Keypair.fromSecretKey(
                bs58.decode(runtime.character.settings.secrets.WALLET_PRIVATE_KEY)
            );

            const {market, reserve: reserve} = await loadReserveData({
                connection: CONNECTION,
                marketPubkey: KAMINO_MAIN_MARKET,
                mintPubkey: USDC_MINT_ADDRESS_PK,
            });

            const depositAction = await KaminoAction.buildDepositTxns(
                market,
                new BN(amountToLamports(amount, reserve.stats.decimals)),
                reserve.getLiquidityMint(),
                new PublicKey(runtime.character.settings.secrets.WALLET_PUBLIC_KEY),
                new VanillaObligation(PROGRAM_ID),
            );

            const cu = 1_304_926;
            const microLamports = amountToLamports(0.003);

            const budget = [ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: cu })
                ]

            const tx = await buildVersionedTransaction(CONNECTION, userKeypair.publicKey, [
                ...budget,
                ...depositAction.setupIxs,
                ...depositAction.lendingIxs,
                ...depositAction.cleanupIxs,
            ]);

            tx.sign([userKeypair]);

            const latestBlockHash = await CONNECTION.getLatestBlockhash('processed');

            let blockhash = latestBlockHash.blockhash

            const hash = await sendTx({
                payer: userKeypair, transaction: tx, blockhash: blockhash
            });

            callback?.({
                text: `Successfully lent ${amount} ${coin} on Kamino.\n\n` +
                    `Transaction Hash: ${hash}\n` +
                    `solscan: https://solscan.io/tx/${hash} \n` +
                    `Your new position has been updated.`,
            });


            return true;
        } catch (error) {
            elizaLogger.error(`Error during lending operation: ${error}`);
            callback?.({
                text: `Failed to lend ${amount} ${coin} on Kamino. Please try again later.`,
            });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {text: "I want to lend 100 USDC on Kamino."},
            },
        ],
        [
            {
                user: "{{user2}}",
                content: {text: "Lend 50 USDT on Kamino protocol."},
            },
        ],
    ] as ActionExample[][],
};

const sendTx = async ({payer, transaction, blockhash, onlyHashNeeded = false}) => {
    console.log('Starting sendTx function');

    // Sign the transaction
    console.log('Signing the transaction');
    transaction.sign([payer]);
    console.log('Transaction signed');

    // Send the transaction
    console.log('Sending the transaction');
    let retries = 0
    let isSucceed = false;

    let transactionHash
    let parsedResult = null;

    while (!isSucceed && retries < 1) {
        try {
            retries += 1

            transactionHash = await CONNECTION.sendTransaction(transaction, {
                skipPreflight: true
            })

            isSucceed = true
            return transactionHash
            // console.log("Sending with blockhash:", blockhash)
            //
            // await confirmTransaction(CONNECTION, transactionHash, "confirmed", blockhash);
            //
            // isSucceed = true
        } catch (e) {
            console.log({e})
            console.log("Failed to send tx");
        }
    }

    return transactionHash
}


async function confirmTransaction(c, txSig, commitmentOrConfig, blockhash) {
    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(
            () => reject(new Error('30 second timeout: unable to confirm transaction')),
            30_000
        );

        console.log("Delay regarding the poll!")

        const config = {
            maxSupportedTransactionVersion: 0,
            ...(typeof commitmentOrConfig === 'string'
                ? {commitment: commitmentOrConfig}
                : commitmentOrConfig),
        };

        let initialBlockHash = 0

        let tx = await c.getParsedTransaction(txSig, config);
        while (tx === null) {
            let parsesBH = await c.isBlockhashValid(blockhash)

            if (initialBlockHash === 0) {
                initialBlockHash = parsesBH.context.slot
            }


            if (initialBlockHash + 151 <= parsesBH.context.slot) {
                tx = await c.getParsedTransaction(txSig, config);
                if (tx === null) {
                    reject(new Error('Transaction EXPIRED'))
                    break
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 300));
            tx = await c.getParsedTransaction(txSig, config);
            // console.log({ txInCicle: tx })
        }
        // console.log(JSON.stringify(tx))
        clearTimeout(timeout);
    });
}

const amountToLamports = (amount, decimals = 9) => {
    return (amount * (10 ** decimals));
}
