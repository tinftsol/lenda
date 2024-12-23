import {
    Action,
    composeContext,
    elizaLogger,
    generateText,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@ai16z/eliza";
import {LendingProtocolSpecificsDatabase} from "../db/LendingProtocolSpecificsDatabase.ts";
import {ProtocolRulesDb, ProtocolRule} from "../db/ProtocolRulesDb.ts";
import {PROTOCOLS_AND_PROVIDERS, SupportedProtocols} from "../helpers/Constants.ts";
import {Scraper} from "agent-twitter-client";
import {sendToX} from "../helpers/Utils.ts";


const createRulesTemplate = `
# Task: Develop rules based on historical data for APY changes in lending protocols.

## Overview:
You are an AI agent tasked with analyzing historical data from lending protocols to identify patterns and relationships in APY changes. These rules will provide insights into the behavior of APYs across protocols and stablecoins, helping understand the key factors that influence these changes. The rules should be data-driven, clear, and actionable.

### Metrics Provided:
Each protocol consists of different reserves (e.g., USDC, USDT) with the following metrics:
- protocol: string; // Name of the protocol
- mintAddress: string; // Mint address of the stablecoin
- apy: number; // Current APY
- lendLiquidity: number; // Available liquidity for lending
- borrowLiquidity: number; // Available liquidity for borrowing
- utilizationRate: number; // Pool utilization rate (%)
- borrowCap: number; // Borrow limit
- supplyCap: number; // Supply limit
- LTV: number; // Loan-to-Value ratio
- name: string; // Name of the stablecoin
- updateTime: number; // the time when this data is provided

---

### Historical Data Provided:
{{historicalData}}

---

### Existing Rules:
{{existingRules}}

---

### Updated Instructions:
**1. Analyze Historical Data:**
- Identify consistent patterns, trends, or anomalies in the historical data (e.g., relationships between utilization rate, liquidity, and APY changes).
- Focus on understanding how metrics like utilization rate, lendLiquidity, borrowLiquidity, and supplyCap correlate with changes in APY.
- Use the **\`updateTime\`** field to track the time-based dynamics in the data and observe how metrics change over time.
- Match rules to specific assets (e.g., USDC, USDT) to ensure the rules are tied to the characteristics of the analyzed asset or reserve.
- IMPORTANT: do not repeat yourself! check the latest {{existingRules}} and decide whether you need to create a new one.

**2. Develop Rules Based on Patterns:**
- Create rules that describe consistent behaviors or relationships observed in the data (e.g., "When utilization exceeds 90%, APY increases by X%").
- Base rules on clear, data-supported patterns without making future predictions.
- Avoid speculation and focus only on observed patterns from the historical data.

**3. Refine or Merge Rules:**
- Compare new rules with existing ones to avoid duplication.
- Merge or update rules to enhance their reliability and applicability.

**4. Specify Rule Details:**
For each rule, provide:
   - **Protocol Name**: The protocol or stablecoin the rule applies to.
   - **Rule Description**: Clearly explain the relationship or behavior observed in the data.
   - **Confidence Score**: Assign a score (0–100) reflecting the reliability of the rule based on the data.

**5. Highlight Key Patterns:**
- Emphasize significant correlations (e.g., high utilization correlates with increased APY).
- Note any anomalies (e.g., sudden drops in liquidity that disrupt usual patterns).

---

### Additional Considerations:
- **Risk Identification**: Highlight conditions that could indicate risks (e.g., very high utilization or rapid liquidity outflows).
- **Generalizability**: Ensure rules are specific to the data but, where possible, highlight patterns that apply across multiple protocols.

---

### Expected Output:
Respond with a valid JSON array as follows. **Do not include markdown or formatting like \`\`\`json**:
[
  {
    "protocolName": "PROTOCOL_NAME",
    "rule": "Description of the rule based on observed data.",
    "confidence": 95
  },
  ...
]

---

### Examples:
1. **Rule**: "A 20% drop in lendLiquidity of USDC within an hour correlates with a 5% APY decline."
   - **Confidence**: 85
   
2. **Rule**: "When supplyCap is reached and utilization remains >90%, APY stabilizes around 6%."
   - **Confidence**: 92

3. **Rule**: "When LTV exceeds 75% for reserves with utilization >80%, borrowLiquidity reduces sharply, increasing APY volatility."
   - **Confidence**: 88
---

### Outputs to Avoid:
- Rules without clear logic or unsupported by data.
- Predictions of future APY changes.
- Duplicates of existing rules unless they offer significant improvement.

### Notes:
- Focus on identifying patterns and relationships directly from historical data.
- Avoid speculative or predictive statements.
- Ensure outputs are actionable and generalizable across protocols.
- Generate a maximum of two rules based on the given data.

---

Thank you for creating high-quality rules to improve APY analysis!
`;


export const CreateRulesBasedOnHistoricalDataAction: Action = {
    name: "CREATE_RULES_BASED_ON_HISTORICAL_DATA",
    description:
        "Analyzes historical data for lending protocols and creates or updates rules based on trends and existing rules.",
    similes: ["GENERATE_RULES", "HISTORICAL_ANALYSIS_RULES"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: (response: { text: string }) => void
    ) => {
        const lendingDb = new LendingProtocolSpecificsDatabase(runtime.databaseAdapter.db);
        const rulesDb = new ProtocolRulesDb(runtime.databaseAdapter.db);
        // rulesDb.dropAllRecords()
        elizaLogger.info("Starting rule creation based on historical data...");

        const supportedProtocols = Object.values(SupportedProtocols)
        const rulesToCreate: ProtocolRule[] = [];

        for (const protocol of supportedProtocols) {
            elizaLogger.info(`Fetching historical data for protocol: ${protocol}`);
            const historicalData = lendingDb.getProtocolSpecifics(protocol);

            console.log(JSON.stringify(historicalData))

            if (historicalData.length === 0) {
                elizaLogger.warn(`No historical data found for protocol: ${protocol}`);
                continue;
            }

            elizaLogger.info(`Fetching existing rules for protocol: ${protocol}`);
            const existingRules = rulesDb.getProtocolRule(protocol);

            elizaLogger.info(`Composing context for protocol: ${protocol}`);
            const context = composeContext({
                state: {
                    ...state,
                    historicalData: JSON.stringify(historicalData),
                    existingRules: JSON.stringify(existingRules),
                },
                template: createRulesTemplate,
            });

            elizaLogger.info(`Generating rules for protocol: ${protocol}`);
            const generatedRulesText = await generateText({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            try {
                const generatedRules: ProtocolRule[] = JSON.parse(generatedRulesText);
                elizaLogger.info(`Generated rules for protocol ${protocol}:`, generatedRules);

                for (const rule of generatedRules) {
                    rulesToCreate.push(rule);
                    rulesDb.saveProtocolRule(rule);
                }

                await runtime.messageManager.createMemory({
                    userId: _message.userId,
                    agentId: runtime.agentId,
                    roomId: _message.roomId,
                    content: {text: `Here are the latest rules that are created: ${JSON.stringify(rulesToCreate)}`},
                    createdAt: Date.now(),
                });
            } catch (error) {
                elizaLogger.error(`Failed to parse rules for protocol ${protocol}:`, error);
            }

            if (rulesToCreate.length === 0) {
                elizaLogger.warn("No rules were generated from the historical data.");
                return true;
            } else {
                // await sendToX(rulesToCreate[0].rule);
            }
        }

        elizaLogger.info(`Generated ${rulesToCreate.length} new rules.`);
        elizaLogger.info(`✅ Successfully created ${rulesToCreate.length} new rules for protocols.`)

        return true;
    },
    examples: [],
};
