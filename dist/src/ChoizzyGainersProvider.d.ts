import { Provider } from "@ai16z/eliza";
export interface Token {
    id: string;
    address: string;
    current_price: number;
    name: string;
    image: string;
    symbol: string;
    price_change_percentage_24h: number;
    market_cap: number;
}
export declare const ChoizzyGainersProvider: Provider;
export declare const HamburgersProvider: Provider;
export default ChoizzyGainersProvider;
