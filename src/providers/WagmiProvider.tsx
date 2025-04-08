import { createConfig, WagmiProvider as Provider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/config/wagmi'

const queryClient = new QueryClient()

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const wagmiConfig = createConfig({
    ...config,
    autoConnect: false
  })

  return (
    <Provider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  )
} 