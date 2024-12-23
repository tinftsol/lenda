import {Action, ActionExample, elizaLogger, HandlerCallback, IAgentRuntime, Memory, State,} from "@ai16z/eliza";
import {PredictFutureAPYChangesAction} from "./PredictFutureChangesForAPYInSpecificProtocolAction.ts";
import {PROTOCOLS_AND_PROVIDERS, SUPPORTED_POSITIONS_DETAILS} from "../helpers/Constants.ts";
import {GetWalletPositionsAction} from "./GetWalletPositionsAction.ts";

const analysisTemplate = `
# Task: Analyze Current Wallet Positions

You are tasked with analyzing the current wallet positions and providing a recommendation for switching to another protocol or coin based on future APY predictions and protocol rules.

## Input Details:
- **Current Positions**: A list of current positions with coin name, amount, and current APY.
- **Protocol Rules**: Protocol-specific rules that guide decision-making.
- **Future APY Predictions**: Predicted APYs for various coins and protocols over time.

## Instructions:
1. **Analyze Current Positions**: Evaluate the current positions based on their APY and amount.
2. **Incorporate Rules**: Apply protocol-specific rules to ensure the recommendations are aligned with constraints.
3. **Compare with Predictions**: Compare current positions with future APY predictions to identify better opportunities.
4. **Generate Recommendations**: Suggest switches to other coins or protocols based on potential profit and better APY.

### Expected Output:
Respond with a valid JSON array structured as follows:
[
  {
    "currentCoin": "USDC", // Current coin name
    "currentAmount": 1000, // Current amount in the position
    "currentAPY": 3.5, // Current APY
    "recommendedSwitch": {
      "coin": "USDT", // Recommended coin
      "protocol": "Kamino", // Recommended protocol
      "predictedAPY": 5.0, // Predicted APY
      "potentialProfit": 50, // Potential profit in USD
      "apyOverTime": [ // APY predictions over time
        { "timestamp": 1698315912000, "apy": 4.5 },
        { "timestamp": 1698319512000, "apy": 5.0 }
      ]
    }
  },
  ...
]

### Notes:
- Ensure output is concise and precise.
- Potential profit is calculated as the difference in APY applied to the current amount over one year.
- Ensure the response adheres to the JSON structure without additional comments or formatting.
`;

export const AnalyzeCurrentPositionAction: Action = {
    name: "ANALYZE_CURRENT_POSITION",
    description:
        "Analyzes current wallet positions and recommends switching to coins or protocols with better APY.",
    similes: ["ANALYZE_POSITION", "SWITCH_PROTOCOL", "OPTIMIZE_EARNINGS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = ["analyze", "position", "wallet", "switch", "protocol", "earnings"];
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
        const predictionAction = PredictFutureAPYChangesAction;

        elizaLogger.info("Fetching current wallet positions...");

        // Get current wallet positions
        const fetchWalletPositionsMessage = {
            userId: state.userId,
            agentId: runtime.agentId,
            roomId: runtime.agentId,
            content: {text: `fetch wallet positions: ${runtime.character.settings.secrets.WALLET_PUBLIC_KEY}`},
        };


        const positions = await GetWalletPositionsAction.handler(runtime, fetchWalletPositionsMessage, state, {
            includeLogs: false
        });

        elizaLogger.info("Fetching protocol rules and predictions...");

        const analysisResults = [];

        for (const supportedCoin of SUPPORTED_POSITIONS_DETAILS) {
            const coinName = supportedCoin.name;
            const protocolName = "KAMINO";

            elizaLogger.info(`Analyzing ${coinName} on ${protocolName}...`);

            const message = {
                userId: state.userId,
                agentId: runtime.agentId,
                roomId: state.roomId,
                content: { text: `Predict APY for ${coinName} on ${protocolName}.` },
            };

            const predictedApy = await predictionAction.handler(
                runtime,
                message,
                state,
                { includeLogs: false, hoursToPredict: 12 },
                undefined
            );

            if (predictedApy && Array.isArray(predictedApy)) {
                // Get the maximum predicted APY and the corresponding coin/protocol
                const maxPredictedAPY = Math.max(...predictedApy.map((p) => p.apy));
                const apyOverTime = predictedApy.map((p) => ({ timestamp: p.timestamp, apy: p.apy }));

                // Calculate potential profit based on the maximum APY
                const potentialProfit = (maxPredictedAPY - (positions[0]?.latestApy || 0)) * (positions[0]?.amount || 0);

                // Push analysis result for this coin
                analysisResults.push({
                    currentCoin: positions[0]?.coinName || "Unknown",
                    currentAmount: positions[0]?.amount || 0,
                    currentAPY: positions[0]?.latestApy || 0,
                    recommendedSwitch: {
                        coin: supportedCoin.name,
                        protocol: "KAMINO", // Static for now as we're analyzing Kamino
                        predictedAPY: maxPredictedAPY,
                        potentialProfit,
                        apyOverTime, // Include the entire APY prediction timeline for insights
                    },
                });
            }

        }

        elizaLogger.info("Analysis complete. Generating response...");

        if (analysisResults.length === 0) {
            callback?.({ text: "No better options were found based on the analysis." });
            return true;
        }

        let responseText = `📊 **Wallet Position Analysis**:

`;

        for (const result of analysisResults) {
            responseText += `🔹 **Current Position**:
`;
            responseText += `   - Coin: ${result.currentCoin}
`;
            responseText += `   - Amount: ${result.currentAmount}
`;
            responseText += `   - Current APY: ${result.currentAPY}%

`;
            responseText += `🔸 **Possible Switch**:
`;
            responseText += `   - Coin: ${result.recommendedSwitch.coin}
`;
            responseText += `   - Protocol: ${result.recommendedSwitch.protocol}
`;
            responseText += `   - Predicted APY: ${result.recommendedSwitch.predictedAPY}%
`;
            responseText += `   - Potential Profit: $${result.recommendedSwitch.potentialProfit.toFixed(
                2
            )}
`;
            responseText += `   - APY Over Time: ${result.recommendedSwitch.apyOverTime
                .map((apy) => `${apy.timestamp}: ${apy.apy}%`)
                .join(", ")}

`;
        }

        const bestSwitch = analysisResults.reduce((best, current) =>
            current.recommendedSwitch.potentialProfit >
            best.recommendedSwitch.potentialProfit
                ? current
                : best
        );

        responseText += `💡 **Decision**: Switch to ${bestSwitch.recommendedSwitch.protocol} and lend ${bestSwitch.recommendedSwitch.coin} for the best returns.`;

        callback?.({ text: responseText.trim() });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Analyze my wallet position and suggest better options." },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Which coin should I switch to for better APY?" },
            },
        ],
    ] as ActionExample[][],
};
