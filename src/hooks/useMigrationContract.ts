import { useContractRead, useContractWrite, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import {
  COLLATERAL_EXCHANGE_ABI,
  COLLATERAL_EXCHANGE_ADDRESS,
  RCT_TOKEN_ADDRESS,
  RCTV2_TOKEN_ADDRESS,
  ERC20_ABI
} from '@/config/contracts';
import { type Hash } from 'viem';
import { useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { avalancheCChain } from '../config/chains';
import { formatTokenBalance } from '../utils/tokenFormatters';

export interface MigrationContractHookProps {
  userAddress?: `0x${string}`;
}

export function useMigrationContract({ userAddress }: MigrationContractHookProps) {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  // Contract reads
  const { data: migrationActive, isError: migrationActiveError } = useContractRead({
    address: COLLATERAL_EXCHANGE_ADDRESS as `0x${string}`,
    abi: COLLATERAL_EXCHANGE_ABI,
    functionName: 'migrationActive'
  });

  const { data: fromTokenAddress, isError: fromTokenError } = useContractRead({
    address: COLLATERAL_EXCHANGE_ADDRESS as `0x${string}`,
    abi: COLLATERAL_EXCHANGE_ABI,
    functionName: 'sctToken'
  });

  const { data: toTokenAddress, isError: toTokenError } = useContractRead({
    address: COLLATERAL_EXCHANGE_ADDRESS as `0x${string}`,
    abi: COLLATERAL_EXCHANGE_ABI,
    functionName: 'rctToken'
  });

  // Get contract's RCTv2 balance
  const { data: contractToBalance } = useContractRead({
    address: RCTV2_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [COLLATERAL_EXCHANGE_ADDRESS]
  });

  // Get user's RCT allowance for the contract
  const { data: fromAllowance } = useContractRead({
    address: RCT_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress || '0x0000000000000000000000000000000000000000', COLLATERAL_EXCHANGE_ADDRESS]
  });

  // Get user's RCT balance
  const { data: fromBalance } = useContractRead({
    address: RCT_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress || '0x0000000000000000000000000000000000000000']
  });

  // Get token decimals
  const { data: fromDecimals } = useContractRead({
    address: RCT_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals'
  });

  // Contract writes
  const { writeContract: migrate, data: migrateData } = useContractWrite({
    mutation: {
      onSuccess: (result) => {
        toast({
          title: "Migration Submitted",
          description: "Please wait while the transaction is being processed",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : 'Transaction failed',
        });
      }
    }
  });

  // Wait for transaction receipt
  const { isLoading: isWaitingMigrate, data: migrateReceipt } = useWaitForTransactionReceipt({
    hash: migrateData
  });

  const estimateGas = async (amount: bigint) => {
    if (!userAddress) return 500000n; // Fallback gas limit

    try {
      const gasEstimate = await publicClient.estimateContractGas({
        address: COLLATERAL_EXCHANGE_ADDRESS as `0x${string}`,
        abi: COLLATERAL_EXCHANGE_ABI,
        functionName: 'migrate',
        args: [amount],
        account: userAddress,
      });
      
      // Add 20% buffer to the gas estimate
      const gasWithBuffer = (gasEstimate * 120n) / 100n;
      return gasWithBuffer;
    } catch (error) {
      throw error;
    }
  };

  const handleMigrate = async (amount: bigint) => {
    if (!userAddress || !migrate) {
      throw new Error('Migration prerequisites not met');
    }

    // Both tokens have 6 decimals, so no scaling is needed
    const migrationAmount = amount;

    // Check contract's RCTv2 balance
    const contractBalance = BigInt(contractToBalance?.toString() || '0');
    if (contractBalance < migrationAmount) {
      throw new Error('Migration contract has insufficient RCTv2 balance for this migration. Please try a smaller amount or contact support.');
    }

    // Check user's RCT balance and allowance
    const userBalance = BigInt(fromBalance?.toString() || '0');
    const userAllowance = BigInt(fromAllowance?.toString() || '0');

    if (userBalance < amount) {
      throw new Error(`Insufficient RCT balance for migration. You have ${formatTokenBalance(userBalance, Number(fromDecimals))} RCT available.`);
    }

    if (userAllowance < amount) {
      throw new Error('Insufficient allowance. Please approve the contract to spend your RCT tokens.');
    }

    const gasLimit = await estimateGas(migrationAmount);
    
    await migrate({
      abi: COLLATERAL_EXCHANGE_ABI,
      address: COLLATERAL_EXCHANGE_ADDRESS as `0x${string}`,
      functionName: 'migrate',
      args: [migrationAmount],
      chain: avalancheCChain,
      account: userAddress,
      gas: gasLimit
    });
  };

  return {
    migrationActive,
    migrationActiveError,
    fromTokenAddress,
    fromTokenError,
    toTokenAddress,
    toTokenError,
    contractToBalance,
    fromAllowance,
    fromBalance,
    fromDecimals,
    handleMigrate,
    isWaitingMigrate,
    migrateReceipt
  };
} 