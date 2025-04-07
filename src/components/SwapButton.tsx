
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwapButtonProps {
  onClick: () => void;
  className?: string;
}

const SwapButton = ({ onClick, className }: SwapButtonProps) => {
  return (
    <div className={cn("flex justify-center -my-2 relative z-10", className)}>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full h-10 w-10 bg-background border-2 p-0 shadow-md"
        onClick={onClick}
      >
        <ArrowUpDown className="h-5 w-5 text-accent" />
      </Button>
    </div>
  );
};

export default SwapButton;
