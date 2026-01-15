import { createConfig, http } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

const ethereumRpcUrl =
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL ||
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
  'https://cloudflare-eth.com';

const baseRpcUrl =
  process.env.NEXT_PUBLIC_BASE_RPC_URL ||
  'https://mainnet.base.org';

export const injectedConnector = injected({
  shimDisconnect: true,
});

export const coinbaseConnector = coinbaseWallet({
  appName: 'Blockpage411',
  appLogoUrl: undefined,
});

export const wagmiConfig = createConfig({
  chains: [mainnet, base],
  connectors: [injectedConnector, coinbaseConnector],
  transports: {
    [mainnet.id]: http(ethereumRpcUrl),
    [base.id]: http(baseRpcUrl),
  },
  ssr: false,
});
