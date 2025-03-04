
import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  TrendingUp,
  BarChart3,
  Activity,
  RefreshCw,
  Loader2
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
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { ethers } from 'ethers';
import walletService from '@/services/walletService';
import LendingProtocolABI from '@/abis/LendingProtocolABI.json';
import YieldFarmerABI from '@/abis/YieldFarmerABI.json';
import PortfolioManagerABI from '@/abis/PortfolioManagerABI.json';
import RiskAnalyzerABI from '@/abis/RiskAnalyzerABI.json';

// Contract addresses for different protocols (would typically come from environment variables)
const LENDING_PROTOCOL_ADDRESS = '0x6789012345678901234567890123456789012345';
const YIELD_FARMER_ADDRESS = '0x7890123456789012345678901234567890123456';
const PORTFOLIO_MANAGER_ADDRESS = '0x8901234567890123456789012345678901234567';
const RISK_ANALYZER_ADDRESS = '0x9012345678901234567890123456789012345678';

// Interface for DeFi position data
export interface DefiPosition {
  assetAddress: string;
  assetName: string;
  platform: string;
  balance: number;
  valueUSD: number;
  apy: number;
  risk: number;
}

interface DefiPositionsProps {
  forceWalletConnected?: boolean;
}

const DefiPositionsComponent: React.FC<DefiPositionsProps> = ({ forceWalletConnected }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [positions, setPositions] = useState<DefiPosition[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Fetch on-chain data when wallet address changes
  useEffect(() => {
    const fetchOnChainData = async () => {
      setIsLoading(true);
      const walletInfo = walletService.getCurrentWallet();
      
      if (walletInfo) {
        setWalletAddress(walletInfo.address);
        
        try {
          console.log("Fetching real-time DeFi positions for address:", walletInfo.address);
          
          // Get provider from wallet service
          const provider = walletService.getProvider();
          if (!provider) {
            throw new Error("No provider available");
          }
          
          // Combine positions from different protocols
          const allPositions = await fetchAllProtocolPositions(walletInfo.address, provider);
          
          if (allPositions.length > 0) {
            setPositions(allPositions);
            console.log("Real-time positions loaded:", allPositions.length);
          } else {
            console.log("No DeFi positions found on-chain");
            setPositions([]);
          }
        } catch (error) {
          console.error("Error fetching on-chain positions:", error);
          toast.error("Failed to fetch DeFi positions", {
            description: error instanceof Error ? error.message : "Unknown error"
          });
          setPositions([]);
        } finally {
          setIsLoading(false);
          setIsFirstLoad(false);
        }
      } else {
        setWalletAddress(null);
        setPositions([]);
        setIsLoading(false);
        setIsFirstLoad(false);
      }
    };
    
    // Fetch data immediately
    fetchOnChainData();
    
    // Subscribe to wallet changes
    const unsubscribe = walletService.subscribe((wallet) => {
      if (wallet) {
        if (wallet.address !== walletAddress) {
          setWalletAddress(wallet.address);
          setIsFirstLoad(true);
          fetchOnChainData();
        }
      } else {
        setWalletAddress(null);
        setPositions([]);
        setIsLoading(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [forceWalletConnected, walletAddress]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (!walletAddress || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const provider = walletService.getProvider();
      if (!provider) {
        throw new Error("No provider available");
      }
      
      // Fetch fresh positions from blockchain
      const updatedPositions = await fetchAllProtocolPositions(walletAddress, provider);
      setPositions(updatedPositions);
      
      toast.success("DeFi positions refreshed", {
        description: `Found ${updatedPositions.length} active positions`
      });
    } catch (error) {
      console.error("Error refreshing positions:", error);
      toast.error("Failed to refresh positions", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Fetch positions from all supported protocols
  const fetchAllProtocolPositions = async (address: string, provider: ethers.BrowserProvider): Promise<DefiPosition[]> => {
    const allPositions: DefiPosition[] = [];
    
    try {
      // 1. Fetch lending positions
      const lendingPositions = await fetchLendingPositions(address, provider);
      allPositions.push(...lendingPositions);
      
      // 2. Fetch yield farming positions
      const yieldPositions = await fetchYieldPositions(address, provider);
      allPositions.push(...yieldPositions);
      
      // 3. Get risk data for all positions
      if (allPositions.length > 0) {
        await enrichPositionsWithRiskData(allPositions, address, provider);
      }
      
      return allPositions;
    } catch (error) {
      console.error("Error fetching positions from all protocols:", error);
      return allPositions;
    }
  };
  
  // Fetch positions from lending protocols
  const fetchLendingPositions = async (address: string, provider: ethers.BrowserProvider): Promise<DefiPosition[]> => {
    try {
      const contract = new ethers.Contract(LENDING_PROTOCOL_ADDRESS, LendingProtocolABI, provider);
      const userPositions = await contract.getUserPositions(address);
      
      if (!userPositions || userPositions.length === 0) {
        return [];
      }
      
      // Map contract data to our interface
      return userPositions.map((position: any) => ({
        assetAddress: position.poolAddress,
        assetName: `Lending Pool ${position.poolAddress.substring(0, 6)}`,
        platform: "Lending Protocol",
        balance: Number(ethers.formatEther(position.balance)),
        valueUSD: Number(ethers.formatEther(position.valueUSD)) * 1800, // Approximate USD value
        apy: Number(position.apy) / 100, // Convert basis points to percentage
        risk: 3 // Default risk, will be updated with risk data
      }));
    } catch (error) {
      console.error("Error fetching lending positions:", error);
      return [];
    }
  };
  
  // Fetch positions from yield farming protocols
  const fetchYieldPositions = async (address: string, provider: ethers.BrowserProvider): Promise<DefiPosition[]> => {
    try {
      const contract = new ethers.Contract(YIELD_FARMER_ADDRESS, YieldFarmerABI, provider);
      const userPositions = await contract.getUserFarmPositions(address);
      
      if (!userPositions || userPositions.length === 0) {
        return [];
      }
      
      // Get farm details to enrich the position data
      const farms = await contract.getAvailableYieldFarms();
      const farmsMap = new Map();
      
      for (const farm of farms) {
        farmsMap.set(farm.farmAddress.toLowerCase(), {
          name: farm.name,
          apy: Number(farm.apy) / 100,
          risk: Number(farm.riskLevel)
        });
      }
      
      // Map contract data to our interface
      return userPositions.map((position: any) => {
        const farmAddress = position.farmAddress.toLowerCase();
        const farmDetails = farmsMap.get(farmAddress) || { 
          name: `Farm ${farmAddress.substring(0, 6)}`,
          apy: 5,
          risk: 5
        };
        
        return {
          assetAddress: position.farmAddress,
          assetName: farmDetails.name,
          platform: "Yield Farm",
          balance: Number(ethers.formatEther(position.stakedAmount)),
          valueUSD: Number(ethers.formatEther(position.valueUSD)),
          apy: farmDetails.apy,
          risk: farmDetails.risk
        };
      });
    } catch (error) {
      console.error("Error fetching yield positions:", error);
      return [];
    }
  };
  
  // Enrich positions with risk data
  const enrichPositionsWithRiskData = async (positions: DefiPosition[], address: string, provider: ethers.BrowserProvider): Promise<void> => {
    try {
      const contract = new ethers.Contract(RISK_ANALYZER_ADDRESS, RiskAnalyzerABI, provider);
      
      // Run risk analysis (this might be a transaction that costs gas)
      // For a read-only app, you might want to skip this step
      // await contract.runRiskAnalysis(address);
      
      // Get risk metrics
      const riskMetrics = await contract.getRiskMetrics(address);
      
      // Apply risk metrics to positions
      for (const position of positions) {
        // For demo, use overall risk score; in production, you'd match by position address
        position.risk = Math.min(Math.max(Number(riskMetrics.overallRiskScore) / 10, 1), 10);
      }
    } catch (error) {
      console.error("Error enriching positions with risk data:", error);
      // Don't throw - we'll use default risk scores if this fails
    }
  };
  
  if (isLoading && isFirstLoad) {
    return (
      <div className="glass-card p-6 text-center">
        <Loader2 className="h-10 w-10 mx-auto mb-2 text-arthanet-blue animate-spin" />
        <p className="text-white/70">Loading on-chain data...</p>
        <p className="text-sm text-white/50 mt-2">
          Scanning blockchain for your positions
        </p>
      </div>
    );
  }
  
  if (!walletAddress && !forceWalletConnected) {
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
          We've checked multiple protocols but didn't find any active positions
        </p>
        <Button 
          className="mt-4 bg-blue-purple-gradient hover:opacity-90 text-white"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Rescan Blockchain
            </>
          )}
        </Button>
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
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-white/70">
              {positions.length} active position{positions.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="outline" 
              size="sm"
              className="text-white/70 border-white/20 hover:bg-white/10"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">{isRefreshing ? 'Scanning...' : 'Refresh'}</span>
            </Button>
          </div>
          
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
                    <p className="text-sm text-white/70 mt-1">Balance: {position.balance.toFixed(6)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 text-sm text-white/70">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>APY</span>
                      </div>
                      <span className="text-sm font-medium text-green-500">{position.apy.toFixed(2)}%</span>
                    </div>
                    <Progress 
                      value={position.apy * 5} 
                      className="h-1.5 bg-white/10" 
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
