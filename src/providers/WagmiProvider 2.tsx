import { WagmiProvider as WagmiConfig } from 'wagmi'
import { config } from '@/config/wagmi'

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      {children}
    </WagmiConfig>
  )
} 