
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {status === "preview" && "Confirm Swap"}
            {status === "pending" && "Transaction Pending"}
            {status === "success" && "Transaction Success"}
          </DialogTitle>
          <DialogDescription>
            {status === "preview" && "Review your swap details before confirming"}
            {status === "pending" && "Please wait while your transaction is being processed"}
            {status === "success" && "Your swap has been successfully completed"}
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
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
                  <div className="w-6 h-6 rounded-full bg-gradient-defi mr-2"></div>
                  <p className="font-medium">{fromToken.amount} {fromToken.symbol}</p>
                </div>
                <p className="text-sm text-muted-foreground">From</p>
              </div>
              
              <div className="flex justify-center">
                <ArrowRight className="text-muted-foreground" />
              </div>
              
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-defi-blue to-defi-purple mr-2"></div>
                  <p className="font-medium">{toToken.amount} {toToken.symbol}</p>
                </div>
                <p className="text-sm text-muted-foreground">To</p>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span>1 {fromToken.symbol} = 0.82 {toToken.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee</span>
                  <span>0.3%</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              {status === "preview" ? (
                <>
                  <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={onConfirm} className="w-full sm:w-auto bg-gradient-defi">
                    Confirm Swap
                  </Button>
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
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
