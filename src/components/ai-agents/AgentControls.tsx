
import React, { useState, useEffect } from 'react';
import { Play, Info, Settings, AlertTriangle, Loader2 } from 'lucide-react';
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
  const [isToggling, setIsToggling] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // Check if the current network is supported for the agent
  useEffect(() => {
    const checkNetworkCompatibility = async () => {
      try {
        if (!window.ethereum) {
          return;
        }
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        // Convert to decimal for easier comparison
        const decimalChainId = parseInt(chainId, 16);
        
        // List of supported networks (varies by agent)
        const supportedNetworks = [1, 5, 11155111]; // Mainnet, Goerli, Sepolia
        
        if (!supportedNetworks.includes(decimalChainId)) {
          setNetworkError(`This agent may not work on the current network (Chain ID: ${decimalChainId}). Please switch to Ethereum Mainnet, Goerli, or Sepolia testnet.`);
        } else {
          setNetworkError(null);
        }
      } catch (error) {
        console.error("Error checking network compatibility:", error);
      }
    };
    
    checkNetworkCompatibility();
    
    // Listen for chain changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetworkCompatibility);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetworkCompatibility);
      }
    };
  }, [agentType, walletAddress]); 
  
  // Get agent settings when wallet address or agent type changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const walletInfo = walletService.getCurrentWallet();
      
      if (walletInfo) {
        setWalletAddress(walletInfo.address);
        
        try {
          // Get agent settings with a timeout to prevent hanging
          const agentSettings = await Promise.race([
            aiAgentService.getAgentSettings(walletInfo.address, agentType),
            new Promise<null>((_, reject) => {
              setTimeout(() => reject(new Error('Settings fetch timeout')), 5000);
            })
          ]) as AgentSettings;
          
          setSettings(agentSettings);
          console.log(`${agentName} settings loaded:`, agentSettings);
        } catch (error) {
          console.error(`Error fetching ${agentName} settings:`, error);
          // Initialize default settings if fetch fails
          const defaultSettings = {
            isActive: false,
            riskTolerance: 'medium' as const,
            platforms: [],
            autoRebalance: true,
            maxGasFee: 50,
          };
          setSettings(defaultSettings);
        }
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
        fetchData();
      } else {
        setWalletAddress(null);
        setSettings(null);
        setIsLoading(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [agentType, agentName]);
  
  // Subscribe to agent service updates
  useEffect(() => {
    if (!walletAddress) return;
    
    const unsubscribe = aiAgentService.subscribe((address, type) => {
      if (address === walletAddress && (!type || type === agentType)) {
        try {
          const updatedSettings = aiAgentService.getAgentSettings(address, agentType);
          console.log(`Agent settings updated for ${agentName}:`, updatedSettings);
          setSettings(updatedSettings);
          
          // If we were toggling and now the updated settings are received, turn off the toggling state
          if (isToggling) {
            setIsToggling(false);
          }
        } catch (error) {
          console.error(`Error receiving ${agentName} settings update:`, error);
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [walletAddress, agentType, agentName, isToggling]);
  
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
    
    // Check for network support
    const isNetworkSupported = await walletService.isNetworkSupported();
    if (!isNetworkSupported) {
      toast.error('Unsupported network', {
        description: 'Please switch to Ethereum Mainnet, Goerli, or Sepolia testnet'
      });
      return;
    }
    
    setIsExecuting(true);
    
    try {
      console.log(`Executing ${agentType} action for wallet ${walletAddress}`);
      await aiAgentService.runAgentAction(walletAddress, agentType);
    } catch (error) {
      console.error('Error executing agent action:', error);
      toast.error('Failed to execute agent action', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleToggleActive = async () => {
    if (!walletAddress) {
      toast.info('Please connect your wallet first');
      return;
    }
    
    setIsToggling(true);
    
    try {
      console.log(`Toggling agent ${agentType} active state to ${!settings?.isActive}`);
      await aiAgentService.toggleAgentActive(walletAddress, agentType);
      
      // Force refresh settings immediately
      const updatedSettings = aiAgentService.getAgentSettings(walletAddress, agentType);
      setSettings(updatedSettings);
      console.log(`Agent settings updated after toggle:`, updatedSettings);
      
      // If toggle wasn't successful (isActive didn't change), show error
      if (settings?.isActive === updatedSettings.isActive) {
        toast.error(`Failed to ${settings?.isActive ? 'deactivate' : 'activate'} ${agentName}`, {
          description: 'The agent status could not be updated. Please try again.'
        });
      }
    } catch (error) {
      console.error(`Error toggling ${agentName} status:`, error);
      toast.error(`Failed to update ${agentName} status`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsToggling(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="text-white/50 border-white/10"
          disabled
        >
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
    <div className="space-y-2">
      {networkError && (
        <div className="flex items-center space-x-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-md mb-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{networkError}</p>
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button 
          variant={settings.isActive ? "default" : "outline"}
          className={settings.isActive 
            ? "bg-blue-purple-gradient hover:opacity-90 text-white"
            : "text-white/70 border-white/20 hover:text-white hover:border-white/30 hover:bg-white/5"
          }
          onClick={handleToggleActive}
          disabled={isToggling}
        >
          {isToggling ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            settings.isActive ? "Active" : "Inactive"
          )}
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
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    <span>Run Agent</span>
                  </>
                )}
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
    </div>
  );
};

export default AgentControls;
