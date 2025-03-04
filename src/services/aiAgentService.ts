
import { toast } from 'sonner';
import walletService, { WalletInfo } from './walletService';

export type AgentType = 'auto-lender' | 'yield-farmer' | 'risk-analyzer' | 'portfolio-manager';

export interface AgentSettings {
  isActive: boolean;
  riskTolerance: 'low' | 'medium' | 'high';
  maxGasFee: number; // in Gwei
  autoRebalance: boolean;
  platforms: string[];
}

export interface AgentAction {
  id: string;
  agentType: AgentType;
  timestamp: number;
  action: string;
  details: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

export interface DefiPosition {
  platform: string;
  assetName: string;
  assetAddress: string;
  balance: number;
  valueUSD: number;
  apy: number;
  risk: number; // 1-10 scale
}

export interface AgentAnalytics {
  totalValueLocked: number;
  dailyYield: number;
  weeklyYield: number;
  monthlyYield: number;
  riskScore: number; // 1-10 scale
  gasSpent: number;
  lastRebalance: number; // timestamp
}

// Default settings for each agent
const defaultSettings: Record<AgentType, AgentSettings> = {
  'auto-lender': {
    isActive: false,
    riskTolerance: 'medium',
    maxGasFee: 50,
    autoRebalance: true,
    platforms: ['Aave', 'Compound']
  },
  'yield-farmer': {
    isActive: false,
    riskTolerance: 'medium',
    maxGasFee: 50,
    autoRebalance: true,
    platforms: ['Uniswap', 'Curve']
  },
  'risk-analyzer': {
    isActive: false,
    riskTolerance: 'low',
    maxGasFee: 30,
    autoRebalance: false,
    platforms: ['All']
  },
  'portfolio-manager': {
    isActive: false,
    riskTolerance: 'medium',
    maxGasFee: 40,
    autoRebalance: true,
    platforms: ['All']
  }
};

class AIAgentService {
  private settings: Record<string, Record<AgentType, AgentSettings>> = {};
  private actions: Record<string, AgentAction[]> = {};
  private positions: Record<string, DefiPosition[]> = {};
  private analytics: Record<string, Record<AgentType, AgentAnalytics>> = {};
  private listeners: ((address: string, agentType: AgentType) => void)[] = [];

  constructor() {
    this.loadMockData();
  }

  // In a real app, this would fetch real data from the blockchain
  private loadMockData() {
    const mockPositions: DefiPosition[] = [
      {
        platform: 'Aave',
        assetName: 'ETH',
        assetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        balance: 1.25,
        valueUSD: 3000,
        apy: 3.5,
        risk: 2
      },
      {
        platform: 'Compound',
        assetName: 'USDC',
        assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        balance: 2500,
        valueUSD: 2500,
        apy: 5.2,
        risk: 1
      },
      {
        platform: 'Uniswap',
        assetName: 'ETH-USDC LP',
        assetAddress: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
        balance: 0.5,
        valueUSD: 1200,
        apy: 12.4,
        risk: 6
      }
    ];

    const defaultAnalytics: AgentAnalytics = {
      totalValueLocked: 0,
      dailyYield: 0,
      weeklyYield: 0,
      monthlyYield: 0,
      riskScore: 0,
      gasSpent: 0,
      lastRebalance: Date.now() - 86400000 // 1 day ago
    };

    // Mock empty data for currently connected wallet
    const walletInfo = walletService.getCurrentWallet();
    if (walletInfo) {
      this.positions[walletInfo.address] = mockPositions;
      
      const analyticsMap: Record<AgentType, AgentAnalytics> = {
        'auto-lender': {
          ...defaultAnalytics,
          totalValueLocked: 5500,
          dailyYield: 0.72,
          weeklyYield: 5.04,
          monthlyYield: 21.6,
          riskScore: 2
        },
        'yield-farmer': {
          ...defaultAnalytics,
          totalValueLocked: 1200,
          dailyYield: 0.41,
          weeklyYield: 2.87,
          monthlyYield: 12.3,
          riskScore: 6
        },
        'risk-analyzer': {
          ...defaultAnalytics,
          totalValueLocked: 6700,
          riskScore: 4
        },
        'portfolio-manager': {
          ...defaultAnalytics,
          totalValueLocked: 6700,
          dailyYield: 1.13,
          weeklyYield: 7.91,
          monthlyYield: 33.9,
          riskScore: 4
        }
      };
      
      this.analytics[walletInfo.address] = analyticsMap;
    }
  }

