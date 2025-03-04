
import { ethers } from 'ethers';
import { toast } from 'sonner';
import walletService, { WalletInfo } from './walletService';
import CreditScoreABI from '../abis/CreditScoreABI.json';

// Credit score contract address - would typically come from environment variables
const CREDIT_SCORE_CONTRACT_ADDRESS = '0x123abc456def789ghi012jkl345mno678pqr'; // Replace with actual contract address

export interface CreditScoreFactor {
  category: string;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface CreditScoreData {
  score: number;
  riskLevel: string;
  factors: CreditScoreFactor[];
  recommendations: string[];
  lastUpdated: Date;
}

class CreditScoreService {
  private creditScores: Record<string, CreditScoreData> = {};
  private isGenerating: Record<string, boolean> = {};
  
  // Get cached credit score
  getCachedCreditScore(walletAddress: string): CreditScoreData | null {
    return this.creditScores[walletAddress] || null;
  }
  
  // Generate credit score from blockchain data
  async generateCreditScore(walletInfo: WalletInfo): Promise<CreditScoreData | null> {
    if (!walletInfo || !walletInfo.address) {
      toast.error('Wallet not connected');
      return null;
    }
    
    const walletAddress = walletInfo.address;
    
    // Prevent multiple generations at once
    if (this.isGenerating[walletAddress]) {
      toast.info('Credit score generation is already in progress');
      return null;
    }
    
    this.isGenerating[walletAddress] = true;
    
    try {
      toast.info('Generating your DeFi credit score...', {
        description: 'Analyzing on-chain data and transaction history'
      });
      
      // Check if wallet is connected to a supported network
      const isNetworkSupported = await walletService.isNetworkSupported();
      if (!isNetworkSupported) {
        toast.error('Unsupported network', {
          description: 'Please connect to Ethereum Mainnet, Goerli, or Sepolia testnet'
        });
        this.isGenerating[walletAddress] = false;
        return null;
      }
      
      // Get the contract instance
      const provider = walletService.getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }
      
      const contract = new ethers.Contract(
        CREDIT_SCORE_CONTRACT_ADDRESS,
        CreditScoreABI,
        provider
      );
      
      // Call the generate credit score function
      const signer = walletService.getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }
      
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.generateCreditScore(walletAddress);
      
      // Show transaction submitted toast
      toast.info('Credit score calculation submitted', {
        description: 'Transaction has been sent to the blockchain'
      });
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Now fetch the credit score details
      const scoreData = await this.fetchCreditScoreFromBlockchain(walletAddress);
      
      // Update cached credit score
      this.creditScores[walletAddress] = scoreData;
      
      toast.success('Credit score generated successfully', {
        description: `Your DeFi credit score is ${scoreData.score}`
      });
      
      return scoreData;
    } catch (error) {
      console.error('Error generating credit score:', error);
      
      // If it's a contract interaction error, try to fetch the score directly
      // as it might have been generated before
      try {
        const existingScore = await this.fetchCreditScoreFromBlockchain(walletAddress);
        if (existingScore) {
          this.creditScores[walletAddress] = existingScore;
          return existingScore;
        }
      } catch (fetchError) {
        console.error('Error fetching existing credit score:', fetchError);
      }
      
      toast.error('Failed to generate credit score', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      return null;
    } finally {
      this.isGenerating[walletAddress] = false;
    }
  }
  
  // Fetch credit score data from blockchain
  private async fetchCreditScoreFromBlockchain(walletAddress: string): Promise<CreditScoreData> {
    const provider = walletService.getProvider();
    if (!provider) {
      throw new Error('No provider available');
    }
    
    const contract = new ethers.Contract(
      CREDIT_SCORE_CONTRACT_ADDRESS,
      CreditScoreABI,
      provider
    );
    
    // Fetch basic score data
    const scoreDetails = await contract.getCreditScoreDetails(walletAddress);
    
    // Fetch score factors
    const factors = await contract.getCreditFactors(walletAddress);
    
    // Fetch recommendations
    const recommendations = await contract.getRecommendations(walletAddress);
    
    // Process the data
    const formattedFactors: CreditScoreFactor[] = factors.map((factor: any) => ({
      category: factor.category,
      score: Number(factor.score),
      impact: factor.impact.toLowerCase() as 'positive' | 'negative' | 'neutral',
      description: factor.description
    }));
    
    // Determine risk level based on score
    const score = Number(scoreDetails.score);
    let riskLevel = 'Medium';
    if (score < 600) riskLevel = 'High';
    else if (score > 700) riskLevel = 'Low';
    
    // Create credit score data object
    const creditScoreData: CreditScoreData = {
      score,
      riskLevel,
      factors: formattedFactors,
      recommendations: recommendations,
      lastUpdated: new Date(Number(scoreDetails.lastUpdated) * 1000) // Convert timestamp to Date
    };
    
    return creditScoreData;
  }
}

const creditScoreService = new CreditScoreService();
export default creditScoreService;
