declare module 'viem' {
  export function http(url?: string): any;
}

declare module 'viem/chains' {
  export const mainnet: {
    id: number;
    name: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: any;
  };
}