  // Get agent settings for a specific wallet address
  public getAgentSettings(address: string, agentType: AgentType): AgentSettings {
    if (!this.settings[address]) {
      this.settings[address] = JSON.parse(JSON.stringify(defaultSettings));
    }
    return this.settings[address][agentType];
  }

  // Update agent settings
  public updateAgentSettings(address: string, agentType: AgentType, newSettings: Partial<AgentSettings>): void {
    if (!this.settings[address]) {
      this.settings[address] = JSON.parse(JSON.stringify(defaultSettings));
    }
    
    this.settings[address][agentType] = {
      ...this.settings[address][agentType],
      ...newSettings
    };
    
    // Notify UI about the change
    this.notifyListeners(address, agentType);
    
    if (newSettings.isActive !== undefined) {
      const statusMessage = newSettings.isActive 
        ? `${this.getAgentName(agentType)} has been activated` 
        : `${this.getAgentName(agentType)} has been deactivated`;
      
      toast[newSettings.isActive ? 'success' : 'info'](statusMessage);
      
      if (newSettings.isActive) {
        // Record agent activation as an action
        this.recordAgentAction(address, agentType, 'Agent activated', 'Agent has been activated with current settings', 'completed');
      }
    }
  }

  // Toggle agent active status
  public toggleAgentActive(address: string, agentType: AgentType): void {
    const currentSettings = this.getAgentSettings(address, agentType);
    this.updateAgentSettings(address, agentType, {
      isActive: !currentSettings.isActive
    });
  }

  // Get agent name from type
  private getAgentName(agentType: AgentType): string {
    switch(agentType) {
      case 'auto-lender': return 'AI Auto-Lender';
      case 'yield-farmer': return 'Smart Yield Farmer';
      case 'risk-analyzer': return 'Risk Analyzer';
      case 'portfolio-manager': return 'Portfolio Manager';
      default: return 'AI Agent';
    }
  }

  // Record an action performed by an agent
  public recordAgentAction(
    address: string, 
    agentType: AgentType, 
    action: string, 
    details: string, 
    status: 'pending' | 'completed' | 'failed',
    txHash?: string
  ): void {
    if (!this.actions[address]) {
      this.actions[address] = [];
    }
    
    const newAction: AgentAction = {
      id: Math.random().toString(36).substring(2, 15),
      agentType,
      timestamp: Date.now(),
      action,
      details,
      status,
      txHash
    };
    
    this.actions[address] = [newAction, ...this.actions[address]];
    
    // Notify UI about the change
    this.notifyListeners(address, agentType);
  }

  // Get actions for a specific wallet address and agent type
  public getAgentActions(address: string, agentType?: AgentType): AgentAction[] {
    if (!this.actions[address]) {
      return [];
    }
    
    if (agentType) {
      return this.actions[address].filter(action => action.agentType === agentType);
    }
    
    return this.actions[address];
  }

  // Get DeFi positions for a specific wallet address
  public getDefiPositions(address: string): DefiPosition[] {
    return this.positions[address] || [];
  }

  // Get analytics for a specific wallet address and agent type
  public getAgentAnalytics(address: string, agentType: AgentType): AgentAnalytics | null {
    if (!this.analytics[address]) {
      return null;
    }
    
    return this.analytics[address][agentType] || null;
  }

