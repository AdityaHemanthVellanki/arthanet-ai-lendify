
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import * as ProgressPrimitive from "@radix-ui/react-progress";

export interface ProgressWithIndicatorProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  value?: number;
}

const ProgressWithIndicator = React.forwardRef<
  HTMLDivElement,
  ProgressWithIndicatorProps
>(({ value, className, indicatorClassName, ...props }, ref) => {
  return (
    <Progress
      ref={ref}
      value={value}
      className={className}
      {...props}
    >
      <div 
        className={cn("h-full bg-primary", indicatorClassName)} 
        style={{ width: `${value}%` }}
      />
    </Progress>
  );
});

ProgressWithIndicator.displayName = "ProgressWithIndicator";

export { ProgressWithIndicator };
