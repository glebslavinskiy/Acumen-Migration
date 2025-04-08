import { defaultWagmiConfig } from '@web3modal/wagmi'
import { avalancheCChain } from './chains'

// Get WalletConnect Project ID from environment variable
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID

if (!projectId) throw new Error('WalletConnect Project ID is required')

// Create wagmi config with Web3Modal
export const config = defaultWagmiConfig({
  chains: [avalancheCChain],
  projectId,
  metadata: {
    name: 'Acumen Migration',
    description: 'Token Migration Interface',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://acumen.network',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  ssr: false,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  unstable_connectControl: {
    reloadOnDisconnect: false,
    reconnectOnWrongNetwork: false
  }
}) 