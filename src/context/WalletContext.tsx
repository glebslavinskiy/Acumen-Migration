
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  balance: {
    staking: number;
    resal: number;
  };
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState({ staking: 0, resal: 0 });

  // Mock wallet connection - in a real app, this would use Web3 libraries
  const connectWallet = async (): Promise<void> => {
    try {
      // Simulate a connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in a real app, this would be from a real wallet
      const mockAddress = '0x' + Math.random().toString(16).slice(2, 12) + '...';
      const stakingBalance = parseFloat((Math.random() * 10).toFixed(4));
      const resalBalance = parseFloat((Math.random() * 5).toFixed(4));
      
      setWalletAddress(mockAddress);
      setIsConnected(true);
      setBalance({
        staking: stakingBalance,
        resal: resalBalance
      });
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${mockAddress}`,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect wallet. Please try again.",
      });
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setBalance({ staking: 0, resal: 0 });
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const value = {
    isConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,
    balance,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
