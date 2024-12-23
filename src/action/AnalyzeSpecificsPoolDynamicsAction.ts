import {
    Action,
    ActionExample,
    composeContext,
    elizaLogger,
    generateObjectArray,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@ai16z/eliza";
import {PROTOCOLS_AND_PROVIDERS, SupportedProtocols} from "../helpers/Constants.ts";
import {determineProtocolsToEvaluate} from "../helpers/DetermineProtocolsToEvaluate.ts";
import {LendingProtocolSpecificsDatabase} from "../db/LendingProtocolSpecificsDatabase.ts";
import {ProtocolRulesDb} from "../db/ProtocolRulesDb.ts";
import {determineCoinsToEvaluate} from "../helpers/DetermineCoinsToEvaluate.ts";
import {sendToX} from "../helpers/Utils.ts";

const analyzeTemplate = `
# Task: Analyze lending pool trends and provide insights.

You are an AI agent tasked with analyzing historical and current data for lending pools. Use the provided **historical data**, **current data**, and **existing rules** to identify trends and generate actionable insights. Your observations should be engaging and suitable for posts on X.

---

## Input Data:

### Historical Data:
{{historicalData}}

### Current Data:
{{currentData}}

### Existing Rules:
{{existingRules}}

---

## Instructions:

**1. Analyze Trends Across the Entire Interval:**
- Compare **historical data** with **current data** over the full interval (from the first timestamp to the last) to analyze:
  - **APY Change**: Describe how APY has evolved over the interval, noting significant increases, decreases, or periods of stability.
  - **Utilization Change**: Highlight trends in utilization rates and correlate them with APY and liquidity changes.
  - **Liquidity Change**: Identify shifts in lendLiquidity and borrowLiquidity, noting their potential effects on pool dynamics.

**2. Generate Insights:**
- Based on your analysis, create a maximum of **two insights** for each pool:
  - **Integrate APY and liquidity changes** to provide actionable, engaging observations.
  - Use concise and well-written language that is suitable for posts on X.
  - Highlight how observed changes might impact users or the protocol, and include forward-looking implications where relevant.

**3. Use Existing Rules:**
- Validate your findings against the provided **existing rules**.
- Highlight any deviations or anomalies that do not align with the rules.

**4. Output Requirements:**
- Provide data in the specified format (see "Expected Output").
- Ensure JSON is properly formatted and free of syntax errors.

---

## Expected Output:

Respond with a valid JSON array as follows. **Do not include markdown or formatting like \`\`\`json**:
[
  {
    "pool": "POOL_NAME",
    "protocol": "PROTOCOL_NAME",
    "apy": "CURRENT_APY",
    "apyChange": "APY change description based on full interval analysis",
    "utilizationChange": "Utilization change description based on full interval analysis",
    "liquidityChange": "Liquidity change description based on full interval analysis",
    "insights": [
      "First observation integrating APY and liquidity trends. Include Protocol name there.",
      "Second observation integrating utilization and liquidity trends. Include Protocol name there."
    ]
  },
  ...
]

---

## Examples:

1. **Pool**: USDT Pool
   - **Protocol**: Compound
   - **APY**: "9.78%"
   - **APY Change**: "APY decreased from a high of 13.49% to 9.78%, showing a downward trend as the utilization stabilized."
   - **Utilization Change**: "Utilization rate fluctuated, peaking at 88.25% and settling at 86.45%, indicating a slight decrease in borrowing demand."
   - **Liquidity Change**: "LendLiquidity saw minor fluctuations with a slight increase to 4.3 trillion, while borrowLiquidity increased to 27.2 trillion, indicating a marginal rise in borrowing activity."
   - **Insights**:
     - "APY in the USDT pool of @Compound has dropped by nearly 4%, reflecting stabilized utilization at 86.45% and reduced borrower appetite."
     - "The recent 27.2 millions uptick in borrowLiquidity hints at a recovery in borrowing interest, potentially reversing the current APY trend."

2. **Pool**: DAI Pool
   - **Protocol**: Aave
   - **APY**: "2.5%"
   - **APY Change**: "APY dropped by 2% over the last month due to increased lendLiquidity."
   - **Utilization Change**: "Utilization fell from 80% to 65%, correlating with increased supply and reduced borrowing."
   - **Liquidity Change**: "LendLiquidity increased by 1M DAI, while borrowLiquidity remained constant."
   - **Insights**:
     - "The DAI pool's on Aave APY has softened to 2.5%, reflecting oversupply as lendLiquidity increased by 1M."
     - "Lower borrowing demand has driven utilization down by 15%, creating less favorable conditions for lenders."

---

## Additional Notes:
- Ensure the insights are tied to observed data and offer actionable or engaging takeaways.
- Validate trends against existing rules and highlight anomalies if they arise.
- Focus on integrating APY, utilization, and liquidity changes to create comprehensive observations.
- Use the insights to highlight potential risks, opportunities, or forward-looking implications.
- Ensure the output JSON is properly formatted for seamless parsing.

---

Thank you for delivering high-quality analyses and observations for lending pool trends!
`;

const selectTopInsightTemplate = `
# Task: Select the most impactful insight.

Given the following insights:
{{insights}}

Choose the single most impactful and concise insight for posting on X (Twitter). Do not exceed 280 characters. Provide a short, engaging, and actionable insight without hashtags or emojis.

Respond with the insight as plain text, no additional formatting or quotation marks.
`;



export const AnalyzeSpecificsPoolDynamicsAction: Action = {
    name: "ANALYZE_SPECIFICS_POOL_DYNAMICS",
    description:
        "Analyzes historical and current lending pool dynamics, providing insights into APY, utilization, and liquidity trends.",
    similes: ["ANALYZE_POOL", "POOL_DYNAMICS", "CHECK_LENDING_STATS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = ["lend", "apy", "kamino", "marginfi", "liquidity", "borrow"];
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
        const isLogsIncluded = _options["includeLogs"] ?? true
        const shouldSendToX = _options["shouldSendToX"]

        const lendingDb = new LendingProtocolSpecificsDatabase(runtime.databaseAdapter.db);
        const rulesDb = new ProtocolRulesDb(runtime.databaseAdapter.db);

        const protocolsToEvaluate = await determineProtocolsToEvaluate(runtime, message);
        const coinsToEvaluate = await determineCoinsToEvaluate(runtime, message);

        if (isLogsIncluded) {
            elizaLogger.info(`Analyzing pools for protocols: ${protocolsToEvaluate}`);
        }

        const results = [];

        for (const protocol of protocolsToEvaluate) {
            const provider = PROTOCOLS_AND_PROVIDERS[protocol as SupportedProtocols];
            const currentData = await provider.get(runtime, message);
            const rules = rulesDb.getProtocolRule(protocol).slice(0, 10);

            const protocolResults = [];

            for (const reserve of currentData.reserves) {
                if (!coinsToEvaluate.includes(reserve.name.toUpperCase())) continue;

                const historicalEntries = lendingDb.getProtocolSpecificsByMintAddress(
                    protocol,
                    reserve.mintAddress
                );

                if (historicalEntries.length === 0) {
                    continue;
                }

                const context = composeContext({
                    state: {
                        ...state,
                        currentData: JSON.stringify(reserve),
                        historicalData: JSON.stringify(historicalEntries),
                        rules: JSON.stringify(rules),
                    },
                    template: analyzeTemplate,
                });

                const analysis = await generateObjectArray({
                    runtime,
                    context,
                    modelClass: ModelClass.LARGE,
                });

                protocolResults.push(...analysis);
            }

            results.push({ protocol, analysis: protocolResults });
        }

        if (results.length === 0) {
            if (isLogsIncluded) {
                callback?.({text: "I couldn't fetch enough data to analyze the pool trends."});
            }
            return true;
        }

        let responseText = "📊 **Lending Pool Dynamics Analysis**:\n\n";
        const randomAnalysis =
            results[Math.floor(Math.random() * results.length)].analysis;

        let xText = randomAnalysis[Math.floor(Math.random() * randomAnalysis.length)].insights[0];

        for (const protocolResult of results) {
            responseText += `🔹 **Protocol: ${protocolResult.protocol}**\n\n`;
            for (const pool of protocolResult.analysis) {
                responseText += `   - **Pool**: ${pool.pool}\n`;
                responseText += `   - **APY**: ${pool.apy}\n`;
                responseText += `   - **APY Change**: ${pool.apyChange}\n`;
                responseText += `   - **Utilization Change**: ${pool.utilizationChange}\n`;
                responseText += `   - **Liquidity Change**: ${pool.liquidityChange}\n`;
                responseText += `   - **Insights**: ${pool.insights}\n\n`;
            }
        }
        if (isLogsIncluded) {
            callback?.({text: responseText.trim()});
        }

        if (xText != '' && shouldSendToX) {
            await sendToX(xText)
        }

        return true;
    },
        examples: [
            [
                {
                    user: "{{user1}}",
                    content: { text: "Can you analyze Kamino lending pools?" },
                },
            ],
            [
                {
                    user: "{{user1}}",
                    content: { text: "What are the dynamics of all lending pools?" },
                },
            ],
            [
                {
                    user: "{{user1}}",
                    content: { text: "Tell me how USDC pool on MarginFi is performing." },
                },
            ],
            [
                {
                    user: "{{user1}}",
                    content: { text: "Analyze the trends for Kamino and MarginFi pools." },
                },
            ],
            [
                {
                    user: "{{user1}}",
                    content: { text: "What changes happened in the lending stats recently?" },
                },
            ],
        ] as ActionExample[][]
};
