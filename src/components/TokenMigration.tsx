import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { avalancheCChain } from '../config/chains';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TokenInput from "./TokenInput";
import { toast } from "@/components/ui/use-toast";
import { TransactionModal } from "./TransactionModal";
import { useTokenContract } from '../hooks/useTokenContract';
import { useMigrationContract } from '../hooks/useMigrationContract';
import { formatTokenBalance, parseTokenAmount } from '../utils/tokenFormatters';
import { COLLATERAL_EXCHANGE_ADDRESS, SCT_TOKEN_ADDRESS, RCT_TOKEN_ADDRESS } from '../config/contracts';

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

  const isCorrectNetwork = chainId === avalancheCChain.id;

  // Contract hooks
  const {
    migrationActive,
    sctTokenAddress,
    rctTokenAddress,
    handleMigrate,
    isWaitingMigrate,
    migrateReceipt,
    contractRctBalance,
    sctAllowance,
    sctBalance: contractSctBalance
  } = useMigrationContract({
    userAddress: address
  });

  const {
    decimals: sctDecimals,
    balance: sctBalance,
    allowance,
    approve,
    isWaitingApprove,
    approveReceipt,
    refetchAllowance,
    refetchBalance: refetchSctBalance
  } = useTokenContract({
    tokenAddress: SCT_TOKEN_ADDRESS as `0x${string}`,
    spenderAddress: COLLATERAL_EXCHANGE_ADDRESS,
    userAddress: address,
    isScToken: true
  });

  const {
    decimals: rctDecimals,
    balance: rctBalance,
    refetchBalance: refetchRctBalance
  } = useTokenContract({
    tokenAddress: rctTokenAddress as `0x${string}`,
    userAddress: address
  });

  // Format balances
  const formattedSctBalance = formatTokenBalance(BigInt(sctBalance?.toString() || '0'), Number(sctDecimals));
  const formattedRctBalance = formatTokenBalance(BigInt(rctBalance?.toString() || '0'), Number(rctDecimals));
  const numericSctBalance = Number(formattedSctBalance);

  // Validate amount against balance
  const validateAmount = useCallback((inputAmount: string): boolean => {
    if (!sctBalance || !sctDecimals) return false;
    
    try {
      const parsedInput = parseTokenAmount(inputAmount, Number(sctDecimals));
      const currentBalance = BigInt(sctBalance.toString());
      
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
  }, [sctBalance, sctDecimals]);

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
        description: `Amount exceeds your balance of ${formattedSctBalance} SCT`,
      });
    }
  };

  // Handle max amount
  const handleMaxAmount = () => {
    if (formattedSctBalance && formattedSctBalance !== '0') {
      const maxAmount = formattedSctBalance;
      setAmount(maxAmount);
    }
  };

  // Update parsed amount when amount changes
  useEffect(() => {
    if (!amount || !sctDecimals) {
      setParsedAmount(0n);
      return;
    }
    
    try {
      const parsedAmountBigInt = parseTokenAmount(amount, Number(sctDecimals));
      setParsedAmount(parsedAmountBigInt);
    } catch (error) {
      setParsedAmount(0n);
    }
  }, [amount, sctDecimals]);

  // Check if approval is needed
  useEffect(() => {
    if (!allowance) {
      setNeedsApproval(true);
      return;
    }

    const currentAllowance = BigInt(allowance.toString());
    const sufficientAllowance = currentAllowance >= parseTokenAmount('999999', Number(sctDecimals));
    setNeedsApproval(!sufficientAllowance);
  }, [allowance, sctDecimals]);

  // Handle approval
  const handleApprove = async () => {
    if (!sctTokenAddress || !approve) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet and switch to Avalanche C-Chain.",
      });
      return;
    }

    try {
      setIsApproving(true);
      setTransactionStatus("pending");
      
      const maxApprovalAmount = parseTokenAmount('999999999', Number(sctDecimals));
      
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
        address: SCT_TOKEN_ADDRESS as `0x${string}`,
        functionName: 'approve',
        args: [COLLATERAL_EXCHANGE_ADDRESS, maxApprovalAmount],
        chain: avalancheCChain,
        account: address as `0x${string}`
      });

    } catch (error) {
      setIsApproving(false);
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
    const userBalance = BigInt(contractSctBalance?.toString() || '0');

    if (userBalance < parsedAmount) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You only have ${formattedSctBalance} SCT available.`,
      });
      return;
    }

    if (!validateAmount(amount)) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Please enter an amount between 0 and ${formattedSctBalance} SCT`,
      });
      return;
    }

    try {
      setTransactionStatus("pending");
      setIsTransactionModalOpen(true);
      setIsMigrating(true);
      
      // Show confirmation modal with the exact amount that will be deducted
      const formattedAmount = formatTokenBalance(parsedAmount, Number(sctDecimals));

      setTransactionHash(null);
      
      await handleMigrate(parsedAmount);

    } catch (error) {
      setIsMigrating(false);
      setTransactionStatus("preview");
      setIsTransactionModalOpen(false);
      
      let errorMessage = 'Failed to migrate tokens';
      if (error instanceof Error) {
        if (error.message.includes('transfer amount exceeds balance')) {
          const userBalance = BigInt(contractSctBalance?.toString() || '0');
          const userAllowance = BigInt(sctAllowance?.toString() || '0');
          
          if (userBalance < parsedAmount) {
            errorMessage = `Insufficient SCT balance. You have ${formattedSctBalance} SCT available.`;
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
      setIsApproving(false);
      setTransactionStatus("preview");
      toast({
        title: "Approval Successful",
        description: "You can now migrate your tokens",
      });
    }
  }, [approveReceipt, refetchAllowance]);

  useEffect(() => {
    if (migrateReceipt) {
      if (migrateReceipt.status === 'success') {
        refetchSctBalance();
        refetchRctBalance();
        setIsMigrating(false);
        setTransactionHash(migrateReceipt.transactionHash);
        setTransactionStatus("success");
        toast({
          title: "Migration Successful",
          description: `Successfully migrated ${amount} SCT tokens to RCT`,
        });
      }
    }
  }, [migrateReceipt, amount, refetchSctBalance, refetchRctBalance]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto bg-black border border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-white">Token Migration</CardTitle>
          <CardDescription className="text-gray-400">Migrate your SCT tokens to RCT</CardDescription>
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
          <CardDescription className="text-gray-400">Migrate your SCT tokens to RCT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TokenInput
            label="Amount to Transfer"
            value={amount}
            onChange={handleAmountChange}
            token={{ symbol: "SCT", name: "Staking Collateral Token" }}
            balance={numericSctBalance}
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
              <span className="text-gray-400">SCT Balance</span>
              <span className="text-white">{formattedSctBalance} SCT</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">RCT Balance</span>
              <span className="text-white">{formattedRctBalance} RCT</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Contract RCT Balance</span>
              <span className="text-white">
                {contractRctBalance ? formatTokenBalance(BigInt(contractRctBalance.toString()), Number(rctDecimals)) : '0'} RCT
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Current Allowance</span>
              <span className="text-white">
                {sctAllowance ? formatTokenBalance(BigInt(sctAllowance.toString()), Number(sctDecimals)) : '0'} SCT
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {isConnected && isCorrectNetwork && needsApproval && !isApproving && (
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
            >
              {isApproving ? 'Approving...' : 'Approve SCT'}
            </Button>
          )}
          {isConnected && isCorrectNetwork && !needsApproval && migrationActive && !isMigrating && (
            <Button
              onClick={handleMigrationStart}
              disabled={isMigrating || !validateAmount(amount)}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
            >
              {isMigrating ? 'Migrating...' : 'Migrate Tokens'}
            </Button>
          )}
        </CardFooter>
      </Card>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        status={transactionStatus}
        fromAmount={amount}
        fromToken="SCT"
        toAmount={amount}
        toToken="RCT"
        transactionHash={transactionHash}
        onConfirm={needsApproval ? handleApprove : handleMigrationStart}
        onCancel={() => setIsTransactionModalOpen(false)}
        needsApproval={needsApproval}
      />
    </>
  );
} 