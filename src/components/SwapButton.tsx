
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwapButtonProps {
  className?: string;
}

const SwapButton = ({ className }: SwapButtonProps) => {
  return (
    <div className={cn("flex justify-center relative z-10", className)}>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full h-10 w-10 bg-white dark:bg-black border-2 border-gray-300 dark:border-gray-700 p-0 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-black absolute transform -translate-y-1/2"
        disabled
      >
        <ArrowUpDown className="h-5 w-5 text-black dark:text-white" />
      </Button>
    </div>
  );
};

export default SwapButton;
