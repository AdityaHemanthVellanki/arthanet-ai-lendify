
import React, { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import DefiPositionsComponent from './DefiPositions';
import AgentAnalyticsComponent from './AgentAnalytics';
import AgentActionsComponent from './AgentActions';
import AgentControls from './AgentControls';
import { AgentType } from '@/services/aiAgentService';
import walletService from '@/services/walletService';

interface AgentDashboardProps {
  agentType: AgentType;
  agentName: string;
  agentDescription: string;
  icon: React.ReactNode;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ 
  agentType, 
  agentName, 
  agentDescription,
  icon
}) => {
  const [walletConnected, setWalletConnected] = useState(false);
  
  useEffect(() => {
    // Check if wallet is already connected
    const currentWallet = walletService.getCurrentWallet();
    setWalletConnected(!!currentWallet);
    
    // Subscribe to wallet changes
    const unsubscribe = walletService.subscribe((wallet) => {
      setWalletConnected(!!wallet);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  return (
    <div className="pt-32 p-8"> {/* Keep padding-top to avoid header overlap */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 glass-card rounded-full">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{agentName}</h1>
              <p className="text-white/70">{agentDescription}</p>
            </div>
          </div>
          
          <AgentControls agentType={agentType} agentName={agentName} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Performance Analytics</h2>
              <AgentAnalyticsComponent agentType={agentType} forceWalletConnected={walletConnected} />
            </GlassCard>
            
            <AgentActionsComponent agentType={agentType} />
          </div>
          
          <div className="space-y-8">
            <DefiPositionsComponent forceWalletConnected={walletConnected} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
