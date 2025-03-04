
import { ethers } from 'ethers';
import { TransactionData, FactorResult, BorrowerData } from '../types/creditScore';
import walletService from '../services/walletService';
import { withTimeout } from './promiseUtils';
import { fetchHistoricalTransactionsWithTimeout, isKnownLendingProtocol } from './blockchainUtils';
import { LENDING_PROTOCOL_ADDRESS, RISK_ANALYZER_ADDRESS } from '../constants/creditScoreConstants';

/**
 * Calculate transaction history score
 * @param txCount Transaction count
 * @param historicalTx Historical transactions
 * @returns Factor result with score, impact and description
 */
export function calculateTransactionHistoryScore(
  txCount: number, 
  historicalTx: TransactionData[]
): FactorResult {
  // Base score on transaction count
  let score = Math.min(100, 30 + (txCount * 2));
  
  // Analyze transaction patterns
  const txFrequency = historicalTx.length > 0 ? txCount / historicalTx.length : 0;
  
  // More consistent transaction patterns improve score
  if (txFrequency > 0.5) score += 10;
  if (txFrequency > 1) score += 10;
  
  // Determine impact and description
  let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
  let description = 'Average blockchain activity';
  
  if (score > 70) {
    impact = 'positive';
    description = 'Regular blockchain activity shows responsible usage';
  } else if (score < 40) {
    impact = 'negative';
    description = 'Limited transaction history reduces creditworthiness';
  }
  
  return { score, impact, description };
}

/**
 * Calculate balance stability score
 * @param currentBalance Current balance in wei
 * @returns Factor result with score, impact and description
 */
export function calculateBalanceStabilityScore(currentBalance: bigint): FactorResult {
  // Convert balance to ETH
  const balanceInEth = parseFloat(ethers.formatEther(currentBalance));
  
  // Calculate score based on available balance
  let score = 0;
  if (balanceInEth < 0.1) {
    score = 30; // Low balance
  } else if (balanceInEth < 1) {
    score = 50; // Moderate balance
  } else if (balanceInEth < 5) {
    score = 70; // Good balance
  } else {
    score = 90; // Excellent balance
  }
  
  // Determine impact and description
  let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
  let description = 'Average balance maintained';
  
  if (score > 70) {
    impact = 'positive';
    description = 'Strong balance maintenance improves creditworthiness';
  } else if (score < 40) {
    impact = 'negative';
    description = 'Low balance may indicate financial instability';
  }
  
  return { score, impact, description };
}

/**
 * Calculate DeFi protocol interaction score
 * @param interactions Protocol interactions
 * @returns Factor result with score, impact and description
 */
export function calculateDeFiInteractionScore(interactions: any[]): FactorResult {
  // Base score on number of different protocols interacted with
  const uniqueProtocols = new Set(interactions.map(interaction => interaction.protocol)).size;
  
  let score = Math.min(100, 30 + (uniqueProtocols * 15));
  
  // Determine impact and description
  let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
  let description = 'Average DeFi protocol engagement';
  
  if (score > 70) {
    impact = 'positive';
    description = 'Diverse protocol usage indicates experienced user';
  } else if (score < 40) {
    impact = 'negative';
    description = 'Limited DeFi experience may increase risk';
  }
  
  return { score, impact, description };
}

/**
 * Calculate loan repayment score with timeout
 * @param walletAddress Wallet address
 * @param timeoutMs Timeout in milliseconds
 * @returns Factor result with score, impact and description
 */
export async function calculateLoanRepaymentScoreWithTimeout(
  walletAddress: string, 
  timeoutMs: number
): Promise<FactorResult> {
  return withTimeout(
    calculateLoanRepaymentScore(walletAddress),
    timeoutMs,
    {
      score: 50,
      impact: 'neutral',
      description: 'Unable to retrieve loan repayment data'
    }
  );
}

/**
 * Calculate loan repayment score
 * @param walletAddress Wallet address
 * @returns Factor result with score, impact and description
 */
