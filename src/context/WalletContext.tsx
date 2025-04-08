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

const defaultContext: WalletContextType = {
  isConnected: false,
  walletAddress: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  balance: {
    staking: 0,
    resal: 0
  }
};

const WalletContext = createContext<WalletContextType>(defaultContext);

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState({ staking: 0, resal: 0 });

  const connectWallet = async () => {
    try {
      // Implement wallet connection logic here
      setIsConnected(true);
      setWalletAddress("0x...");  // Set actual wallet address
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
      });
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setBalance({ staking: 0, resal: 0 });
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      walletAddress,
      connectWallet,
      disconnectWallet,
      balance
    }}>
      {children}
    </WalletContext.Provider>
  );
}
