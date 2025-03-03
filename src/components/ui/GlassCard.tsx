
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: 'blue' | 'purple' | 'none';
  className?: string;
}

const GlassCard = ({ 
  children, 
  glow = 'none', 
  className, 
  ...props 
}: GlassCardProps) => {
  return (
    <div
      className={cn(
        'glass-card p-6 rounded-xl transition-all duration-300',
        glow === 'blue' && 'glow-blue',
        glow === 'purple' && 'glow-purple',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
