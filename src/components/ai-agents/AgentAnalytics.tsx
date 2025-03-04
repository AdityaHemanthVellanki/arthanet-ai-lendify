
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

interface AgentAnalyticsProps {
  agentType: AgentType;
}

const AgentAnalyticsComponent: React.FC<AgentAnalyticsProps> = ({ agentType }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AgentAnalytics | null>(null);
  
  // Get analytics when wallet address or agent type changes
  useEffect(() => {
    const walletInfo = walletService.getCurrentWallet();
    if (walletInfo) {
      setWalletAddress(walletInfo.address);
      const agentAnalytics = aiAgentService.getAgentAnalytics(walletInfo.address, agentType);
      setAnalytics(agentAnalytics);
    }
    
    const unsubscribe = walletService.subscribe((wallet) => {
      if (wallet) {
        setWalletAddress(wallet.address);
        const agentAnalytics = aiAgentService.getAgentAnalytics(wallet.address, agentType);
        setAnalytics(agentAnalytics);
      } else {
        setWalletAddress(null);
        setAnalytics(null);
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
        const agentAnalytics = aiAgentService.getAgentAnalytics(address, agentType);
        setAnalytics(agentAnalytics);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [walletAddress, agentType]);
  
  // Generate mock chart data - in a real app this would come from a backend API
  const generateMockChartData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Base value + some randomness + slight upward trend
      const baseValue = analytics?.totalValueLocked || 5000;
      const randomFactor = Math.random() * 0.1; // 0-10% random variation
      const trendFactor = (30 - i) / 300; // Slight upward trend
      
      data.push({
        date: format(date, 'MMM dd'),
        value: baseValue * (1 - 0.05 + randomFactor + trendFactor)
      });
    }
    
    return data;
  };
  
  const chartData = analytics ? generateMockChartData() : [];
  
  if (!walletAddress || !analytics) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-white/50 text-center">
          <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Connect wallet to view analytics</p>
        </div>
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
                formatter={(value: number) => [formatCurrency(value), 'Value']}
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
        </div>
      </div>
    </div>
  );
};

export default AgentAnalyticsComponent;
