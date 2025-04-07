
import { WalletProvider } from "@/context/WalletContext";
import WalletConnect from "@/components/WalletConnect";
import SwapInterface from "@/components/SwapInterface";

const Index = () => {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center px-4 py-8 md:py-16">
        <header className="mb-6 md:mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">
            Token Swap
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Easily swap between Staking Collateral Token and RESAL Collateral Token
          </p>
        </header>
        
        <div className="w-full max-w-md mb-8">
          <WalletConnect />
        </div>
        
        <div className="w-full max-w-md">
          <SwapInterface />
        </div>
        
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="max-w-md">
            Note: This is a demo application. In a real app, real wallet connections 
            would be implemented using Web3 libraries.
          </p>
        </footer>
      </div>
    </WalletProvider>
  );
};

export default Index;
