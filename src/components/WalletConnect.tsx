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

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const { disconnectAsync } = useDisconnect()
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

  const handleDisconnect = useCallback(async () => {
    try {
      setIsLoading(true)
      await disconnectAsync()

      // Set flag to prevent auto-reconnect
      localStorage.setItem('should_disconnect', 'true')

      // Clear any stored wallet data
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('wc@2:') || 
        key.startsWith('w3m_') || 
        key.startsWith('wagmi') ||
        key.includes('walletconnect')
      )

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        } catch (e) {
          console.warn(`Failed to clear ${key}:`, e)
        }
      })

      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from your wallet",
      })
    } catch (error) {
      console.error('Error during wallet disconnection:', error)
      toast({
        variant: "destructive",
        title: "Error Disconnecting",
        description: "Failed to disconnect from your wallet. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [disconnectAsync])

  const handleConnect = () => {
    // Clear the disconnect flag when user initiates connection
    localStorage.removeItem('should_disconnect')
    open()
  }

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm text-gray-400">Connected to</div>
        <div className="font-mono text-sm">{address}</div>
        <Button 
          onClick={handleDisconnect}
          variant="outline"
          className="mt-2"
          disabled={isLoading}
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={handleConnect}
        className="relative w-full"
        disabled={isLoading}
      >
        Connect Wallet
      </Button>
    </div>
  )
}
