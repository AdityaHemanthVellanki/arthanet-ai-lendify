
import React, { useState, useEffect } from 'react';
import { Play, Info, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import aiAgentService, { AgentType, AgentSettings } from '@/services/aiAgentService';
import walletService from '@/services/walletService';
import AgentSettingsComponent from './AgentSettings';

interface AgentControlsProps {
  agentType: AgentType;
  agentName: string;
}

const AgentControls: React.FC<AgentControlsProps> = ({ agentType, agentName }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get agent settings when wallet address or agent type changes
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      const walletInfo = walletService.getCurrentWallet();
      
      if (walletInfo) {
        setWalletAddress(walletInfo.address);
        const agentSettings = aiAgentService.getAgentSettings(walletInfo.address, agentType);
        setSettings(agentSettings);
      } else {
        setWalletAddress(null);
        setSettings(null);
      }
      setIsLoading(false);
    };
    
    // Fetch data immediately
    fetchData();
    
    const unsubscribe = walletService.subscribe((wallet) => {
      if (wallet) {
        setWalletAddress(wallet.address);
        const agentSettings = aiAgentService.getAgentSettings(wallet.address, agentType);
        setSettings(agentSettings);
      } else {
        setWalletAddress(null);
        setSettings(null);
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
      if (address === walletAddress && type === agentType) {
        const agentSettings = aiAgentService.getAgentSettings(address, agentType);
        setSettings(agentSettings);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [walletAddress, agentType]);
  
  const handleExecuteAction = async () => {
    if (!walletAddress) {
      toast.info('Please connect your wallet first');
      return;
    }
    
    if (!settings?.isActive) {
      toast.info(`${agentName} is not active`, {
        description: 'Please activate the agent in settings first'
      });
      return;
    }
    
    setIsExecuting(true);
    
    try {
      await aiAgentService.runAgentAction(walletAddress, agentType);
    } catch (error) {
      console.error('Error executing agent action:', error);
      toast.error('Failed to execute agent action');
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleToggleActive = () => {
    if (!walletAddress) {
      toast.info('Please connect your wallet first');
      return;
    }
    
    aiAgentService.toggleAgentActive(walletAddress, agentType);
  };
  
  if (isLoading) {
    return (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="text-white/50 border-white/10"
          disabled
        >
          <div className="w-4 h-4 border-t-2 border-current rounded-full animate-spin mr-2"></div>
          <span>Loading...</span>
        </Button>
      </div>
    );
  }
  
  if (!settings) {
    return (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="text-white/50 border-white/10 cursor-not-allowed opacity-50"
          disabled
        >
          <Play className="h-4 w-4 mr-2" />
          <span>Connect Wallet</span>
        </Button>
        <AgentSettingsComponent agentType={agentType} agentName={agentName} />
      </div>
    );
  }
  
  return (
    <div className="flex space-x-2">
      <Button 
        variant={settings.isActive ? "default" : "outline"}
        className={settings.isActive 
          ? "bg-blue-purple-gradient hover:opacity-90 text-white"
          : "text-white/70 border-white/20 hover:text-white hover:border-white/30 hover:bg-white/5"
        }
        onClick={handleToggleActive}
      >
        {settings.isActive ? "Active" : "Inactive"}
      </Button>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="default"
              className="bg-blue-purple-gradient hover:opacity-90 text-white"
              disabled={isExecuting || !settings.isActive}
              onClick={handleExecuteAction}
            >
              <Play className="h-4 w-4 mr-2" />
              <span>{isExecuting ? 'Running...' : 'Run Agent'}</span>
            </Button>
          </TooltipTrigger>
          {!settings.isActive && (
            <TooltipContent className="bg-arthanet-charcoal text-white border-white/10">
              <p>Please activate the agent first</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      <AgentSettingsComponent agentType={agentType} agentName={agentName} />
    </div>
  );
};

export default AgentControls;
