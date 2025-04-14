import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, CheckCircle, Hourglass, Loader2, ExternalLink } from "lucide-react";

export type TransactionStatus = "preview" | "pending" | "success";

interface TransactionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  status: TransactionStatus;
  fromAmount: string;
  fromToken: string;
  toAmount: string;
  toToken: string;
  transactionHash: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  needsApproval: boolean;
}

export function TransactionModal({
  isOpen,
  onOpenChange,
  status,
  fromAmount,
  fromToken,
  toAmount,
  toToken,
  transactionHash,
  onConfirm,
  onCancel,
  needsApproval
}: TransactionModalProps) {
  // Add logging for state changes
  React.useEffect(() => {
    console.log('TransactionModal state updated:', {
      isOpen,
      status,
      fromAmount,
      fromToken,
      toAmount,
      toToken,
      transactionHash,
      needsApproval
    });
  }, [isOpen, status, fromAmount, fromToken, toAmount, toToken, transactionHash, needsApproval]);

  const getStatusContent = () => {
    const content = {
      preview: {
        title: needsApproval ? "Approve Token Transfer" : "Confirm Migration",
        description: needsApproval 
          ? "Please approve the contract to spend your RCT tokens"
          : `You are about to migrate ${fromAmount} ${fromToken} to ${toAmount} ${toToken}. This action cannot be undone.`,
        showButtons: true
      },
      pending: {
        title: needsApproval ? "Approving..." : "Migration in Progress",
        description: needsApproval 
          ? "Please confirm the transaction in your wallet"
          : "Please wait while your tokens are being migrated...",
        showButtons: false
      },
      success: {
        title: "Transaction Successful",
        description: `Successfully ${needsApproval ? 'approved' : 'migrated'} ${fromAmount} ${fromToken}${needsApproval ? '' : ` to ${toToken}`}`,
        showButtons: false
      }
    };

    console.log('Modal content for status:', {
      status,
      content: content[status] || { title: "", description: "", showButtons: false }
    });

    return content[status] || { title: "", description: "", showButtons: false };
  };

  const handleConfirm = () => {
    console.log('Transaction confirmation triggered:', {
      status,
      needsApproval,
      fromAmount,
      toAmount
    });
    onConfirm();
  };

  const handleCancel = () => {
    console.log('Transaction cancelled:', {
      status,
      needsApproval
    });
    onCancel();
  };

  const { title, description, showButtons } = getStatusContent();

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(newOpen) => {
        console.log('Modal visibility changing:', {
          from: isOpen,
          to: newOpen,
          status,
          needsApproval
        });
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="bg-black text-white border border-gray-800 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {status === "pending" && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          
          {status === "success" && transactionHash && (
            <div className="flex items-center justify-center gap-2">
              <a
                href={`https://snowtrace.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                onClick={() => {
                  console.log('Transaction explorer link clicked:', {
                    hash: transactionHash
                  });
                }}
              >
                View on Explorer <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {status === "preview" && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">You will send</span>
                <span className="text-white font-medium">{fromAmount} {fromToken}</span>
              </div>
              {!needsApproval && (
                <div className="flex justify-between">
                  <span className="text-gray-400">You will receive</span>
                  <span className="text-white font-medium">{toAmount} {toToken}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {showButtons && (
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent text-white border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-white text-black hover:bg-gray-200"
            >
              {needsApproval ? 'Approve' : 'Confirm'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
