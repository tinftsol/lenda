// import fetch from "node-fetch";
//
// export class JupiterPriceApiClient {
//     private readonly baseUrl: string;
//
//     constructor(baseUrl: string = "https://price.jup.ag/v4") {
//         this.baseUrl = baseUrl;
//     }
//
//     /**
//      * Fetches the price of a token relative to the US Dollar (USD) by its mint address.
//      * @param mintAddress The mint address of the token to fetch the price for.
//      * @returns The price of the token in USD.
//      */
//     async getPriceInUSD(mintAddress: string): Promise<number | null> {
//         try {
//             const response = await fetch(`${this.baseUrl}/price?ids=${mintAddress}`);
//
//             if (!response.ok) {
//                 throw new Error(`Failed to fetch price for mint: ${mintAddress}. Status: ${response.status}`);
//             }
//
//             const data = await response.json();
//
//             if (data && data.data && data.data[mintAddress]) {
//                 const priceInfo = data.data[mintAddress];
//                 return priceInfo.price; // Price in USD
//             }
//
//             console.warn("No price data found for mint:", mintAddress);
//             return null;
//         } catch (error) {
//             console.error("Error fetching price data:", error);
//             return null;
//         }
//     }
// }
