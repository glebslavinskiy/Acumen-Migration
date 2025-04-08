import { useContractRead, useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { ERC20_ABI, SCT_TOKEN_ABI, RCT_TOKEN_ADDRESS } from '../config/contracts';
import { type Hash } from 'viem';
import { useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";

export interface TokenContractHookProps {
  tokenAddress?: `0x${string}`;
  spenderAddress?: `0x${string}`;
  userAddress?: `0x${string}`;
  isScToken?: boolean;
}

export function useTokenContract({ tokenAddress, spenderAddress, userAddress, isScToken }: TokenContractHookProps) {
  // Use SCT_TOKEN_ABI for SCT token, otherwise use ERC20_ABI
  const abi = isScToken ? SCT_TOKEN_ABI : ERC20_ABI;

  // Contract reads
  const { data: decimals, isError: decimalsError } = useContractRead({
    address: tokenAddress || '0x0000000000000000000000000000000000000000',
    abi,
    functionName: 'decimals',
    account: userAddress as `0x${string}`,
    chainId: 43114
  });

  const { data: balance, refetch: refetchBalance, isError: balanceError } = useContractRead({
    address: tokenAddress || '0x0000000000000000000000000000000000000000',
    abi,
    functionName: 'balanceOf',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    account: userAddress as `0x${string}`,
    chainId: 43114
  });

  const { data: allowance, refetch: refetchAllowance, isError: allowanceError } = useContractRead({
    address: tokenAddress || '0x0000000000000000000000000000000000000000',
    abi,
    functionName: 'allowance',
    args: [
      userAddress || '0x0000000000000000000000000000000000000000',
      spenderAddress || '0x0000000000000000000000000000000000000000'
    ],
    account: userAddress as `0x${string}`,
    chainId: 43114
  });

  // Contract writes
  const { writeContract: approve, data: approveData } = useContractWrite({
    mutation: {
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
  const { isLoading: isWaitingApprove, data: approveReceipt } = useWaitForTransactionReceipt({
    hash: approveData as Hash | undefined
  });

  // Monitor approval transaction status
  useEffect(() => {
    if (approveData && !isWaitingApprove && approveReceipt) {
      if (approveReceipt.status === 'success') {
        refetchAllowance();
        toast({
          title: "Approval Successful",
          description: "You can now proceed with the transaction",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Approval Failed",
          description: "Transaction failed. Please try approving again.",
        });
      }
    }
  }, [approveData, isWaitingApprove, approveReceipt, refetchAllowance]);

  return {
    decimals,
    decimalsError,
    balance,
    balanceError,
    refetchBalance,
    allowance,
    allowanceError,
    refetchAllowance,
    approve,
    isWaitingApprove,
    approveReceipt
  };
} 