  // Run AI agent logic - in a real app, this would interact with smart contracts
  public async runAgentAction(address: string, agentType: AgentType): Promise<void> {
    const settings = this.getAgentSettings(address, agentType);
    
    if (!settings.isActive) {
      toast.error(`${this.getAgentName(agentType)} is not active. Please activate it first.`);
      return;
    }
    
    // Check if wallet is connected
    if (!walletService.getCurrentWallet()) {
      toast.error('Please connect your wallet to use AI agents');
      return;
    }
    
    // Record pending action
    const actionId = Math.random().toString(36).substring(2, 15);
    let actionName = '';
    let actionDetails = '';
    
    switch(agentType) {
      case 'auto-lender':
        actionName = 'Optimizing lending positions';
        actionDetails = `Analyzing ${settings.platforms.join(', ')} for best lending rates with ${settings.riskTolerance} risk tolerance`;
        break;
      case 'yield-farmer':
        actionName = 'Rebalancing yield farming positions';
        actionDetails = `Seeking optimal yields across ${settings.platforms.join(', ')} with ${settings.riskTolerance} risk strategy`;
        break;
      case 'risk-analyzer':
        actionName = 'Analyzing portfolio risk';
        actionDetails = 'Scanning positions for liquidation risks and market exposure';
        break;
      case 'portfolio-manager':
        actionName = 'Optimizing portfolio allocation';
        actionDetails = 'Rebalancing assets for optimal risk-adjusted returns';
        break;
    }
    
    this.recordAgentAction(address, agentType, actionName, actionDetails, 'pending');
    
    // Simulate blockchain operation with timeout
    toast.info(`${actionName}...`, {
      description: actionDetails
    });
    
    try {
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 10% chance of failure to simulate real-world scenarios
      if (Math.random() < 0.1) {
        throw new Error('Simulation of transaction failure');
      }
      
      // Mock transaction hash
      const txHash = '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      // Update the action to completed
      this.actions[address] = this.actions[address].map(action => {
        if (action.action === actionName && action.status === 'pending') {
          return { ...action, status: 'completed', txHash };
        }
        return action;
      });
      
      // Update analytics with new data
      if (this.analytics[address] && this.analytics[address][agentType]) {
        const currentAnalytics = this.analytics[address][agentType];
        
        // Simulate improvements in analytics
        this.analytics[address][agentType] = {
          ...currentAnalytics,
          dailyYield: currentAnalytics.dailyYield * (1 + (Math.random() * 0.1)),
          weeklyYield: currentAnalytics.weeklyYield * (1 + (Math.random() * 0.1)),
          monthlyYield: currentAnalytics.monthlyYield * (1 + (Math.random() * 0.1)),
          lastRebalance: Date.now(),
          gasSpent: currentAnalytics.gasSpent + (Math.random() * 0.05)
        };
      }
      
      // Notify listeners
      this.notifyListeners(address, agentType);
      
      toast.success(`${this.getAgentName(agentType)} completed action successfully`, {
        description: `Transaction hash: ${txHash.substring(0, 10)}...`,
        action: {
          label: 'View TX',
          onClick: () => {
            window.open(`https://etherscan.io/tx/${txHash}`, '_blank');
          }
        }
      });
      
    } catch (error) {
      console.error('Agent action failed:', error);
      
      // Update the action to failed
      this.actions[address] = this.actions[address].map(action => {
        if (action.action === actionName && action.status === 'pending') {
          return { ...action, status: 'failed' };
        }
        return action;
      });
      
      // Notify listeners
      this.notifyListeners(address, agentType);
      
      toast.error(`${this.getAgentName(agentType)} action failed`, {
        description: `Please try again later or with different settings`
      });
    }
  }

  // Subscribe to changes
  public subscribe(listener: (address: string, agentType: AgentType) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners about changes
  private notifyListeners(address: string, agentType: AgentType): void {
    this.listeners.forEach(listener => listener(address, agentType));
  }
}

// Singleton instance
export const aiAgentService = new AIAgentService();
export default aiAgentService;
