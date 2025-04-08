import { useContractRead, useContractWrite, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import {
  COLLATERAL_EXCHANGE_ABI,
  COLLATERAL_EXCHANGE_ADDRESS,
  SCT_TOKEN_ADDRESS,
  RCT_TOKEN_ADDRESS,
  SCT_TOKEN_ABI,
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

  const { data: sctTokenAddress, isError: sctTokenError } = useContractRead({
    address: COLLATERAL_EXCHANGE_ADDRESS as `0x${string}`,
    abi: COLLATERAL_EXCHANGE_ABI,
    functionName: 'sctToken'
  });

  const { data: rctTokenAddress, isError: rctTokenError } = useContractRead({
    address: COLLATERAL_EXCHANGE_ADDRESS as `0x${string}`,
    abi: COLLATERAL_EXCHANGE_ABI,
    functionName: 'rctToken'
  });

  // Get contract's RCT balance
  const { data: contractRctBalance } = useContractRead({
    address: rctTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [COLLATERAL_EXCHANGE_ADDRESS]
  });

  // Get user's SCT allowance for the contract
  const { data: sctAllowance } = useContractRead({
    address: SCT_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress || '0x0000000000000000000000000000000000000000', COLLATERAL_EXCHANGE_ADDRESS]
  });

  // Get user's SCT balance
  const { data: sctBalance } = useContractRead({
    address: SCT_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress || '0x0000000000000000000000000000000000000000']
  });

  // Get token decimals
  const { data: sctDecimals } = useContractRead({
    address: SCT_TOKEN_ADDRESS as `0x${string}`,
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

    // Check contract's RCT balance
    const contractBalance = BigInt(contractRctBalance?.toString() || '0');
    if (contractBalance < migrationAmount) {
      throw new Error('Migration contract has insufficient RCT balance for this migration. Please try a smaller amount or contact support.');
    }

    // Check user's SCT balance and allowance
    const userBalance = BigInt(sctBalance?.toString() || '0');
    const userAllowance = BigInt(sctAllowance?.toString() || '0');

    if (userBalance < amount) {
      throw new Error(`Insufficient SCT balance for migration. You have ${formatTokenBalance(userBalance, Number(sctDecimals))} SCT available.`);
    }

    if (userAllowance < amount) {
      throw new Error('Insufficient allowance. Please approve the contract to spend your SCT tokens.');
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
    sctTokenAddress,
    sctTokenError,
    rctTokenAddress,
    rctTokenError,
    contractRctBalance,
    sctAllowance,
    sctBalance,
    sctDecimals,
    handleMigrate,
    isWaitingMigrate,
    migrateReceipt
  };
} 