export async function calculateLoanRepaymentScore(walletAddress: string): Promise<FactorResult> {
  try {
    const provider = await walletService.getProvider();
    if (!provider) {
      throw new Error('No provider available');
    }
    
    // Try to fetch lending protocol data
    let borrowerData: BorrowerData | null = null;
    
    try {
      // Import lending protocol ABI
      const lendingProtocolABI = await import('../abis/LendingProtocolABI.json')
        .catch(() => {
          console.warn('Failed to import LendingProtocolABI, using fallback');
          return { default: [] };
        });
      
      // Get lending protocol contract
      const contract = new ethers.Contract(
        LENDING_PROTOCOL_ADDRESS,
        lendingProtocolABI.default,
        provider
      );
      
      // Try to fetch loan repayment data from lending protocol
      const hasGetBorrowerData = contract.interface.fragments.some(
        (fragment: any) => fragment.name === 'getBorrowerData'
      );
      
      if (hasGetBorrowerData) {
        borrowerData = await contract.getBorrowerData(walletAddress);
      } else {
        throw new Error('Contract does not have getBorrowerData method');
      }
    } catch (error) {
      console.warn('Error fetching borrower data:', error);
      // Use fallback analysis based on transaction history
      
      // Look for typical loan repayment patterns in transaction history
      const transactions = await fetchHistoricalTransactionsWithTimeout(walletAddress, 3000);
      
      // Calculate synthetic loan data from transaction patterns
      const totalLoans = transactions.filter(tx => 
        tx.to && isKnownLendingProtocol(tx.to)
      ).length;
      
      // A simple heuristic to determine loan repayment behavior
      borrowerData = {
        totalLoans: totalLoans,
        defaultedLoans: Math.floor(totalLoans * 0.2), // Assume 20% default rate for estimation
        lateRepayments: Math.floor(totalLoans * 0.3), // Assume 30% late payment rate for estimation
      };
    }
    
    // Calculate score based on repayment history
    const totalLoans = Number(borrowerData?.totalLoans || 0);
    const defaultedLoans = Number(borrowerData?.defaultedLoans || 0);
    const lateRepayments = Number(borrowerData?.lateRepayments || 0);
    
    let score = 70; // Default to average
    
    if (totalLoans === 0) {
      // No loan history
      return {
        score: 50,
        impact: 'neutral',
        description: 'No loan repayment history available'
      };
    }
    
    // Penalize for defaults and late repayments
    if (defaultedLoans > 0) {
      score -= (defaultedLoans / totalLoans) * 50;
    }
    
    if (lateRepayments > 0) {
      score -= (lateRepayments / totalLoans) * 30;
    }
    
    // Reward for successfully repaid loans
    const successfulLoans = totalLoans - defaultedLoans;
    if (successfulLoans > 0) {
      score += (successfulLoans / totalLoans) * 30;
    }
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    // Determine impact and description
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = 'Average loan repayment history';
    
    if (score > 70) {
      impact = 'positive';
      description = 'Consistently repaying loans on time';
    } else if (score < 40) {
      impact = 'negative';
      description = 'Missed or late repayments detected';
    }
    
    return { score, impact, description };
  } catch (error) {
    console.error('Error calculating loan repayment score:', error);
    // Return a neutral score if there's an error
    return {
      score: 50,
      impact: 'neutral',
      description: 'Unable to retrieve loan repayment data'
    };
  }
}

/**
 * Calculate risk profile score with timeout
 * @param walletAddress Wallet address
 * @param timeoutMs Timeout in milliseconds
 * @returns Factor result with score, impact and description
 */
export async function calculateRiskProfileScoreWithTimeout(
  walletAddress: string, 
  timeoutMs: number
): Promise<FactorResult> {
  return withTimeout(
    calculateRiskProfileScore(walletAddress),
    timeoutMs,
    {
      score: 50,
      impact: 'neutral',
      description: 'Unable to retrieve risk profile data'
    }
  );
}

/**
 * Calculate risk profile score
 * @param walletAddress Wallet address
 * @returns Factor result with score, impact and description
 */
