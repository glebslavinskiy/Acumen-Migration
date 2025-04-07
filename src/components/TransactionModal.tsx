
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
import { ArrowRight, CheckCircle, Hourglass } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromToken: { amount: string; symbol: string };
  toToken: { amount: string; symbol: string };
  onConfirm: () => void;
  status: "preview" | "pending" | "success";
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  fromToken,
  toToken,
  onConfirm,
  status,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>
            {status === "preview" && "Confirm Swap"}
            {status === "pending" && "Transaction Pending"}
            {status === "success" && "Transaction Success"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {status === "preview" && "Review your swap details before confirming"}
            {status === "pending" && "Please wait while your transaction is being processed"}
            {status === "success" && "Your swap has been successfully completed"}
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-center text-sm">
              Successfully swapped {fromToken.amount} {fromToken.symbol} for {toToken.amount} {toToken.symbol}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white mr-2"></div>
                  <p className="font-medium">{fromToken.amount} {fromToken.symbol}</p>
                </div>
                <p className="text-sm text-gray-400">From</p>
              </div>
              
              <div className="flex justify-center">
                <ArrowRight className="text-gray-400" />
              </div>
              
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 mr-2"></div>
                  <p className="font-medium">{toToken.amount} {toToken.symbol}</p>
                </div>
                <p className="text-sm text-gray-400">To</p>
              </div>
              
              <Separator className="bg-gray-800" />
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Rate</span>
                  <span>1 {fromToken.symbol} = 0.82 {toToken.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee</span>
                  <span>0.3%</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              {status === "preview" ? (
                <>
                  <Button variant="outline" onClick={onClose} className="w-full sm:w-auto border-gray-700 text-white hover:bg-gray-800">
                    Cancel
                  </Button>
                  <Button onClick={onConfirm} className="w-full sm:w-auto bg-white text-black hover:bg-gray-200">
                    Confirm Swap
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
  );
};

export default TransactionModal;
