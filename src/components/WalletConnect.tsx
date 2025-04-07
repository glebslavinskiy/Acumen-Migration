
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/WalletContext";
import { Wallet, LogOut } from "lucide-react";

const WalletConnect = () => {
  const { isConnected, walletAddress, connectWallet, disconnectWallet, balance } = useWallet();

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs mx-auto">
      {isConnected ? (
        <div className="w-full space-y-2">
          <div className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-white" />
              <span className="text-sm font-medium">{walletAddress}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={disconnectWallet}
              className="h-8 px-2 text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-gray-900 p-3 rounded-lg space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Staking Token:</span>
              <span className="font-medium">{balance.staking} SCT</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">RESAL Token:</span>
              <span className="font-medium">{balance.resal} RCT</span>
            </div>
          </div>
        </div>
      ) : (
        <Button 
          onClick={connectWallet} 
          className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
        >
          <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;
