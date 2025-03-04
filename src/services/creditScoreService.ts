
import { toast } from 'sonner';
import { ethers } from 'ethers';
import walletService, { WalletInfo } from './walletService';

export interface CreditScoreData {
  score: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  factors: {
    category: string;
    score: number;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  recommendations: string[];
  lastUpdated: Date;
}

// ERC20 ABI snippet for querying balances
const erc20ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
];

// Major token addresses to check
const tokenAddresses = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
};

// Aave lending pool interface for checking positions
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

// Compound interface for checking positions
const compoundComptrollerABI = [
  {
    "constant": true,
    "inputs": [{"name": "account", "type": "address"}],
    "name": "getAccountLiquidity",
    "outputs": [
      {"name": "error", "type": "uint256"},
      {"name": "liquidity", "type": "uint256"},
      {"name": "shortfall", "type": "uint256"}
    ],
    "type": "function"
  }
];

// Protocol addresses
const protocolAddresses = {
  aaveLendingPool: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Mainnet Aave V2
  compoundComptroller: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B' // Mainnet Compound
};

class CreditScoreService {
  private creditScoreCache: Map<string, CreditScoreData> = new Map();
  private isGenerating: boolean = false;
  private provider: ethers.Provider | null = null;

  constructor() {
    this.initProvider();
  }

  private initProvider() {
    // Initialize ethers provider when available
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  // Generate a credit score for the connected wallet based on on-chain data
  public async generateCreditScore(walletInfo: WalletInfo): Promise<CreditScoreData | null> {
    if (this.isGenerating) {
      toast.info('Credit score generation already in progress');
      return null;
    }

    // Check if we already have a cached score for this wallet
    if (this.creditScoreCache.has(walletInfo.address)) {
      return this.creditScoreCache.get(walletInfo.address)!;
    }

    this.isGenerating = true;
    toast.info('Analyzing on-chain data for credit score generation');

    try {
      if (!this.provider) {
        this.initProvider();
        if (!this.provider) {
          throw new Error('Ethereum provider not available');
        }
      }

      // 1. Get wallet age (blocks since first transaction)
      const walletAge = await this.getWalletAge(walletInfo.address);
      
      // 2. Check token balances
      const tokenBalances = await this.getTokenBalances(walletInfo.address);
      
      // 3. Check DeFi positions (Aave, Compound)
      const defiPositions = await this.getDefiPositions(walletInfo.address);
      
      // 4. Get transaction count
      const txCount = await this.provider.getTransactionCount(walletInfo.address);
      
      // 5. Generate score based on collected data
      const creditScoreData = this.calculateScore(
        walletInfo.address,
        walletAge,
        tokenBalances,
        defiPositions,
        txCount
      );
      
      // Cache the result
      this.creditScoreCache.set(walletInfo.address, creditScoreData);
      
      toast.success('Credit score successfully generated!');
      return creditScoreData;
    } catch (error) {
      console.error('Error generating credit score:', error);
      toast.error('Failed to generate credit score. Please try again later.');
      return null;
    } finally {
      this.isGenerating = false;
    }
  }

  // Get wallet age in blocks
  private async getWalletAge(address: string): Promise<number> {
    try {
      // For a real implementation, you'd query an indexer like The Graph
      // to get the block number of the first transaction
      // For this demo, we'll use the account's current transaction count
      const txCount = await this.provider?.getTransactionCount(address);
      return txCount || 0;
    } catch (error) {
      console.error('Error getting wallet age:', error);
      return 0;
    }
  }

  // Get token balances
  private async getTokenBalances(address: string): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};
    
    try {
      // Check ETH balance
      const ethBalance = await this.provider?.getBalance(address);
      balances.ETH = ethBalance ? Number(ethers.formatEther(ethBalance)) : 0;
      
      // Check ERC20 token balances
      for (const [symbol, tokenAddress] of Object.entries(tokenAddresses)) {
        const contract = new ethers.Contract(tokenAddress, erc20ABI, this.provider);
        const balance = await contract.balanceOf(address);
        
        // Format based on token decimals (simplified)
        const decimals = symbol === 'USDT' ? 6 : 18;
        balances[symbol] = Number(ethers.formatUnits(balance, decimals));
      }
    } catch (error) {
      console.error('Error getting token balances:', error);
    }
    
