import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { avalancheCChain } from '../config/chains';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import TokenInput from "./TokenInput";
import { toast } from "@/components/ui/use-toast";
import { TransactionModal } from "./TransactionModal";
import { useTokenContract } from '../hooks/useTokenContract';
import { useMigrationContract } from '../hooks/useMigrationContract';
import { formatTokenBalance, parseTokenAmount } from '../utils/tokenFormatters';
import { COLLATERAL_EXCHANGE_ADDRESS, RCT_TOKEN_ADDRESS, RCTV2_TOKEN_ADDRESS } from '../config/contracts';

export function TokenMigration() {
  const [amount, setAmount] = useState('');
  const { address, isConnected, chainId } = useAccount();
  const [needsApproval, setNeedsApproval] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"preview" | "pending" | "success">("preview");
  const [parsedAmount, setParsedAmount] = useState<bigint>(0n);
  const [isWaitingForAllowance, setIsWaitingForAllowance] = useState(false);

  const isCorrectNetwork = chainId === avalancheCChain.id;

  // Contract hooks
  const {
    migrationActive,
    fromTokenAddress,
    toTokenAddress,
    handleMigrate,
    isWaitingMigrate,
    migrateReceipt,
    contractToBalance,
    fromAllowance,
    fromBalance: contractFromBalance
  } = useMigrationContract({
    userAddress: address
  });

  // RCT (from) token contract
  const {
    decimals: rctDecimals,
    balance: rctBalance,
    allowance,
    approve,
    isWaitingApprove,
    approveReceipt,
    refetchAllowance,
    refetchBalance: refetchRctBalance
  } = useTokenContract({
    tokenAddress: RCT_TOKEN_ADDRESS as `0x${string}`,
    spenderAddress: COLLATERAL_EXCHANGE_ADDRESS,
    userAddress: address
  });

  // RCTv2 (to) token contract
  const {
    decimals: rctv2Decimals,
    balance: rctv2Balance,
    refetchBalance: refetchRctv2Balance
  } = useTokenContract({
    tokenAddress: RCTV2_TOKEN_ADDRESS as `0x${string}`,
    userAddress: address
  });

  // Format balances
  const formattedRctBalance = formatTokenBalance(BigInt(rctBalance?.toString() || '0'), Number(rctDecimals));
  const formattedRctv2Balance = formatTokenBalance(BigInt(rctv2Balance?.toString() || '0'), Number(rctv2Decimals));
  const numericRctBalance = Number(formattedRctBalance);

  // Validate amount against balance
  const validateAmount = useCallback((inputAmount: string): boolean => {
    if (!rctBalance || !rctDecimals) return false;
    
    try {
      const parsedInput = parseTokenAmount(inputAmount, Number(rctDecimals));
      const currentBalance = BigInt(rctBalance.toString());
      
      // Additional validation for reasonable amounts
      if (parsedInput === 0n) {
        return false;
      }
      
      if (parsedInput > currentBalance) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }, [rctBalance, rctDecimals]);

  // Handle amount change with validation
  const handleAmountChange = (newAmount: string) => {
    // Remove any non-numeric characters except decimal point
    newAmount = newAmount.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (newAmount.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = newAmount.split('.');
      newAmount = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setAmount(newAmount);
    
    if (newAmount && !validateAmount(newAmount)) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Amount exceeds your balance of ${formattedRctBalance} RCT`,
      });
    }
  };

  // Handle max amount
  const handleMaxAmount = () => {
    if (formattedRctBalance && formattedRctBalance !== '0') {
      const maxAmount = formattedRctBalance;
      setAmount(maxAmount);
    }
  };

  // Update parsed amount when amount changes
  useEffect(() => {
    if (!amount || !rctDecimals) {
      setParsedAmount(0n);
      return;
    }
    
    try {
      const parsedAmountBigInt = parseTokenAmount(amount, Number(rctDecimals));
      setParsedAmount(parsedAmountBigInt);
    } catch (error) {
      setParsedAmount(0n);
    }
  }, [amount, rctDecimals]);

  // Check if approval is needed
  useEffect(() => {
    if (!allowance) {
      setNeedsApproval(true);
      return;
    }

    const currentAllowance = BigInt(allowance.toString());
    const sufficientAllowance = currentAllowance >= parseTokenAmount('999999', Number(rctDecimals));
    setNeedsApproval(!sufficientAllowance);
    
    // If we have sufficient allowance and were waiting for it, stop waiting
    if (sufficientAllowance && isWaitingForAllowance) {
      setIsWaitingForAllowance(false);
      setIsApproving(false);
      setTransactionStatus("preview");
      toast({
        title: "Approval Successful",
        description: "You can now migrate your tokens",
      });
    }
  }, [allowance, rctDecimals, isWaitingForAllowance]);

  // Handle approval
  const handleApprove = async () => {
    if (!fromTokenAddress || !approve) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet and switch to Avalanche C-Chain.",
      });
      return;
    }

    try {
      setIsApproving(true);
      setIsWaitingForAllowance(true);
      setTransactionStatus("pending");
      
      const maxApprovalAmount = parseTokenAmount('999999999', Number(rctDecimals));
      
      await approve({
        abi: [{
          constant: false,
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function'
        }],
        address: RCT_TOKEN_ADDRESS as `0x${string}`,
        functionName: 'approve',
        args: [COLLATERAL_EXCHANGE_ADDRESS, maxApprovalAmount],
        chain: avalancheCChain,
        account: address as `0x${string}`
      });

    } catch (error) {
      setIsApproving(false);
      setIsWaitingForAllowance(false);
      setTransactionStatus("preview");
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Transaction failed',
      });
    }
  };

  // Handle migration
  const handleMigrationStart = async () => {
    if (!parsedAmount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an amount to migrate.",
      });
      return;
    }

    // Additional validation to ensure we have sufficient balance
    const userBalance = BigInt(contractFromBalance?.toString() || '0');

    if (userBalance < parsedAmount) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You only have ${formattedRctBalance} RCT available.`,
      });
      return;
    }

    if (!validateAmount(amount)) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Please enter an amount between 0 and ${formattedRctBalance} RCT`,
      });
      return;
    }

    try {
      setTransactionStatus("pending");
      setIsTransactionModalOpen(true);
      setIsMigrating(true);
      
      // Show confirmation modal with the exact amount that will be deducted
      const formattedAmount = formatTokenBalance(parsedAmount, Number(rctDecimals));

      setTransactionHash(null);
      
      await handleMigrate(parsedAmount);

    } catch (error) {
      setIsMigrating(false);
      setTransactionStatus("preview");
      setIsTransactionModalOpen(false);
      
      let errorMessage = 'Failed to migrate tokens';
      if (error instanceof Error) {
        if (error.message.includes('transfer amount exceeds balance')) {
          const userBalance = BigInt(contractFromBalance?.toString() || '0');
          const userAllowance = BigInt(fromAllowance?.toString() || '0');
          
          if (userBalance < parsedAmount) {
            errorMessage = `Insufficient RCT balance. You have ${formattedRctBalance} RCT available.`;
          } else if (userAllowance < parsedAmount) {
            errorMessage = 'Insufficient allowance. Please approve the contract again.';
          } else {
            errorMessage = 'Contract error: transfer amount exceeds balance. Please try again or contact support.';
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Migration Failed",
        description: errorMessage
      });
    }
  };

  // Monitor transaction status
  useEffect(() => {
    if (approveReceipt?.status === 'success') {
      refetchAllowance();
      // Note: We don't reset isApproving or isWaitingForAllowance here
      // They will be reset when the allowance check confirms the sufficient amount
    }
  }, [approveReceipt, refetchAllowance]);

  useEffect(() => {
    if (migrateReceipt) {
      if (migrateReceipt.status === 'success') {
        refetchRctBalance();
        refetchRctv2Balance();
        setIsMigrating(false);
        setTransactionHash(migrateReceipt.transactionHash);
        setTransactionStatus("success");
        toast({
          title: "Migration Successful",
          description: `Successfully migrated ${amount} RCT tokens to RCTv2`,
        });
      }
    }
  }, [migrateReceipt, amount, refetchRctBalance, refetchRctv2Balance]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto bg-black border border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-white">Token Migration</CardTitle>
          <CardDescription className="text-gray-400">Migrate your RCT tokens to RCTv2</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400">Please connect your wallet to continue</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Card className="w-full max-w-md mx-auto bg-black border border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-white">Token Migration</CardTitle>
          <CardDescription className="text-gray-400">Please switch to Avalanche C-Chain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-400 mb-2">Current Chain ID: {chainId}</p>
            <p className="text-gray-400">Required Chain ID: {avalancheCChain.id}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto bg-black border border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-white">Token Migration</CardTitle>
          <CardDescription className="text-gray-400">Migrate your RCT tokens to RCTv2</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TokenInput
            label="Amount to Transfer"
            value={amount}
            onChange={handleAmountChange}
            token={{ symbol: "RCT", name: "RESAL Collateral Token" }}
            balance={numericRctBalance}
            disabled={isMigrating || isApproving || !migrationActive}
            onMaxClick={handleMaxAmount}
          />

          <div className="bg-gray-900 rounded-md p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Migration Status</span>
              <span className="text-white">
                {migrationActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">RCT Balance</span>
              <span className="text-white">{formattedRctBalance} RCT</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">RCTv2 Balance</span>
              <span className="text-white">{formattedRctv2Balance} RCTv2</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Contract RCTv2 Balance</span>
              <span className="text-white">
                {contractToBalance ? formatTokenBalance(BigInt(contractToBalance.toString()), Number(rctv2Decimals)) : '0'} RCTv2
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Current Allowance</span>
              <span className="text-white">
                {allowance ? formatTokenBalance(BigInt(allowance.toString()), Number(rctDecimals)) : '0'} RCT
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {isConnected && isCorrectNetwork && (needsApproval || isWaitingForAllowance) && (
            <Button
              onClick={handleApprove}
              disabled={isApproving || isWaitingForAllowance}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
            >
              {(isApproving || isWaitingForAllowance) ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner className="border-black border-r-transparent" />
                  <span>Approving...</span>
                </div>
              ) : (
                'Approve RCT'
              )}
            </Button>
          )}
          {isConnected && isCorrectNetwork && !needsApproval && !isWaitingForAllowance && migrationActive && !isMigrating && (
            <Button
              onClick={handleMigrationStart}
              disabled={isMigrating || !validateAmount(amount)}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
            >
              {isMigrating ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner className="border-black border-r-transparent" />
                  <span>Migrating...</span>
                </div>
              ) : (
                'Migrate Tokens'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        status={transactionStatus}
        fromAmount={amount}
        fromToken="RCT"
        toAmount={amount}
        toToken="RCTv2"
        transactionHash={transactionHash}
        onConfirm={needsApproval ? handleApprove : handleMigrationStart}
        onCancel={() => setIsTransactionModalOpen(false)}
        needsApproval={needsApproval}
      />
    </>
  );
} 