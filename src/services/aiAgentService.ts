
import { toast } from 'sonner';
import { ethers } from 'ethers';
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

// ABI for the agent contracts - These would be the actual ABIs in a real application
const agentContractABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "riskLevel", "type": "uint256"}],
    "name": "executeStrategy",
    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPositions",
    "outputs": [{"internalType": "string", "name": "positionsJson", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Aave lending pool interface ABI
const aaveLendingPoolABI = [
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserAccountData",
    "outputs": [
      {"internalType": "uint256", "name": "totalCollateralETH", "type": "uint256"},
      {"internalType": "uint256", "name": "totalDebtETH", "type": "uint256"},
      {"internalType": "uint256", "name": "availableBorrowsETH", "type": "uint256"},
      {"internalType": "uint256", "name": "currentLiquidationThreshold", "type": "uint256"},
      {"internalType": "uint256", "name": "ltv", "type": "uint256"},
      {"internalType": "uint256", "name": "healthFactor", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Compound cToken interface ABI
const compoundCTokenABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "exchangeRateStored",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Smart contract addresses for each agent type
const agentContractAddresses: Record<AgentType, string> = {
  'auto-lender': '0x0e4EF7D262d0088827f94EEb68EEAf4DBEBe210D',
  'yield-farmer': '0x59b67172c0E6C4383cb47C06fa1C36BF95f771Dd',
  'risk-analyzer': '0xecDA0d97EBbA4d9261b0D6E40D9a5b5E0B1cA5eC',
  'portfolio-manager': '0x22A39a3dD6e9A97Fb01c212985bD4a6D41F84A16'
};

// Protocol addresses for fetching real data
const protocolAddresses = {
  aaveLendingPool: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Mainnet Aave V2
  compoundCETH: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',    // Mainnet Compound cETH
  compoundCUSDC: '0x39AA39c021dfbaE8faC545936693aC917d5E7563'    // Mainnet Compound cUSDC
};

// Risk levels corresponding to settings
const riskLevelMap: Record<'low' | 'medium' | 'high', number> = {
  'low': 1,
  'medium': 5,
  'high': 10
};

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
  private provider: ethers.Provider | null = null;
  private isRefreshing: boolean = false;

  constructor() {
    this.initProvider();
  }

  private initProvider() {
    // Initialize ethers provider when available
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
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

  // Force refresh all positions
  public async forceRefreshPositions(address: string): Promise<void> {
    if (this.isRefreshing) {
      toast.info("Already scanning blockchain for positions");
      return;
    }

    this.isRefreshing = true;
    toast.info("Scanning blockchain for your DeFi positions...");

    try {
      const positions = await this.fetchDefiPositions(address);
      if (positions.length === 0) {
        toast.info("No DeFi positions found on connected networks", {
          description: "Try connecting to a different network or check your wallet addresses"
        });
      } else {
        toast.success(`Found ${positions.length} DeFi positions`, {
          description: `Positions found on ${[...new Set(positions.map(p => p.platform))].join(', ')}`
        });
      }
    } catch (error) {
      console.error("Error refreshing positions:", error);
      toast.error("Failed to scan blockchain", {
        description: "Please try again or check wallet connection"
      });
    } finally {
      this.isRefreshing = false;
    }
  }

  // Get DeFi positions for a specific wallet address
  public getDefiPositions(address: string): DefiPosition[] {
    return this.positions[address] || [];
  }

  // Fetch real DeFi positions from various protocols
  public async fetchDefiPositions(address: string): Promise<DefiPosition[]> {
    if (!this.provider) {
      this.initProvider();
      if (!this.provider) {
        throw new Error('Ethereum provider not available');
      }
    }

    const results: DefiPosition[] = [];
    
    try {
      // Get network information
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Only proceed with supported networks (Mainnet or testnets)
      if (chainId === 1 || chainId === 5 || chainId === 11155111) { // Mainnet, Goerli, or Sepolia
        // Try to get Aave positions
        const aavePositions = await this.fetchAavePositions(address);
        results.push(...aavePositions);
        
        // Try to get Compound positions
        const compoundPositions = await this.fetchCompoundPositions(address);
        results.push(...compoundPositions);
        
        // Try to get Uniswap positions (for yield-farmer)
        const uniswapPositions = await this.fetchUniswapPositions(address);
        results.push(...uniswapPositions);
      } else {
        console.log(`Chain ID ${chainId} not fully supported for position fetching`);
        // For demo purposes, add some test positions if on a test network
        if (chainId !== 1) {
          results.push({
            platform: 'Test Protocol',
            assetName: 'TEST',
            assetAddress: '0x0000000000000000000000000000000000000000',
            balance: 1.0,
            valueUSD: 100,
            apy: 5.2,
            risk: 3
          });
        }
      }
    } catch (error) {
      console.error('Error fetching DeFi positions:', error);
    }
    
    // Cache the results
    this.positions[address] = results;
    
    return results;
  }

  // Fetch positions from Aave protocol
  private async fetchAavePositions(address: string): Promise<DefiPosition[]> {
    try {
      // On mainnet, use the actual Aave contract
      const aaveContract = new ethers.Contract(
        protocolAddresses.aaveLendingPool,
        aaveLendingPoolABI,
        this.provider
      );
      
      // Call getUserAccountData to get user's collateral and debt
      const accountData = await aaveContract.getUserAccountData(address);
      
      // If user has collateral, create a position
      if (accountData && Number(ethers.formatEther(accountData.totalCollateralETH)) > 0) {
        return [{
          platform: 'Aave',
          assetName: 'Multiple Assets',
          assetAddress: protocolAddresses.aaveLendingPool,
          balance: Number(ethers.formatEther(accountData.totalCollateralETH)),
          valueUSD: Number(ethers.formatEther(accountData.totalCollateralETH)) * 1800, // Approx ETH price
          apy: 4.5, // This would come from Aave API in a real app
          risk: accountData.healthFactor > ethers.parseEther('2') ? 2 : 
                accountData.healthFactor > ethers.parseEther('1.5') ? 5 : 8
        }];
      }
    } catch (error) {
      console.error('Error fetching Aave positions:', error);
    }
    
    return [];
  }

  // Fetch positions from Compound protocol
  private async fetchCompoundPositions(address: string): Promise<DefiPosition[]> {
    const positions: DefiPosition[] = [];
    
    try {
      // Check for cETH balance
      const cEthContract = new ethers.Contract(
        protocolAddresses.compoundCETH,
        compoundCTokenABI,
        this.provider
      );
      
      const cEthBalance = await cEthContract.balanceOf(address);
      const exchangeRate = await cEthContract.exchangeRateStored();
      
      // Calculate actual ETH balance
      const ethBalance = (Number(cEthBalance) * Number(exchangeRate)) / 1e28; // Compound uses 1e28 scale
      
      if (ethBalance > 0) {
        positions.push({
          platform: 'Compound',
          assetName: 'ETH',
          assetAddress: protocolAddresses.compoundCETH,
          balance: ethBalance,
          valueUSD: ethBalance * 1800, // Approx ETH price
          apy: 3.2, // This would come from Compound API in a real app
          risk: 2
        });
      }
      
      // Similarly check for cUSDC
      const cUsdcContract = new ethers.Contract(
        protocolAddresses.compoundCUSDC,
        compoundCTokenABI,
        this.provider
      );
      
      const cUsdcBalance = await cUsdcContract.balanceOf(address);
      const usdcExchangeRate = await cUsdcContract.exchangeRateStored();
      
      // Calculate actual USDC balance, accounting for 6 decimals in USDC
      const usdcBalance = (Number(cUsdcBalance) * Number(usdcExchangeRate)) / 1e16; // Adjusted for USDC decimals
      
      if (usdcBalance > 0) {
        positions.push({
          platform: 'Compound',
          assetName: 'USDC',
          assetAddress: protocolAddresses.compoundCUSDC,
          balance: usdcBalance,
          valueUSD: usdcBalance,
          apy: 5.1, // This would come from Compound API in a real app
          risk: 1
        });
      }
    } catch (error) {
      console.error('Error fetching Compound positions:', error);
    }
    
    return positions;
  }

  // Fetch positions from Uniswap (simplified version)
  private async fetchUniswapPositions(address: string): Promise<DefiPosition[]> {
    // In a real app, you would query Uniswap V3 positions for the user
    // This is a simplified version for demo purposes
    try {
      // Check for ETH balance as indicator of potential LP positions
      const ethBalance = await this.provider?.getBalance(address);
      
      if (ethBalance && Number(ethers.formatEther(ethBalance)) > 0.1) {
        // User has ETH, might have Uniswap positions
        return [{
          platform: 'Uniswap',
          assetName: 'ETH-USDC LP',
          assetAddress: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // Uniswap V3 ETH-USDC pool
          balance: 0.5, // This would be calculated from LP token balance
          valueUSD: 1200,
          apy: 12.4,
          risk: 6
        }];
      }
    } catch (error) {
      console.error('Error fetching Uniswap positions:', error);
    }
    
    return [];
  }

  // Get analytics for a specific wallet address and agent type
  public getAgentAnalytics(address: string, agentType: AgentType): AgentAnalytics | null {
    if (!this.analytics[address]) {
      // Generate analytics based on positions
      this.generateAnalytics(address);
    }
    
    return this.analytics[address]?.[agentType] || null;
  }

  // Generate analytics from positions data
  private generateAnalytics(address: string): void {
    const positions = this.positions[address] || [];
    if (positions.length === 0) return;
    
    const totalValue = positions.reduce((sum, pos) => sum + pos.valueUSD, 0);
    const avgRisk = positions.reduce((sum, pos) => sum + pos.risk * (pos.valueUSD / totalValue), 0);
    const avgApy = positions.reduce((sum, pos) => sum + pos.apy * (pos.valueUSD / totalValue), 0);
    
    const baseAnalytics: AgentAnalytics = {
      totalValueLocked: totalValue,
      dailyYield: (totalValue * avgApy / 100) / 365,
      weeklyYield: (totalValue * avgApy / 100) / 52,
      monthlyYield: (totalValue * avgApy / 100) / 12,
      riskScore: Math.round(avgRisk),
      gasSpent: 0.05, // This would track actual gas spent in a real app
      lastRebalance: Date.now() - 86400000 // 1 day ago
    };
    
    this.analytics[address] = {
      'auto-lender': {
        ...baseAnalytics,
        // Auto-lender focuses on lending protocols
        totalValueLocked: positions.filter(p => p.platform === 'Aave' || p.platform === 'Compound')
          .reduce((sum, pos) => sum + pos.valueUSD, 0)
      },
      'yield-farmer': {
        ...baseAnalytics,
        // Yield farmer focuses on LP positions
        totalValueLocked: positions.filter(p => p.platform === 'Uniswap' || p.platform === 'Curve')
          .reduce((sum, pos) => sum + pos.valueUSD, 0)
      },
      'risk-analyzer': {
        ...baseAnalytics,
        // Risk analyzer tracks all positions
        riskScore: Math.min(Math.round(avgRisk * 1.2), 10) // Slightly higher risk awareness
      },
      'portfolio-manager': {
        ...baseAnalytics
        // Portfolio manager tracks all positions
      }
    };
  }

  // Run AI agent logic with actual blockchain interactions
  public async runAgentAction(address: string, agentType: AgentType): Promise<void> {
    const settings = this.getAgentSettings(address, agentType);
    
    if (!settings.isActive) {
      toast.error(`${this.getAgentName(agentType)} is not active. Please activate it first.`);
      return;
    }
    
    // Check if wallet is connected
    const walletInfo = walletService.getCurrentWallet();
    if (!walletInfo) {
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
    
    toast.info(`${actionName}...`, {
      description: actionDetails
    });
    
    try {
      // Initialize ethers signer and provider
      if (!window.ethereum) {
        throw new Error('Ethereum provider not available');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get contract for the specific agent
      const contractAddress = agentContractAddresses[agentType];
      const contract = new ethers.Contract(contractAddress, agentContractABI, signer);
      
      // Set gas price based on settings (convert from Gwei to Wei)
      const gasPriceInGwei = settings.maxGasFee;
      const gasPriceInWei = ethers.parseUnits(gasPriceInGwei.toString(), 'gwei');
      
      // Convert risk tolerance to numeric value
      const riskLevel = riskLevelMap[settings.riskTolerance];
      
      // Execute the smart contract transaction
      const tx = await contract.executeStrategy(riskLevel, {
        gasLimit: 1000000, // Adjust as needed
        maxFeePerGas: gasPriceInWei
      });
      
      toast.info("Transaction sent to blockchain", {
        description: `Transaction hash: ${tx.hash.substring(0, 10)}...`
      });
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Get transaction hash from receipt
      const txHash = receipt.hash;
      
      // Update the action to completed with the real transaction hash
      this.actions[address] = this.actions[address].map(action => {
        if (action.action === actionName && action.status === 'pending') {
          return { ...action, status: 'completed', txHash };
        }
        return action;
      });
      
      // Refresh positions after transaction
      await this.fetchDefiPositions(address);
      
      // Update analytics with new data
      this.generateAnalytics(address);
      
      // Notify listeners
      this.notifyListeners(address, agentType);
      
      toast.success(`${this.getAgentName(agentType)} completed action successfully`, {
        description: `Transaction confirmed with hash: ${txHash.substring(0, 10)}...`,
        action: {
          label: 'View TX',
          onClick: () => {
            const explorerUrl = this.getExplorerUrl(receipt.chainId.toString(), txHash);
            window.open(explorerUrl, '_blank');
          }
        }
      });
      
    } catch (error: any) {
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
      
      // If this is a user rejection, show appropriate message
      if (error.code === 4001) { // User denied transaction
        toast.error(`${this.getAgentName(agentType)} action cancelled`, {
          description: `You rejected the transaction request`
        });
      } else {
        toast.error(`${this.getAgentName(agentType)} action failed`, {
          description: `Error: ${error.message || 'Unknown error'}`
        });
      }
    }
  }

  // Get appropriate block explorer URL based on chain ID
  private getExplorerUrl(chainId: string, txHash: string): string {
    switch (chainId) {
      case '1': return `https://etherscan.io/tx/${txHash}`;
      case '5': return `https://goerli.etherscan.io/tx/${txHash}`;
      case '11155111': return `https://sepolia.etherscan.io/tx/${txHash}`;
      case '42161': return `https://arbiscan.io/tx/${txHash}`;
      case '137': return `https://polygonscan.com/tx/${txHash}`;
      case '56': return `https://bscscan.com/tx/${txHash}`;
      case '43114': return `https://snowtrace.io/tx/${txHash}`;
      default: return `https://etherscan.io/tx/${txHash}`;
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
