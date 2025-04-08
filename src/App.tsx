import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { config } from '@/config/wagmi'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { avalancheCChain } from '@/config/chains'
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Initialize Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#4169E1'
  },
  defaultChain: avalancheCChain,
  includeWalletIds: undefined,
  featuredWalletIds: undefined,
  allWallets: 'SHOW',
  reconnectPreviousSession: false
})

const queryClient = new QueryClient()

function AppContent() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </BrowserRouter>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App;
