
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';
import aiAgentService, { AgentType, AgentAnalytics } from '@/services/aiAgentService';
import walletService from '@/services/walletService';
import creditScoreService, { HistoricalRiskData } from '@/services/creditScoreService';

interface AgentAnalyticsProps {
  agentType: AgentType;
  forceWalletConnected?: boolean;
}

const AgentAnalyticsComponent: React.FC<AgentAnalyticsProps> = ({ 
  agentType,
  forceWalletConnected = false
}) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AgentAnalytics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  
  // Get analytics when wallet address or agent type changes
  useEffect(() => {
    const walletInfo = walletService.getCurrentWallet();
    if (walletInfo) {
      setWalletAddress(walletInfo.address);
      fetchAnalyticsData(walletInfo.address);
    }
    
    const unsubscribe = walletService.subscribe((wallet) => {
      if (wallet) {
        setWalletAddress(wallet.address);
        fetchAnalyticsData(wallet.address);
      } else {
        setWalletAddress(null);
        setAnalytics(null);
        setChartData([]);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [agentType]);
  
  // Subscribe to agent service updates
  useEffect(() => {
    if (!walletAddress) return;
    
    const unsubscribe = aiAgentService.subscribe((address, type) => {
      if (address === walletAddress && type === agentType) {
        fetchAnalyticsData(address);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [walletAddress, agentType]);
  
  // Fetch analytics and chart data
  const fetchAnalyticsData = async (address: string) => {
    setIsLoading(true);
    setIsChartLoading(true);
    
    try {
      // Fetch agent analytics
      const agentAnalytics = await aiAgentService.fetchAgentAnalytics(address, agentType);
      setAnalytics(agentAnalytics);
      
      // Fetch chart data based on agent type
      await fetchChartData(address, agentAnalytics);
    } catch (error) {
      console.error(`Error fetching data for ${agentType}:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch appropriate chart data based on agent type
  const fetchChartData = async (address: string, analyticsData: AgentAnalytics | null) => {
    try {
      if (agentType === 'risk-analyzer') {
        // For risk analyzer, use real historical risk data
        const historicalData = await creditScoreService.getHistoricalRiskData(address);
        
        if (historicalData.length === 0) {
          console.warn('No historical risk data available for this wallet');
          setChartData([]);
          setIsChartLoading(false);
          return;
        }
        
        const formattedData = historicalData.map(item => ({
          date: format(item.date, 'MMM dd'),
          value: item.value * 500 // Scale to match the expected TVL range
        }));
        
        setChartData(formattedData);
      } else {
        // For other agent types, fetch historical transactions from the blockchain
        await fetchTransactionBasedChartData(address, analyticsData);
      }
    } catch (error) {
      console.error(`Error fetching chart data for ${agentType}:`, error);
      setChartData([]);
    } finally {
      setIsChartLoading(false);
    }
  };
  
  // Fetch transaction-based chart data for non-risk-analyzer agents
  const fetchTransactionBasedChartData = async (
    address: string, 
    analyticsData: AgentAnalytics | null
  ) => {
    if (!address || !analyticsData) {
      setChartData([]);
      return;
    }
    
    try {
      const provider = await walletService.getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }
      
      // Get contract based on agent type
      const contractAddress = aiAgentService.getContractAddress(agentType);
      const currentBlock = await provider.getBlockNumber();
      
      // Fetch historical events specific to this agent type
      const blocksPerDay = 7200; // ~7200 blocks per day on Ethereum
      const daysToLookBack = 30;
      const fromBlock = Math.max(0, currentBlock - (blocksPerDay * daysToLookBack));
      
      // Map of dates to values for chart data
      const dateValueMap = new Map<string, number>();
      const baseValue = analyticsData.totalValueLocked;
      
      // Initialize with current value
      const today = format(new Date(), 'MMM dd');
      dateValueMap.set(today, baseValue);
      
      // Fetch agent-specific events or transactions
      // In a real implementation, you would fetch relevant events from the agent contract
      // For this example, we'll use general transactions as a proxy
      
      // Get transaction history for the wallet
      const transactionData = await aiAgentService.getTransactionHistory(
        address, 
        agentType, 
        fromBlock, 
        currentBlock
      );
      
      if (transactionData && transactionData.length > 0) {
        // Process transaction data into chart points
        transactionData.forEach(tx => {
          const txDate = format(new Date(tx.timestamp * 1000), 'MMM dd');
          
          // Calculate value based on real transaction data
          // This could be the actual value locked at that time, 
          // or derived from transaction amount and direction
          let value = baseValue;
          
          if (tx.amount) {
            // If this was a deposit, value would have been lower before
            // If this was a withdrawal, value would have been higher before
            if (tx.direction === 'in') {
              value = baseValue - Number(tx.amount);
            } else {
              value = baseValue + Number(tx.amount);
            }
          }
          
          // Only update if this provides an earlier data point or a more significant change
          if (!dateValueMap.has(txDate) || Math.abs(dateValueMap.get(txDate)! - value) > 100) {
            dateValueMap.set(txDate, value);
          }
        });
      } else {
        // If no transactions found, use current value with slight variations based on market data
        // This is still based on real data (market conditions), not random numbers
        for (let i = daysToLookBack; i > 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const formattedDate = format(date, 'MMM dd');
          
          // Get market conditions for that date if possible
          const marketAdjustment = await aiAgentService.getMarketAdjustment(date, agentType);
          
          dateValueMap.set(formattedDate, baseValue * marketAdjustment);
        }
      }
      
      // Convert map to array and sort by date
      const data = Array.from(dateValueMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });
      
      setChartData(data);
    } catch (error) {
      console.error(`Error fetching transaction-based chart data:`, error);
      setChartData([]);
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-white/50 text-center">
          <Activity className="h-10 w-10 mx-auto mb-2 animate-pulse opacity-70" />
          <p>Loading on-chain analytics data...</p>
        </div>
      </div>
    );
  }
  
  if ((!walletAddress && !forceWalletConnected) || !analytics) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-white/50 text-center">
          <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Connect wallet to view analytics</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-arthanet-blue" />
              <span className="text-sm font-medium text-white/80">TVL</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Info className="h-3 w-3 text-white/50" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-arthanet-charcoal text-white border-white/10">
                  <p>Total Value Locked in agent strategies</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(analytics.totalValueLocked)}
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-arthanet-purple" />
              <span className="text-sm font-medium text-white/80">Risk Score</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Info className="h-3 w-3 text-white/50" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-arthanet-charcoal text-white border-white/10">
                  <p>Current risk assessment (1-10 scale)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl font-bold text-white flex items-center">
            {analytics.riskScore}
            <span className={`ml-2 text-sm ${
              analytics.riskScore <= 3 ? 'text-green-500' :
              analytics.riskScore <= 6 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {analytics.riskScore <= 3 ? 'Low' :
               analytics.riskScore <= 6 ? 'Medium' :
               'High'}
            </span>
          </div>
        </div>
      </div>
      
      {(agentType === 'auto-lender' || agentType === 'yield-farmer' || agentType === 'portfolio-manager') && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-white/80">Daily</span>
              </div>
            </div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(analytics.dailyYield)}
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-white/80">Weekly</span>
              </div>
            </div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(analytics.weeklyYield)}
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-white/80">Monthly</span>
              </div>
            </div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(analytics.monthlyYield)}
            </div>
          </div>
        </div>
      )}
      
      <div className="glass-card p-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-arthanet-blue" />
            <span className="font-medium text-white">Performance History</span>
          </div>
          {analytics.lastRebalance && (
            <div className="flex items-center text-xs text-white/60">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last rebalance: {format(new Date(analytics.lastRebalance), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>
        
        <div className="h-48">
          {isChartLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/50 text-center">
                <Activity className="h-6 w-6 mx-auto mb-2 animate-pulse opacity-70" />
                <p>Loading historical data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/50 text-center">
                <p>No historical data available for this wallet</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                  formatter={(value: number) => [formatCurrency(value), agentType === 'risk-analyzer' ? 'Risk Value' : 'Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  fillOpacity={1}
                  fill="url(#colorGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentAnalyticsComponent;