    return balances;
  }

  // Get DeFi positions
  private async getDefiPositions(address: string): Promise<any> {
    const positions: any = {
      aave: null,
      compound: null
    };
    
    try {
      // Check Aave positions
      const aaveContract = new ethers.Contract(
        protocolAddresses.aaveLendingPool, 
        aaveLendingPoolABI,
        this.provider
      );
      
      const aaveData = await aaveContract.getUserAccountData(address);
      positions.aave = {
        collateral: Number(ethers.formatEther(aaveData.totalCollateralETH)),
        debt: Number(ethers.formatEther(aaveData.totalDebtETH)),
        healthFactor: Number(ethers.formatEther(aaveData.healthFactor))
      };
      
      // Check Compound positions
      const compoundContract = new ethers.Contract(
        protocolAddresses.compoundComptroller,
        compoundComptrollerABI,
        this.provider
      );
      
      const compoundData = await compoundContract.getAccountLiquidity(address);
      positions.compound = {
        error: Number(compoundData.error),
        liquidity: Number(ethers.formatEther(compoundData.liquidity)),
        shortfall: Number(ethers.formatEther(compoundData.shortfall))
      };
    } catch (error) {
      console.error('Error getting DeFi positions:', error);
    }
    
    return positions;
  }

  // Calculate credit score based on on-chain data
  private calculateScore(
    address: string,
    walletAge: number,
    tokenBalances: Record<string, number>,
    defiPositions: any,
    txCount: number
  ): CreditScoreData {
    // 1. Calculate wallet age & activity score (0-100)
    const ageActivityScore = Math.min(
      100,
      (walletAge * 5) + (txCount / 10)
    );
    
    // 2. Calculate token balances score (0-100)
    const totalBalance = 
      (tokenBalances.ETH * 1800) + // Approximate ETH value in USD
      (tokenBalances.USDC || 0) +
      (tokenBalances.USDT || 0) +
      (tokenBalances.DAI || 0) +
      (tokenBalances.WETH * 1800 || 0);
    
    const balanceScore = Math.min(100, totalBalance / 100);
    
    // 3. Calculate DeFi engagement score (0-100)
    let defiScore = 0;
    let hasLoanRepayment = false;
    
    if (defiPositions.aave && defiPositions.aave.collateral > 0) {
      defiScore += 40;
      
      // Check for loan repayment history
      if (defiPositions.aave.debt > 0) {
        hasLoanRepayment = true;
        
        // Higher score for healthy positions
        if (defiPositions.aave.healthFactor > 2) {
          defiScore += 20;
        }
      }
    }
    
    if (defiPositions.compound && defiPositions.compound.liquidity > 0) {
      defiScore += 40;
      
      // Check for loan repayment
      if (defiPositions.compound.shortfall === 0 && defiPositions.compound.error === 0) {
        hasLoanRepayment = true;
        defiScore += 20;
      }
    }
    
    // 4. Calculate risk profile score
    const riskScore = this.calculateRiskScore(tokenBalances, defiPositions);
    
    // 5. Aggregate scores with different weights
    const aggregateScore = 
      (ageActivityScore * 0.25) +
      (balanceScore * 0.25) +
      (defiScore * 0.3) +
      (riskScore * 0.2);
    
    // 6. Scale to final score (500-800 range)
    const finalScore = 500 + Math.min(300, Math.round(aggregateScore * 3));
    
    // 7. Generate factors
    const factors = [
      {
        category: 'Wallet Age & Activity',
        score: Math.round(ageActivityScore),
        description: txCount > 100 
          ? 'Your wallet has a strong history of consistent activity on-chain.'
          : txCount > 10
            ? 'Your wallet has been active for a moderate period with some transactions.'
            : 'Your wallet is relatively new or has limited activity.',
        impact: ageActivityScore > 70 ? 'positive' : ageActivityScore > 30 ? 'neutral' : 'negative'
      },
      {
        category: 'Token Balances',
        score: Math.round(balanceScore),
        description: totalBalance > 10000
          ? 'Your wallet holds significant assets across multiple tokens.'
          : totalBalance > 1000
            ? 'Your wallet maintains moderate token balances.'
            : 'Your wallet has limited token balances.',
        impact: balanceScore > 70 ? 'positive' : balanceScore > 30 ? 'neutral' : 'negative'
      },
      {
        category: 'DeFi Engagement',
        score: Math.round(defiScore),
        description: defiScore > 70
          ? 'You have extensive engagement with multiple DeFi protocols.'
          : defiScore > 30
            ? 'You have moderate engagement with DeFi protocols.'
            : 'You have limited or no engagement with DeFi protocols.',
        impact: defiScore > 70 ? 'positive' : defiScore > 30 ? 'neutral' : 'negative'
      },
      {
        category: 'Loan Repayment History',
        score: hasLoanRepayment ? 80 : 0,
        description: hasLoanRepayment
          ? 'You have a history of responsible borrowing and repayment.'
          : 'Limited loan repayment history available for analysis.',
        impact: hasLoanRepayment ? 'positive' : 'neutral'
      },
      {
        category: 'Risk Profile',
        score: Math.round(riskScore),
        description: riskScore > 70
          ? 'Your activity shows a balanced approach to risk in DeFi markets.'
          : riskScore > 30
            ? 'Your risk profile shows some exposure to market volatility.'
            : 'Your on-chain activity indicates high exposure to risk.',
        impact: riskScore > 70 ? 'positive' : riskScore > 30 ? 'neutral' : 'negative'
      }
    ];
    
    // 8. Generate recommendations
    const recommendations = this.generateRecommendations(
      ageActivityScore,
      balanceScore,
      defiScore,
      hasLoanRepayment,
      riskScore
    );
    
    return {
      score: finalScore,
      riskLevel: finalScore < 600 ? 'High' : finalScore < 700 ? 'Medium' : 'Low',
      factors,
      recommendations,
      lastUpdated: new Date()
    };
  }

  // Calculate risk score based on portfolio
  private calculateRiskScore(
    tokenBalances: Record<string, number>,
    defiPositions: any
  ): number {
    let riskScore = 50; // Start at neutral
    
    // Higher stablecoin ratio = lower risk
    const totalValue = 
      (tokenBalances.ETH * 1800) +
      (tokenBalances.USDC || 0) +
      (tokenBalances.USDT || 0) +
      (tokenBalances.DAI || 0) +
      (tokenBalances.WETH * 1800 || 0);
    
    const stablecoinValue = 
      (tokenBalances.USDC || 0) +
      (tokenBalances.USDT || 0) +
      (tokenBalances.DAI || 0);
    
    if (totalValue > 0) {
      const stablecoinRatio = stablecoinValue / totalValue;
      
      // Reward diversification (higher score for balanced portfolios)
      if (stablecoinRatio > 0.3 && stablecoinRatio < 0.7) {
        riskScore += 20;
      }
    }
    
    // Check DeFi positions risk
    if (defiPositions.aave && defiPositions.aave.collateral > 0) {
      if (defiPositions.aave.healthFactor > 2) {
        // Safe position
        riskScore += 15;
      } else if (defiPositions.aave.healthFactor < 1.5) {
        // Risky position
        riskScore -= 15;
      }
    }
    
    if (defiPositions.compound) {
      if (defiPositions.compound.shortfall > 0) {
        // Account is underwater
        riskScore -= 20;
      } else if (defiPositions.compound.liquidity > 0) {
        // Healthy position
        riskScore += 15;
      }
    }
    
    return Math.max(0, Math.min(100, riskScore));
  }
  
  // Generate personalized recommendations
  private generateRecommendations(
    ageActivityScore: number,
    balanceScore: number,
    defiScore: number,
    hasLoanRepayment: boolean,
    riskScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (ageActivityScore < 50) {
      recommendations.push('Increase your on-chain activity consistency to improve your score');
    }
    
    if (balanceScore < 50) {
      recommendations.push('Maintain higher token balances to strengthen your financial profile');
    }
    
    if (defiScore < 40) {
      recommendations.push('Increase your lending activity on major protocols to improve your score');
    }
    
    if (!hasLoanRepayment) {
      recommendations.push('Consider responsible borrowing and timely repayment to build positive credit history');
    }
    
    if (riskScore < 50) {
      recommendations.push('Diversify your assets across stablecoins and volatile assets for better risk balance');
    }
    
    // Add some standard recommendations
    recommendations.push('Engage with governance voting to demonstrate protocol participation');
    recommendations.push('Consider diversifying your DeFi activity across multiple chains');
    
    return recommendations;
  }

  // Get a cached credit score if available
  public getCachedCreditScore(walletAddress: string): CreditScoreData | null {
    return this.creditScoreCache.get(walletAddress) || null;
  }

  // Clear the cached credit score for a specific wallet
  public clearCachedCreditScore(walletAddress: string): void {
    this.creditScoreCache.delete(walletAddress);
  }
}

// Singleton instance
export const creditScoreService = new CreditScoreService();
export default creditScoreService;
