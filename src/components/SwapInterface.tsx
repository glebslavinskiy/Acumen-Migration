import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TokenInput from "./TokenInput";
import SwapButton from "./SwapButton";
import TransactionModal from "./TransactionModal";
import { useWallet } from "@/context/WalletContext";
import { toast } from "@/components/ui/use-toast";

const SwapInterface: React.FC = () => {
  const { isConnected, balance } = useWallet();
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapDirection, setSwapDirection] = useState<"stakingToResal" | "resalToStaking">("stakingToResal");
  const [transactionStatus, setTransactionStatus] = useState<"preview" | "pending" | "success">("preview");

  const fromToken = swapDirection === "stakingToResal" 
    ? { symbol: "SCT", name: "Staking Collateral Token" } 
    : { symbol: "RCT", name: "RESAL Collateral Token" };
  
  const toToken = swapDirection === "stakingToResal" 
    ? { symbol: "RCT", name: "RESAL Collateral Token" } 
    : { symbol: "SCT", name: "Staking Collateral Token" };

  const fromBalance = swapDirection === "stakingToResal" ? balance.staking : balance.resal;
  const toBalance = swapDirection === "stakingToResal" ? balance.resal : balance.staking;

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    const numValue = parseFloat(value) || 0;
    setToAmount((numValue * 0.82).toFixed(4));
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    const numValue = parseFloat(value) || 0;
    setFromAmount((numValue / 0.82).toFixed(4));
  };

  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === "stakingToResal" ? "resalToStaking" : "stakingToResal");
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwapClick = () => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to swap tokens",
      });
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap",
      });
      return;
    }

    if (parseFloat(fromAmount) > fromBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken.symbol}`,
      });
      return;
    }

    setTransactionStatus("preview");
    setIsSwapModalOpen(true);
  };

  const handleConfirmSwap = () => {
    setTransactionStatus("pending");
    
    setTimeout(() => {
      setTransactionStatus("success");
      
      setTimeout(() => {
        setIsSwapModalOpen(false);
        setFromAmount("");
        setToAmount("");
        toast({
          title: "Swap Completed",
          description: `Successfully swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
        });
      }, 2000);
    }, 2000);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-black dark:text-white">Swap Tokens</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">Exchange between Staking and RESAL tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <TokenInput
            label="From"
            value={fromAmount}
            onChange={handleFromAmountChange}
            token={fromToken}
            balance={isConnected ? fromBalance : undefined}
            disabled={!isConnected}
          />
          
          <SwapButton onClick={handleSwapDirection} />
          
          <TokenInput
            label="To"
            value={toAmount}
            onChange={handleToAmountChange}
            token={toToken}
            balance={isConnected ? toBalance : undefined}
            disabled={!isConnected}
          />

          {isConnected && fromAmount && toAmount && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Rate</span>
                <span className="text-black dark:text-white">1 {fromToken.symbol} ≈ 0.82 {toToken.symbol}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500 dark:text-gray-400">Estimated Fee</span>
                <span className="text-black dark:text-white">0.3%</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSwapClick} 
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            disabled={!isConnected || !fromAmount || parseFloat(fromAmount) <= 0}
          >
            {isConnected ? "Swap" : "Connect Wallet to Swap"}
          </Button>
        </CardFooter>
      </Card>

      <TransactionModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        fromToken={{ amount: fromAmount, symbol: fromToken.symbol }}
        toToken={{ amount: toAmount, symbol: toToken.symbol }}
        onConfirm={handleConfirmSwap}
        status={transactionStatus}
      />
    </>
  );
};

export default SwapInterface;
