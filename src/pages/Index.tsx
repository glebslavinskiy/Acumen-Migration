import { TokenMigration } from "@/components/TokenMigration";
import { WalletConnect } from "@/components/WalletConnect";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8 md:py-16">
      <header className="mb-6 md:mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Token Swap
        </h1>
        <p className="text-gray-400 max-w-md mb-6">
          Exchange Staking Collateral Token for RESAL Collateral Token
        </p>
        <WalletConnect />
      </header>
      
      <div className="w-full max-w-md">
        <TokenMigration />
      </div>
    </div>
  );
};

export default Index;
