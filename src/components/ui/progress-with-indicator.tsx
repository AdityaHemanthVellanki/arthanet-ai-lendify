
import React from 'react';
import { Progress as BaseProgress, ProgressProps as BaseProgressProps } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ProgressWithIndicatorProps extends BaseProgressProps {
  indicatorClassName?: string;
}

const ProgressWithIndicator = React.forwardRef<
  HTMLDivElement,
  ProgressWithIndicatorProps
>(({ value, className, indicatorClassName, ...props }, ref) => {
  return (
    <BaseProgress
      ref={ref}
      value={value}
      className={className}
      {...props}
    >
      <div 
        className={cn("h-full bg-primary", indicatorClassName)} 
        style={{ width: `${value}%` }}
      />
    </BaseProgress>
  );
});

ProgressWithIndicator.displayName = "ProgressWithIndicator";

export { ProgressWithIndicator };
