
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import aiAgentService, { AgentType, AgentSettings } from '@/services/aiAgentService';
import walletService from '@/services/walletService';

interface AgentSettingsProps {
  agentType: AgentType;
  agentName: string;
}

const AgentSettingsComponent: React.FC<AgentSettingsProps> = ({ agentType, agentName }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Get agent settings when wallet address or agent type changes
  useEffect(() => {
    const walletInfo = walletService.getCurrentWallet();
    if (walletInfo) {
      setWalletAddress(walletInfo.address);
      const agentSettings = aiAgentService.getAgentSettings(walletInfo.address, agentType);
      setSettings(agentSettings);
    }
    
    const unsubscribe = walletService.subscribe((wallet) => {
      if (wallet) {
        setWalletAddress(wallet.address);
        const agentSettings = aiAgentService.getAgentSettings(wallet.address, agentType);
        setSettings(agentSettings);
      } else {
        setWalletAddress(null);
        setSettings(null);
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
        const agentSettings = aiAgentService.getAgentSettings(address, agentType);
        setSettings(agentSettings);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [walletAddress, agentType]);
  
  const handleToggleActive = () => {
    if (!walletAddress || !settings) return;
    
    aiAgentService.toggleAgentActive(walletAddress, agentType);
  };
  
  const handleUpdateSettings = () => {
    if (!walletAddress || !settings) return;
    
    // Settings are already updated in state, just save them
    aiAgentService.updateAgentSettings(walletAddress, agentType, settings);
    setIsOpen(false);
    
    toast.success('Settings updated', {
      description: `${agentName} settings have been updated`
    });
  };
  
  const handleSettingChange = (key: keyof AgentSettings, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [key]: value
    });
  };
  
  if (!walletAddress || !settings) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        disabled 
        className="text-white/50"
        onClick={() => toast.info('Please connect your wallet to manage agent settings')}
      >
        <Settings size={18} />
      </Button>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <Settings size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-arthanet-darkBlue border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">{agentName} Settings</DialogTitle>
          <DialogDescription className="text-white/70">
            Configure how the {agentName.toLowerCase()} operates with your assets.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {settings.isActive ? (
                <ToggleRight className="text-arthanet-blue h-5 w-5" />
              ) : (
                <ToggleLeft className="text-white/50 h-5 w-5" />
              )}
              <span className="font-medium">Agent Status</span>
            </div>
            <Switch 
              checked={settings.isActive}
              onCheckedChange={() => handleToggleActive()}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="text-white/70 h-5 w-5" />
                <span className="font-medium">Risk Tolerance</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <AlertTriangle 
                        className={`h-4 w-4 ${
                          settings.riskTolerance === 'high' 
                            ? 'text-red-500' 
                            : settings.riskTolerance === 'medium' 
                              ? 'text-yellow-500' 
                              : 'text-green-500'
                        }`} 
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-arthanet-charcoal text-white border-white/10">
                    <p>Higher risk tolerance may result in higher returns but with increased volatility</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select 
              value={settings.riskTolerance}
              onValueChange={(value) => handleSettingChange('riskTolerance', value as 'low' | 'medium' | 'high')}
            >
              <SelectTrigger className="bg-arthanet-charcoal border-white/10 text-white">
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent className="bg-arthanet-charcoal border-white/10">
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="text-white/70 h-5 w-5" />
                <span className="font-medium">Max Gas Fee (Gwei)</span>
              </div>
              <span className="text-white/70 text-sm">{settings.maxGasFee} Gwei</span>
            </div>
            <Slider 
              value={[settings.maxGasFee]} 
              min={10}
              max={100}
              step={1}
              onValueChange={(value) => handleSettingChange('maxGasFee', value[0])}
              className="py-2"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="text-white/70 h-5 w-5" />
              <span className="font-medium">Auto-Rebalance</span>
            </div>
            <Switch 
              checked={settings.autoRebalance}
              onCheckedChange={(checked) => handleSettingChange('autoRebalance', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-white/70 h-5 w-5" />
              <span className="font-medium">Platforms</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.platforms.map((platform) => (
                <div 
                  key={platform}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{platform}</span>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-white/10 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateSettings}
            className="bg-blue-purple-gradient hover:opacity-90 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentSettingsComponent;
