import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Add styles to remove number input spinners
const inputStyles = `
  [type='number']::-webkit-outer-spin-button,
  [type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  [type='number'] {
    -moz-appearance: textfield;
  }
`;

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onMaxClick?: () => void;
  token: {
    symbol: string;
    name: string;
    icon?: string;
  };
  balance?: number;
  disabled?: boolean;
  showMaxButton?: boolean;
}

const TokenInput: React.FC<TokenInputProps> = ({
  label,
  value,
  onChange,
  onMaxClick,
  token,
  balance,
  disabled = false,
  showMaxButton = true,
}) => {
  return (
    <>
      <style>{inputStyles}</style>
      <Card className="p-4 mb-2 bg-gray-900 border border-gray-800 text-white">
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm text-gray-400">{label}</Label>
          {balance !== undefined && (
            <div className="text-xs text-gray-400">
              Balance: <span className="font-medium text-white">{balance}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              type="number"
              placeholder="0.0"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="text-lg font-medium bg-gray-800 border-gray-700 text-white pr-16"
              disabled={disabled}
            />
            {showMaxButton && onMaxClick && (
              <Button
                onClick={onMaxClick}
                disabled={disabled || !balance}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 bg-gray-700 hover:bg-gray-600 text-xs"
              >
                Max
              </Button>
            )}
          </div>
          <div className="flex items-center bg-gray-800 rounded-md px-2 py-2 min-w-[60px] justify-center">
            <span className="font-medium text-sm text-white">{token.symbol}</span>
          </div>
        </div>
      </Card>
    </>
  );
};

export default TokenInput;
