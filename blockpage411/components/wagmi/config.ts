import { createConfig, http } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

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

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const walletConnectConnector = walletConnectProjectId
  ? walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: {
        name: 'Blockpage411',
        description: 'Wallet intelligence and reputation scoring',
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.blockpages411.com',
        icons: ['https://www.blockpages411.com/block411-logo.svg'],
      },
    })
  : null;

export const wagmiConfig = createConfig({
  chains: [mainnet, base],
  connectors: [injectedConnector, coinbaseConnector, ...(walletConnectConnector ? [walletConnectConnector] : [])],
  transports: {
    [mainnet.id]: http(ethereumRpcUrl),
    [base.id]: http(baseRpcUrl),
  },
  ssr: false,
});
