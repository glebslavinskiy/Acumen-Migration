
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  token: {
    symbol: string;
    name: string;
    icon?: string;
  };
  balance?: number;
  disabled?: boolean;
}

const TokenInput: React.FC<TokenInputProps> = ({
  label,
  value,
  onChange,
  token,
  balance,
  disabled = false,
}) => {
  return (
    <Card className="p-4 mb-2">
      <div className="flex justify-between items-center mb-2">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        {balance !== undefined && (
          <div className="text-xs text-muted-foreground">
            Balance: <span className="font-medium">{balance}</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          placeholder="0.0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-lg font-medium"
          disabled={disabled}
        />
        <div className="flex items-center bg-secondary rounded-md px-3 py-2 min-w-24 cursor-pointer">
          <div className="w-5 h-5 rounded-full bg-gradient-defi mr-2"></div>
          <span className="font-medium text-sm">{token.symbol}</span>
          <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
};

export default TokenInput;
