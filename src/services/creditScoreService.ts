
import { toast } from 'sonner';
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

class CreditScoreService {
  private creditScoreCache: Map<string, CreditScoreData> = new Map();
  private isGenerating: boolean = false;

  // Generate a credit score for the connected wallet
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
      // In a real implementation, this would make API calls to backend services
      // that analyze on-chain data, but for demo purposes, we'll simulate the process
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate a simulated credit score based on wallet address
      const addressSum = Array.from(walletInfo.address)
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
      
      const baseScore = (addressSum % 300) + 500; // Score between 500-799
      
      const creditScoreData: CreditScoreData = {
        score: baseScore,
        riskLevel: baseScore < 600 ? 'High' : baseScore < 700 ? 'Medium' : 'Low',
        factors: [
          {
            category: 'Wallet Age & Activity',
            score: Math.floor(Math.random() * 100),
            description: 'Your wallet has been active for a reasonable period with consistent transactions.',
            impact: 'positive'
          },
          {
            category: 'Transaction Patterns',
            score: Math.floor(Math.random() * 100),
            description: 'Your transaction patterns show regular DeFi interactions which improves trust.',
            impact: 'positive'
          },
          {
            category: 'DeFi Engagement',
            score: Math.floor(Math.random() * 100),
            description: 'You have moderate engagement with DeFi protocols across multiple chains.',
            impact: 'neutral'
          },
          {
            category: 'Loan Repayment History',
            score: Math.floor(Math.random() * 100),
            description: 'Limited loan repayment history available for analysis.',
            impact: baseScore > 650 ? 'neutral' : 'negative'
          },
          {
            category: 'Risk Profile',
            score: Math.floor(Math.random() * 100),
            description: 'Your activity shows a balanced approach to risk in DeFi markets.',
            impact: 'positive'
          }
        ],
        recommendations: [
          'Increase your lending activity on major protocols to improve your score',
          'Maintain consistent repayment of DeFi loans to build positive history',
          'Consider diversifying your DeFi activity across multiple chains',
          'Engage with governance voting to demonstrate protocol participation'
        ],
        lastUpdated: new Date()
      };
      
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