export async function calculateRiskProfileScore(walletAddress: string): Promise<FactorResult> {
  try {
    const provider = await walletService.getProvider();
    if (!provider) {
      throw new Error('No provider available');
    }
    
    let collateralHealth: any = null;
    let riskMetrics: any = null;
    
    try {
      // Import risk analyzer ABI
      const riskAnalyzerABI = await import('../abis/RiskAnalyzerABI.json')
        .catch(() => {
          console.warn('Failed to import RiskAnalyzerABI, using fallback');
          return { default: [] };
        });
      
      // Get risk analyzer contract
      const contract = new ethers.Contract(
        RISK_ANALYZER_ADDRESS,
        riskAnalyzerABI.default,
        provider
      );
      
      // Check if contract has required methods
      const hasCollateralHealth = contract.interface.fragments.some(
        (fragment: any) => fragment.name === 'getCollateralHealth'
      );
      
      const hasRiskMetrics = contract.interface.fragments.some(
        (fragment: any) => fragment.name === 'getRiskMetrics'
      );
      
      // Fetch data if methods exist
      if (hasCollateralHealth) {
        collateralHealth = await contract.getCollateralHealth(walletAddress);
      } else {
        console.warn('Contract does not have getCollateralHealth method');
      }
      
      if (hasRiskMetrics) {
        riskMetrics = await contract.getRiskMetrics(walletAddress);
      } else {
        console.warn('Contract does not have getRiskMetrics method');
      }
    } catch (error) {
      console.warn('Error fetching risk data from contract:', error);
      
      // Generate synthetic risk data based on transaction patterns and balance
      const [transactions, balance] = await Promise.all([
        fetchHistoricalTransactionsWithTimeout(walletAddress, 3000),
        provider.getBalance(walletAddress).catch(() => BigInt(0))
      ]);
      
      const balanceInEth = parseFloat(ethers.formatEther(balance));
      
      // Estimate collateral ratio based on balance
      collateralHealth = {
        collateralRatio: balanceInEth < 0.1 ? 1.1 : 
                         balanceInEth < 1 ? 1.5 : 
                         balanceInEth < 5 ? 2.0 : 2.5
      };
      
      // Estimate risk metrics based on transaction patterns
      const highValueTxCount = transactions.filter(tx => 
        tx.value && parseFloat(ethers.formatEther(tx.value)) > 1
      ).length;
      
      const volatilityFactor = highValueTxCount > 5 ? 60 : 
                               highValueTxCount > 2 ? 40 : 20;
      
      riskMetrics = {
        liquidationRisk: balanceInEth < 0.5 ? 30 : 
                         balanceInEth < 2 ? 15 : 5,
        volatilityExposure: volatilityFactor
      };
    }
    
    // Calculate score based on collateralization and risk metrics
    const collateralRatio = Number(collateralHealth?.collateralRatio || 0);
    const liquidationRisk = Number(riskMetrics?.liquidationRisk || 0);
    const volatilityExposure = Number(riskMetrics?.volatilityExposure || 0);
    
    let score = 50; // Default to average
    
    // Higher collateral ratio improves score
    if (collateralRatio > 2) {
      score += 20;
    } else if (collateralRatio > 1.5) {
      score += 10;
    } else if (collateralRatio < 1.2) {
      score -= 10;
    }
    
    // Lower liquidation risk improves score
    if (liquidationRisk < 10) {
      score += 15;
    } else if (liquidationRisk > 20) {
      score -= 15;
    }
    
    // Lower volatility exposure improves score
    if (volatilityExposure < 30) {
      score += 15;
    } else if (volatilityExposure > 50) {
      score -= 15;
    }
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    // Determine impact and description
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = 'Average risk profile';
    
    if (score > 70) {
      impact = 'positive';
      description = 'Maintaining healthy collateral levels';
    } else if (score < 40) {
      impact = 'negative';
      description = 'High risk exposure detected';
    }
    
    return { score, impact, description };
  } catch (error) {
    console.error('Error calculating risk profile score:', error);
    // Return a neutral score if there's an error
    return {
      score: 50,
      impact: 'neutral',
      description: 'Unable to retrieve risk profile data'
    };
  }
}
