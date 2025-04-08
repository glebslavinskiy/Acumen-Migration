import { defineChain } from 'viem'

export const avalancheCChain = defineChain({
  id: 43_114,
  name: 'Avalanche C-Chain',
  network: 'avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'AVAX',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: {
      http: [
        'https://api.avax.network/ext/bc/C/rpc',
        'https://avalanche-c-chain.publicnode.com',
        'https://rpc.ankr.com/avalanche'
      ],
      webSocket: [
        'wss://api.avax.network/ext/bc/C/ws'
      ]
    },
    public: {
      http: [
        'https://api.avax.network/ext/bc/C/rpc',
        'https://avalanche-c-chain.publicnode.com',
        'https://rpc.ankr.com/avalanche'
      ],
      webSocket: [
        'wss://api.avax.network/ext/bc/C/ws'
      ]
    }
  },
  blockExplorers: {
    default: {
      name: 'SnowTrace',
      url: 'https://snowtrace.io'
    },
    etherscan: {
      name: 'SnowTrace',
      url: 'https://snowtrace.io'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 11_907_934
    }
  },
  testnet: false,
  sourceId: 1
}) 