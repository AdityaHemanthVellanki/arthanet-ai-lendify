
import { ethers } from 'ethers';
import { toast } from 'sonner';
import walletService, { WalletInfo } from './walletService';
import CreditScoreABI from '../abis/CreditScoreABI.json';
import { CreditScoreData, CreditScoreFactor, HistoricalRiskData } from '../types/creditScore';
import { CREDIT_SCORE_CONTRACT_ADDRESS } from '../constants/creditScoreConstants';
import { 
  calculateTransactionHistoryScore,
  calculateBalanceStabilityScore, 
  calculateDeFiInteractionScore,
  calculateLoanRepaymentScoreWithTimeout,
  calculateRiskProfileScoreWithTimeout
} from '../utils/creditScoreFactorCalculators';
import {
  generateRecommendations,
  generateFallbackCreditScore,
  calculateOverallScore,
  determineRiskLevel
} from '../utils/creditScoreUtils';
import {
  fetchHistoricalTransactionsWithTimeout,
  fetchDeFiProtocolInteractionsWithTimeout
} from '../utils/blockchainUtils';
import { getHistoricalRiskData } from '../utils/historicalDataUtils';
import { DEFAULT_TIMEOUT, FAST_TIMEOUT } from '../constants/creditScoreConstants';

class CreditScoreService {
  private creditScores: Record<string, CreditScoreData> = {};
  private isGenerating: Record<string, boolean> = {};
  private historicalRiskData: Record<string, HistoricalRiskData[]> = {};
  
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
      
      // Generate credit score using on-chain data
      const creditScoreData = await this.calculateCreditScore(walletAddress);
      
      // Update cached credit score
      this.creditScores[walletAddress] = creditScoreData;
      
      toast.success('Credit score generated successfully', {
        description: `Your DeFi credit score is ${creditScoreData.score}`
      });
      
      return creditScoreData;
    } catch (error) {
      console.error('Error generating credit score:', error);
      toast.error('Failed to generate credit score', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Generate fallback credit score if contract interaction fails
      // This ensures the UI doesn't get stuck in the loading state
      const fallbackScore = generateFallbackCreditScore(walletAddress);
      this.creditScores[walletAddress] = fallbackScore;
      
      return fallbackScore;
    } finally {
      // Make sure to always reset the generating flag
      this.isGenerating[walletAddress] = false;
    }
  }
  
  // Calculate credit score based on on-chain data
  private async calculateCreditScore(walletAddress: string): Promise<CreditScoreData> {
    try {
      const provider = await walletService.getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }
      
      // Create a batch of promises to fetch different data points in parallel
      const [
        transactionCount,
        balance,
        blockNumber
      ] = await Promise.all([
        provider.getTransactionCount(walletAddress),
        provider.getBalance(walletAddress),
        provider.getBlockNumber()
      ]);
      
      console.log('Transaction count:', transactionCount);
      console.log('Wallet balance:', ethers.formatEther(balance));
      
      // Fetch historical transactions with a timeout to prevent hanging
      const historicalTransactions = await fetchHistoricalTransactionsWithTimeout(walletAddress, DEFAULT_TIMEOUT);
      
      // Fetch DeFi protocol interactions with a timeout
      const defiProtocolInteractions = await fetchDeFiProtocolInteractionsWithTimeout(walletAddress, DEFAULT_TIMEOUT);
      
      // Calculate transaction history score
      const txHistoryScore = calculateTransactionHistoryScore(transactionCount, historicalTransactions);
      
      // Calculate balance stability score
      const balanceStabilityScore = calculateBalanceStabilityScore(balance);
      
      // Calculate DeFi protocol interaction score
      const defiInteractionScore = calculateDeFiInteractionScore(defiProtocolInteractions);
      
      // Calculate loan repayment score - with fallback
      const loanRepaymentScore = await calculateLoanRepaymentScoreWithTimeout(walletAddress, DEFAULT_TIMEOUT);
      
      // Calculate risk profile score - with fallback
      const riskProfileScore = await calculateRiskProfileScoreWithTimeout(walletAddress, DEFAULT_TIMEOUT);
      
      // Create score factors array
      const factors: CreditScoreFactor[] = [
        {
          category: 'Transaction History',
          score: txHistoryScore.score,
          impact: txHistoryScore.impact,
          description: txHistoryScore.description
        },
        {
          category: 'Balance Stability',
          score: balanceStabilityScore.score,
          impact: balanceStabilityScore.impact,
          description: balanceStabilityScore.description
        },
        {
          category: 'DeFi Protocol Interactions',
          score: defiInteractionScore.score,
          impact: defiInteractionScore.impact,
          description: defiInteractionScore.description
        },
        {
          category: 'Loan Repayments',
          score: loanRepaymentScore.score,
          impact: loanRepaymentScore.impact,
          description: loanRepaymentScore.description
        },
        {
          category: 'Risk Profile',
          score: riskProfileScore.score,
          impact: riskProfileScore.impact,
          description: riskProfileScore.description
        }
      ];
      
      // Calculate overall score
      const baseScore = calculateOverallScore(factors);
      
      // Determine risk level
      const riskLevel = determineRiskLevel(baseScore);
      
      // Generate recommendations based on factors
      const recommendations = generateRecommendations(factors);
      
      // Create credit score data object
      const creditScoreData: CreditScoreData = {
        score: baseScore,
        riskLevel,
        factors,
        recommendations,
        lastUpdated: new Date()
      };
      
      return creditScoreData;
    } catch (error) {
      console.error('Error calculating credit score:', error);
      // If anything fails, return a fallback score
      return generateFallbackCreditScore(walletAddress);
    }
  }
  
  // Get historical risk data for a wallet
  async getHistoricalRiskData(walletAddress: string): Promise<HistoricalRiskData[]> {
    return getHistoricalRiskData(walletAddress, this.historicalRiskData);
  }
}

const creditScoreService = new CreditScoreService();
export default creditScoreService;
