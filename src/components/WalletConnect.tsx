import { useAccount, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useCallback, useState, useEffect } from 'react'

// Type for ethereum provider
interface EthereumProvider {
  request?: (args: { method: string }) => Promise<void>
  disconnect?: () => Promise<void>
  close?: () => Promise<void>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider & Record<string, unknown>
  }
}

// Helper function to format address
const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const { disconnect } = useDisconnect()
  const [isLoading, setIsLoading] = useState(false)

  // Check if we need to disconnect on mount
  useEffect(() => {
    if (isConnected) {
      const shouldDisconnect = localStorage.getItem('should_disconnect') === 'true'
      if (shouldDisconnect) {
        handleDisconnect()
      }
    }
  }, [isConnected])

  const handleDisconnect = async () => {
    try {
      // Clear any stored data
      const keysToRemove = ['wagmi.cache', 'wagmi.connected', 'wagmi.wallet']
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          // Ignore errors
        }
      })

      // Disconnect wallet
      await disconnect()

      // Set flag to prevent auto-reconnect
      localStorage.setItem('should_disconnect', 'true')

      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from your wallet",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Disconnection Error",
        description: error instanceof Error ? error.message : "Failed to disconnect wallet",
      })
    }
  }

  const handleConnect = async () => {
    try {
      // Clear the disconnect flag when user initiates connection
      localStorage.removeItem('should_disconnect')
      await open()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
      })
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-gray-400 hidden md:inline">{formatAddress(address)}</span>
        <Button 
          onClick={handleDisconnect}
          variant="outline"
          className="bg-transparent text-white border-gray-700 hover:bg-gray-800 hover:text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      className="bg-white text-black hover:bg-gray-200 transition-colors"
      disabled={isLoading}
    >
      Connect Wallet
    </Button>
  )
}
