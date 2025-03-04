
import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import aiAgentService, { DefiPosition } from '@/services/aiAgentService';
import walletService from '@/services/walletService';
import { cn } from "@/lib/utils";

const DefiPositionsComponent = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [positions, setPositions] = useState<DefiPosition[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get positions when wallet address changes
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      const walletInfo = walletService.getCurrentWallet();
      
      if (walletInfo) {
        setWalletAddress(walletInfo.address);
        // In a real implementation, this would fetch on-chain data
        const defiPositions = aiAgentService.getDefiPositions(walletInfo.address);
        setPositions(defiPositions);
      } else {
        setWalletAddress(null);
        setPositions([]);
      }
      setIsLoading(false);
    };
    
    // Fetch data immediately
    fetchData();
    
    // Subscribe to wallet changes
    const unsubscribe = walletService.subscribe((wallet) => {
      if (wallet) {
        setWalletAddress(wallet.address);
        const defiPositions = aiAgentService.getDefiPositions(wallet.address);
        setPositions(defiPositions);
      } else {
        setWalletAddress(null);
        setPositions([]);
      }
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Subscribe to agent service updates
  useEffect(() => {
    if (!walletAddress) return;
    
    const unsubscribe = aiAgentService.subscribe((address) => {
      if (address === walletAddress) {
        const defiPositions = aiAgentService.getDefiPositions(address);
        setPositions(defiPositions);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [walletAddress]);
  
  if (isLoading) {
    return (
      <div className="glass-card p-6 text-center">
        <Activity className="h-10 w-10 mx-auto mb-2 text-arthanet-blue animate-pulse" />
        <p className="text-white/70">Loading on-chain data...</p>
      </div>
    );
  }
  
  if (!walletAddress) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-white/50">
          <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Connect wallet to view DeFi positions</p>
        </div>
      </div>
    );
  }
  
  if (positions.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Activity className="h-10 w-10 mx-auto mb-2 text-arthanet-blue opacity-70" />
        <p className="text-white/70">No DeFi positions found</p>
        <p className="text-sm text-white/50 mt-2">
          Activate AI agents to create and manage DeFi positions
        </p>
      </div>
    );
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const getTotalValue = () => {
    return positions.reduce((total, position) => total + position.valueUSD, 0);
  };
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="glass-card overflow-hidden"
    >
      <CollapsibleTrigger asChild>
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-arthanet-purple" />
            <h3 className="font-medium text-white">DeFi Positions</h3>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white/70">
              Total: {formatCurrency(getTotalValue())}
            </span>
            <Button variant="ghost" size="icon" className="text-white/70">
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </div>
      </CollapsibleTrigger>
      <Separator className="bg-white/10" />
      <CollapsibleContent>
        <div className="p-4">
          <div className="space-y-6">
            {positions.map((position) => (
              <div key={position.assetAddress} className="glass-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{position.assetName}</span>
                      <span className="text-sm text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                        {position.platform}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 mt-1">
                      {position.assetAddress.substring(0, 8)}...{position.assetAddress.substring(position.assetAddress.length - 6)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">{formatCurrency(position.valueUSD)}</div>
                    <p className="text-sm text-white/70 mt-1">Balance: {position.balance}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 text-sm text-white/70">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>APY</span>
                      </div>
                      <span className="text-sm font-medium text-green-500">{position.apy}%</span>
                    </div>
                    <Progress 
                      value={position.apy * 5} 
                      className="h-1.5 bg-white/10" 
                      // Use cn utility to combine classes conditionally
                      indicatorClassName={cn("bg-gradient-to-r from-green-500 to-teal-400")}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 text-sm text-white/70">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        <span>Risk</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`text-sm font-medium ${
                              position.risk <= 3 ? 'text-green-500' :
                              position.risk <= 6 ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {position.risk}/10
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-arthanet-charcoal text-white border-white/10">
                            <p>
                              {position.risk <= 3 ? 'Low risk position' :
                               position.risk <= 6 ? 'Medium risk position' :
                               'High risk position'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Progress 
                      value={position.risk * 10} 
                      className="h-1.5 bg-white/10" 
                      indicatorClassName={cn(
                        position.risk <= 3 ? 'bg-green-500' :
                        position.risk <= 6 ? 'bg-yellow-500' :
                        'bg-red-500'
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DefiPositionsComponent;
