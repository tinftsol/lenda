import {
    Action,
    ActionExample,
    composeContext,
    elizaLogger,
    generateText,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@ai16z/eliza";
import { PROTOCOLS_AND_PROVIDERS, SupportedProtocols } from "../helpers/Constants.ts";
import { LendingProtocolSpecificsDatabase } from "../db/LendingProtocolSpecificsDatabase.ts";
import { ProtocolPredictedApyDatabase } from "../db/ProtocolPredictedApyDatabase.ts";
import { ProtocolRulesDb } from "../db/ProtocolRulesDb.ts";
import { determineProtocolsToEvaluate } from "../helpers/DetermineProtocolsToEvaluate.ts";
import { determineCoinsToEvaluate } from "../helpers/DetermineCoinsToEvaluate.ts";
import {PredictedApyModel, ProtocolPredictedApy} from "../base/PredictedApy.ts";
import {sleep} from "@kamino-finance/klend-sdk";

const predictionTemplate = `
# Task: Predict future APY changes for a specific coin in a protocol.

You are tasked with analyzing the following historical and current data to predict APY (Annual Percentage Yield) changes for the next {{hours}} hours for a specified protocol and mint address. The analysis should consider patterns, trends, and rules for the protocol to provide accurate and confident predictions.

## Input Details:
- **Historical Data**: A chronological series of APY and related metrics for the specified mint address.
- **Current Data**: The latest state of APY, utilization rates, and liquidity for the specified mint address.
- **Rules**: Protocol-specific rules that influence APY behavior, utilization, or liquidity.

## Historical Data:
{{historicalData}}

## Current Data:
{{currentData}}

## Rules:
{{rules}}

## Current Time:
{{currentTimestamp}}

### Instructions:
1. **Analyze Trends**: Use historical data to identify significant trends or patterns in APY fluctuations.
2. **Incorporate Rules**: Apply the provided protocol rules to refine predictions and ensure logical consistency.
3. **Generate Predictions**: Predict APY changes starting from the given \`{{currentTimestamp}}\` for the next \`{{hours}}\` hours.
4. **Hourly Predictions**: The prediction must include APY values for each hour within the specified timeframe.
5. **Accurate Timestamps**: Ensure that each prediction includes the correct future timestamp (incremented by one hour from \`{{currentTimestamp}}\` for each prediction).

### Expected Output:
Respond with a valid JSON array structured as follows. **Do not include markdown, backticks, or extraneous formatting in your response**:
[
  {
        "timestamp": "Prediction timestamp. Y",
        "apy": "Predicted APY value"
  },
  ...
]

### Examples
[
  {
    "timestamp": 1698316800000, // 2024-10-26T13:00:00.000Z
    "apy": 3.65
  },
  {
    "timestamp": 1698320400000, // 2024-10-26T14:00:00.000Z
    "apy": 3.70
  },
  {
    "timestamp": 1698324000000, // 2024-10-26T15:00:00.000Z
    "apy": 2.9
  }
]
`;

export const PredictFutureAPYChangesAction: Action = {
    name: "PREDICT_FUTURE_APY_CHANGES",
    description:
        "Predicts future APY changes for a specific coin on a specified protocol over a user-defined timeframe.",
    similes: ["PREDICT_APY", "FUTURE_APY", "APY_FORECAST"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = ["predict", "future", "APY", "forecast", "lending", "trends"];
        return keywords.some((keyword) =>
            message.content.text.toLowerCase().includes(keyword)
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        const lendingDb = new LendingProtocolSpecificsDatabase(runtime.databaseAdapter.db);
        const predictionDb = new ProtocolPredictedApyDatabase(runtime.databaseAdapter.db);
        const rulesDb = new ProtocolRulesDb(runtime.databaseAdapter.db);
        const isLogsIncluded = _options["includeLogs"] ?? true;
        const hoursToPredict = parseInt(_options["hoursToPredict"] as string) || 6;

        const protocolsToEvaluate = await determineProtocolsToEvaluate(runtime, message);
        const coinsToEvaluate = await determineCoinsToEvaluate(runtime, message);

        // Ensure only one protocol and one coin is mentioned
        if (protocolsToEvaluate.length !== 1 || coinsToEvaluate.length !== 1) {
            if (isLogsIncluded) {
                elizaLogger.warn(
                    `Prediction requires exactly one protocol and one coin. Found protocols: ${protocolsToEvaluate}, coins: ${coinsToEvaluate}`
                );
            }
            callback?.({
                text: "Please specify exactly one protocol and one coin for prediction."
            });
            return true;
        }

        const protocol = protocolsToEvaluate[0];
        const coin = coinsToEvaluate[0];
        const provider = PROTOCOLS_AND_PROVIDERS[protocol as SupportedProtocols];


        if (!provider) {
            if (isLogsIncluded) {
                elizaLogger.warn(`Provider not found for protocol: ${protocol}`);
            }
            callback?.({
                text: `The specified protocol (${protocol}) is not supported.`
            });
            return true;
        }

        if (isLogsIncluded) {
            elizaLogger.info(`Fetching current stats for protocol: ${protocol}`);
        }

        const currentData = await provider.get(runtime, message);
        const reserve = currentData.reserves.find((res) => res.name.toUpperCase() === coin);

        if (!reserve) {
            if (isLogsIncluded) {
                elizaLogger.warn(`No reserve found for coin ${coin} in protocol ${protocol}`);
            }
            callback?.({
                text: `The specified coin (${coin}) is not available in protocol (${protocol}).`
            });
            return true;
        }

        const historicalEntries = lendingDb.getProtocolSpecificsByMintAddress(
            protocol,
            reserve.mintAddress
        );

        if (historicalEntries.length === 0) {
            if (isLogsIncluded) {
                elizaLogger.warn(
                    `No historical data found for ${coin} in ${protocol}`
                );
            }
            callback?.({
                text: `No historical data available for the specified coin (${coin}) in protocol (${protocol}).`
            });
            return true;
        }

        const protocolRules = rulesDb.getProtocolRule(protocol);

        // const lastPrediction = predictionDb.getLatestPrediction(
        //     protocol,
        //     reserve.mintAddress
        // );

        // if (
        //     lastPrediction &&
        //     Date.now() - lastPrediction.timeStamp < 60  * 60 * 1000 // 60 minutes
        // ) {
        //     if (isLogsIncluded) {
        //         elizaLogger.info(
        //             `Using recent prediction for ${coin} (${protocol}).`
        //         );
        //     }
        //     callback?.({
        //         text: `Using the most recent prediction for ${coin} on ${protocol}.`
        //     });
        //     return lastPrediction;
        // }

        if (isLogsIncluded) {
            elizaLogger.info("Composing context for APY prediction...");
        }

        const context = composeContext({
            state: {
                ...state,
                historicalData: JSON.stringify(historicalEntries),
                currentData: JSON.stringify({
                    protocol,
                    mintAddress: reserve.mintAddress,
                    currentAPY: reserve.apy,
                }),
                rules: JSON.stringify(protocolRules),
                hours: hoursToPredict,
                currentTimestamp: Date.now()
            },
            template: predictionTemplate,
        });

        if (isLogsIncluded) {
            elizaLogger.info("Generating APY prediction...");
        }

        const predictionResultText = await generateText({
            runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        console.log(predictionResultText)

        try {
            const predictionResult: PredictedApyModel[] = JSON.parse(predictionResultText);

            const predictedApy: ProtocolPredictedApy =  {
                protocolName: protocol,
                mintAddress: reserve.mintAddress,
                coinName: reserve.name,
                predictedApy: predictionResult,
                timeStamp: Date.now(),
            }

            predictionDb.savePrediction(predictedApy);

            if (isLogsIncluded) {
                elizaLogger.info("Prediction result: " + JSON.stringify(predictionResult));
            }

            await callback?.({
                text: `
📈 **Prediction Complete**:
🔹 **Protocol**: ${protocol}
🔹 **Coin**: ${coin}
🔹 **Current APY**: ${reserve.apy}% 

🔮 **Predicted APY Trends**:
${predictionResult
                    .map((prediction) =>
                        `   - Future Time: ${new Date(prediction.timestamp).toISOString()} | Predicted APY: ${prediction.apy}%`
                    )
                    .join("\n")}

✅ Predicted APYs have been successfully saved in the database.
`
            });

            return predictionResult;
        } catch (error) {
            console.log("ERROR " + error.toString())
            if (isLogsIncluded) {
                elizaLogger.error("Failed to parse prediction response:", error);
            }
            callback?.({
                text: "I encountered an error while predicting APY trends."
            });
        }

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Predict APY for USDC on Kamino for the next 6 hours." },
            },
        ],
        [
            {
                user: "{{user2}}",
                content: { text: "What will happen to APY for USDT on MarginFi in 6 hours?" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Forecast APY trends for USDC on Kamino." },
            },
        ],
    ] as ActionExample[][],
};
