import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt, type BaseError } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { COLLATERAL_EXCHANGE_ADDRESS, COLLATERAL_EXCHANGE_ABI, ERC20_ABI } from '../config/contracts';
import { avalancheCChain } from '../config/chains';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TokenInput from "./TokenInput";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, CheckCircle, Hourglass } from "lucide-react";

export function TokenMigration() {
  const [amount, setAmount] = useState('');
  const { address, isConnected, chainId } = useAccount();
  const [needsApproval, setNeedsApproval] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"preview" | "pending" | "success">("preview");
  const [parsedAmount, setParsedAmount] = useState<bigint>(0n);

  const isCorrectNetwork = chainId === avalancheCChain.id;

  // Only enable contract interactions if we're on the correct network
  const shouldEnableContracts = isConnected && isCorrectNetwork;

  // @ts-ignore - Temporary fix for wagmi v2 type issues with useContractRead
  const { data: migrationActive, isError: migrationActiveError } = useContractRead({
    address: COLLATERAL_EXCHANGE_ADDRESS,
    abi: COLLATERAL_EXCHANGE_ABI,
    functionName: 'migrationActive',
    enabled: shouldEnableContracts,
  });

  // @ts-ignore - Temporary fix for wagmi v2 type issues with useContractRead
  const { data: sctTokenAddress, isError: sctTokenError } = useContractRead({
    address: COLLATERAL_EXCHANGE_ADDRESS,
    abi: COLLATERAL_EXCHANGE_ABI,
    functionName: 'sctToken',
    enabled: shouldEnableContracts,
  });

  // @ts-ignore - Temporary fix for wagmi v2 type issues with useContractRead
  const { data: allowance, refetch: refetchAllowance, isError: allowanceError } = useContractRead({
    address: sctTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, COLLATERAL_EXCHANGE_ADDRESS],
    enabled: Boolean(sctTokenAddress && address && shouldEnableContracts),
  });

  // @ts-ignore - Temporary fix for wagmi v2 type issues with useContractRead
  const { data: sctDecimals, isError: sctDecimalsError } = useContractRead({
    address: sctTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    enabled: Boolean(sctTokenAddress && shouldEnableContracts),
  });

  // @ts-ignore - Temporary fix for wagmi v2 type issues with useContractRead
  const { data: sctBalance, isError: sctBalanceError } = useContractRead({
    address: sctTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: Boolean(sctTokenAddress && address && shouldEnableContracts),
  });

  // Format balance for display - handle potential decimal places properly
  let formattedBalance = '0';
  let numericBalance = 0;
  
  if (sctBalance) {
    try {
      const balanceBigInt = BigInt(sctBalance.toString());
      const decimals = sctDecimals ? Number(sctDecimals) : 6;
      const divisor = BigInt(10) ** BigInt(decimals);
      
      // Manual decimal calculation
      const wholePart = balanceBigInt / divisor;
      const fractionalPart = balanceBigInt % divisor;
      
      // Format with proper decimal places
      formattedBalance = wholePart.toString();
      if (fractionalPart > 0n) {
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
        // Remove trailing zeros
        const trimmedFractional = fractionalStr.replace(/0+$/, '');
        if (trimmedFractional.length > 0) {
          formattedBalance += '.' + trimmedFractional;
        }
      }
      
      // Convert to numeric value
      numericBalance = Number(formattedBalance);
    } catch (error) {
      console.error('Error formatting balance:', error);
    }
  }

  // Update parsed amount when amount changes
  useEffect(() => {
    if (!amount) {
      setParsedAmount(0n);
      return;
    }
    try {
      setParsedAmount(parseEther(amount));
    } catch (error) {
      console.error('Error parsing amount:', error);
      setParsedAmount(0n);
    }
  }, [amount]);

  // Contract writes
  // @ts-ignore - Temporary fix for wagmi v2 type issues with useContractWrite
  const { writeAsync: approve } = useContractWrite();

  // Debug logs for contract write setup
  useEffect(() => {
    console.log('Contract Write Debug Info:', {
      isConnected,
      chainId,
      isCorrectNetwork,
      shouldEnableContracts,
      sctTokenAddress,
      approve: !!approve,
      contractConfig: {
        functionName: 'approve',
        abi: 'ERC20_ABI present',
        address: sctTokenAddress,
      }
    });
  }, [isConnected, chainId, isCorrectNetwork, shouldEnableContracts, sctTokenAddress, approve]);

  // @ts-ignore - Temporary fix for wagmi v2 type issues with useContractWrite
  const { writeAsync: migrate } = useContractWrite();

  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>();
  const [migrateHash, setMigrateHash] = useState<`0x${string}` | undefined>();

  // Wait for transaction receipts
  const { isLoading: isWaitingApprove } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Handle transaction receipt effects
  useEffect(() => {
    if (approveHash && !isWaitingApprove) {
      // Transaction completed
      refetchAllowance();
      setApproveSuccess(true);
      setIsApproving(false);
      toast({
        title: "Approval Successful",
        description: "You can now migrate your tokens",
      });
    }
  }, [approveHash, isWaitingApprove, refetchAllowance]);

  const { isLoading: isWaitingMigrate } = useWaitForTransactionReceipt({
    hash: migrateHash,
  });

  useEffect(() => {
    if (migrateHash && !isWaitingMigrate) {
      // Transaction completed
      setMigrationSuccess(true);
      setIsMigrating(false);
      toast({
        title: "Migration Successful",
        description: `Successfully migrated ${amount} SCT tokens`,
      });
    }
  }, [migrateHash, isWaitingMigrate, amount]);

  // Check if approval is needed whenever amount changes
  useEffect(() => {
    if (!amount || !allowance) {
      setNeedsApproval(true);
      return;
    }
    try {
      const parsedAmount = parseEther(amount);
      const currentAllowance = BigInt(allowance.toString());
      setNeedsApproval(parsedAmount > currentAllowance);
    } catch (error) {
      console.error('Error checking approval:', error);
      setNeedsApproval(true);
    }
  }, [amount, allowance]);

  // Handle approval
  const handleApprove = async () => {
    console.log('Starting approval process...');
    console.log('Current state:', {
      sctTokenAddress,
      approve: !!approve,
      shouldEnableContracts,
      isConnected,
      chainId,
      isCorrectNetwork,
    });

    if (!sctTokenAddress) {
      console.log('Error: SCT token address not available');
      toast({
        variant: "destructive",
        title: "Error",
        description: "SCT token address not available. Please try again.",
      });
      return;
    }

    if (!approve) {
      console.log('Error: Contract write not available', {
        contractDetails: {
          functionName: 'approve',
          abi: 'ERC20_ABI present',
          address: sctTokenAddress,
        }
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Contract write not available. Please try again.",
      });
      return;
    }

    if (!shouldEnableContracts) {
      console.log('Error: Contracts not enabled', {
        isConnected,
        chainId,
        requiredChainId: avalancheCChain.id,
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet and switch to Avalanche C-Chain.",
      });
      return;
    }

    try {
      setIsApproving(true);
      console.log('Preparing approval transaction...', {
        spender: COLLATERAL_EXCHANGE_ADDRESS,
        amount: parseEther('999999999').toString(),
      });
      
      // Call approve function
      const { hash } = await approve({
        address: sctTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [COLLATERAL_EXCHANGE_ADDRESS, parseEther('999999999')]
      });

      console.log('Approval transaction submitted:', { hash });
      setApproveHash(hash);
      toast({
        title: "Approval Submitted",
        description: "Please wait while the transaction is being processed",
      });
    } catch (error) {
      console.error('Approval error details:', {
        error,
        errorMessage: (error as BaseError).shortMessage || 'Unknown error',
        errorName: error.name,
        errorCause: (error as any).cause,
      });
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: `Failed to approve token transfer: ${(error as BaseError).shortMessage || 'Unknown error'}`,
      });
      setIsApproving(false);
    }
  };

  // Handle migration
  const handleMigrate = async () => {
    if (!migrate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Contract write not available. Please try again.",
      });
      return;
    }

    try {
      setTransactionStatus("pending");
      setIsTransactionModalOpen(true);
      setIsMigrating(true);
      
      const { hash } = await migrate({
        address: COLLATERAL_EXCHANGE_ADDRESS,
        abi: COLLATERAL_EXCHANGE_ABI,
        functionName: 'migrate',
        args: [parsedAmount]
      });

      setMigrateHash(hash);
      toast({
        title: "Migration Submitted",
        description: "Please wait while the transaction is being processed",
      });
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        variant: "destructive",
        title: "Migration Failed",
        description: `Failed to migrate tokens: ${(error as BaseError).shortMessage || 'Unknown error'}`,
      });
      setIsMigrating(false);
      setTransactionStatus("preview");
    }
  };

  const showApproveButton = Boolean(isConnected && isCorrectNetwork);
  const showMigrateButton = Boolean(!needsApproval && amount && migrationActive && isCorrectNetwork);

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
            label="Amount to Migrate"
            value={amount}
            onChange={setAmount}
            token={{ symbol: "SCT", name: "Staking Collateral Token" }}
            balance={numericBalance}
            disabled={isMigrating || isApproving || !migrationActive}
          />

          {isConnected && (
            <div className="bg-gray-900 rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Migration Status</span>
                <span className="text-white">
                  {migrationActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">SCT Balance</span>
                <span className="text-white">
                  {formattedBalance} SCT
                  {sctBalanceError && (
                    <span className="text-red-500 ml-2">(Error loading balance)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Current Allowance</span>
                <span className="text-white">
                  {allowance ? formatEther(BigInt(allowance.toString())) : '0'} SCT
                </span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
          >
            {isApproving ? 'Approving...' : 'Approve SCT'}
          </Button>
          {showMigrateButton && (
            <Button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
            >
              {isMigrating ? 'Migrating...' : 'Migrate Tokens'}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-black border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {transactionStatus === "preview" && "Confirm Migration"}
              {transactionStatus === "pending" && "Transaction Pending"}
              {transactionStatus === "success" && "Transaction Success"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {transactionStatus === "preview" && "Review your migration details before confirming"}
              {transactionStatus === "pending" && "Please wait while your transaction is being processed"}
              {transactionStatus === "success" && "Your migration has been successfully completed"}
            </DialogDescription>
          </DialogHeader>

          {transactionStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-center text-sm">
                Successfully migrated {amount} SCT tokens
                {transactionHash && (
                  <div className="mt-2 text-xs text-gray-400">
                    Transaction Hash: {transactionHash}
                  </div>
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-white mr-2"></div>
                    <p className="font-medium">{amount} SCT</p>
                  </div>
                  <p className="text-sm text-gray-400">From</p>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="text-gray-400" />
                </div>
                
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-700 mr-2"></div>
                    <p className="font-medium">{amount} RCT</p>
                  </div>
                  <p className="text-sm text-gray-400">To</p>
                </div>
                
                <Separator className="bg-gray-800" />
              </div>

              <DialogFooter>
                {transactionStatus === "preview" ? (
                  <>
                    <Button variant="outline" onClick={() => setIsTransactionModalOpen(false)} className="w-full sm:w-auto border-gray-700 text-white hover:bg-gray-800">
                      Cancel
                    </Button>
                    <Button onClick={needsApproval ? handleApprove : handleMigrate} className="w-full sm:w-auto bg-white text-black hover:bg-gray-200">
                      Confirm {needsApproval ? 'Approval' : 'Migration'}
                    </Button>
                  </>
                ) : (
                  <div className="w-full flex justify-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-400">
                      <Hourglass className="h-4 w-4 animate-spin" />
                      <span>Processing transaction...</span>
                    </div>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 