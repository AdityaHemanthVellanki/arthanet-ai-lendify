
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Info
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import aiAgentService, { AgentType, AgentAction } from '@/services/aiAgentService';
import walletService from '@/services/walletService';

interface AgentActionsProps {
  agentType: AgentType;
}

const AgentActionsComponent: React.FC<AgentActionsProps> = ({ agentType }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get actions when wallet address or agent type changes
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      const walletInfo = walletService.getCurrentWallet();
      
      if (walletInfo) {
        setWalletAddress(walletInfo.address);
        // Fetch actions for the current agent
        const agentActions = aiAgentService.getAgentActions(walletInfo.address, agentType);
        setActions(agentActions);
      } else {
        setWalletAddress(null);
        setActions([]);
      }
      setIsLoading(false);
    };
    
    // Fetch data immediately
    fetchData();
    
    const unsubscribe = walletService.subscribe((wallet) => {
      if (wallet) {
        setWalletAddress(wallet.address);
        const agentActions = aiAgentService.getAgentActions(wallet.address, agentType);
        setActions(agentActions);
      } else {
        setWalletAddress(null);
        setActions([]);
      }
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [agentType]);
  
  // Subscribe to agent service updates
  useEffect(() => {
    if (!walletAddress) return;
    
    const unsubscribe = aiAgentService.subscribe((address, type) => {
      if (address === walletAddress && (type === agentType || !type)) {
        const agentActions = aiAgentService.getAgentActions(address, agentType);
        setActions(agentActions);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [walletAddress, agentType]);
  
  if (isLoading) {
    return (
      <div className="glass-card p-6 text-center">
        <Activity className="h-10 w-10 mx-auto mb-2 text-arthanet-blue animate-pulse" />
        <p className="text-white/70">Loading on-chain activity...</p>
      </div>
    );
  }
  
  if (!walletAddress) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-white/50">
          <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Connect wallet to view agent activity</p>
        </div>
      </div>
    );
  }
  
  if (actions.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Info className="h-10 w-10 mx-auto mb-2 text-arthanet-blue opacity-70" />
        <p className="text-white/70">No actions have been performed yet</p>
        <p className="text-sm text-white/50 mt-2">
          Configure agent settings and activate it to start seeing activity
        </p>
      </div>
    );
  }
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="glass-card overflow-hidden"
    >
      <CollapsibleTrigger asChild>
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-arthanet-blue" />
            <h3 className="font-medium text-white">Agent Activity</h3>
          </div>
          <Button variant="ghost" size="icon" className="text-white/70">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CollapsibleTrigger>
      <Separator className="bg-white/10" />
      <CollapsibleContent>
        <div className="max-h-80 overflow-y-auto">
          {actions.map((action, index) => (
            <div 
              key={action.id} 
              className={`p-4 ${index < actions.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    {action.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {action.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                    {action.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="font-medium text-white">{action.action}</span>
                  </div>
                  <p className="text-sm text-white/70 mt-1">{action.details}</p>
                </div>
                <div className="text-sm text-white/50">
                  {format(new Date(action.timestamp), 'MMM dd, HH:mm')}
                </div>
              </div>
              
              {action.txHash && (
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-arthanet-blue hover:text-arthanet-blue hover:bg-white/5"
                    onClick={() => window.open(`https://etherscan.io/tx/${action.txHash}`, '_blank')}
                  >
                    <ExternalLink size={12} className="mr-1" />
                    View Transaction
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AgentActionsComponent;
