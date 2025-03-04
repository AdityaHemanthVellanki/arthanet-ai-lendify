
import { ethers } from 'ethers';
import { CreditScoreData, CreditScoreFactor, HistoricalRiskData } from '../types/creditScore';
import { FACTOR_WEIGHTS } from '../constants/creditScoreConstants';

/**
 * Generate personalized recommendations based on factors
 * @param factors Credit score factors
 * @returns Array of recommendation strings
 */
export function generateRecommendations(factors: CreditScoreFactor[]): string[] {
  const recommendations: string[] = [];
  
  // Base recommendations
  recommendations.push('Maintain consistent DeFi activity to improve your score');
  
  // Add specific recommendations based on factor scores
  for (const factor of factors) {
    if (factor.score < 50) {
      switch (factor.category) {
        case 'Transaction History':
          recommendations.push('Increase your blockchain activity with regular transactions');
          break;
        case 'Balance Stability':
          recommendations.push('Maintain a higher wallet balance to improve stability');
          break;
        case 'DeFi Protocol Interactions':
          recommendations.push('Consider diversifying your protocol interactions');
          break;
        case 'Loan Repayments':
          recommendations.push('Ensure timely loan repayments to maintain a positive history');
          break;
        case 'Risk Profile':
          recommendations.push('Increase your collateralization ratio to reduce risk');
          break;
      }
    }
  }
  
  // Limit to 5 recommendations maximum
  return recommendations.slice(0, 5);
}

/**
 * Generate fallback credit score data
 * @param walletAddress Wallet address
 * @returns Credit score data
 */
export function generateFallbackCreditScore(walletAddress: string): CreditScoreData {
  // Use the wallet address to generate a deterministic but "random" score
  // This ensures the same wallet always gets the same score
  const hash = walletAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseScore = 500 + (hash % 300); // Score between 500-800
  
  let riskLevel = 'Medium';
  if (baseScore < 600) riskLevel = 'High';
  else if (baseScore > 700) riskLevel = 'Low';
  
  // Generate factors
  const factors: CreditScoreFactor[] = [
    {
      category: 'Transaction History',
      score: 30 + (hash % 70),
      impact: hash % 3 === 0 ? 'positive' : hash % 3 === 1 ? 'negative' : 'neutral',
      description: 'Based on available on-chain data'
    },
    {
      category: 'Balance Stability',
      score: 40 + (hash % 60),
      impact: hash % 3 === 1 ? 'positive' : hash % 3 === 2 ? 'negative' : 'neutral',
      description: 'Current balance level assessment'
    },
    {
      category: 'DeFi Protocol Interactions',
      score: 50 + (hash % 50),
      impact: hash % 3 === 2 ? 'positive' : hash % 3 === 0 ? 'negative' : 'neutral',
      description: 'Protocol interaction diversity'
    },
    {
      category: 'Loan Repayments',
      score: 45 + (hash % 55),
      impact: hash % 3 === 0 ? 'positive' : hash % 3 === 1 ? 'negative' : 'neutral',
      description: 'Estimation based on available data'
    },
    {
      category: 'Risk Profile',
      score: 35 + (hash % 65),
      impact: hash % 3 === 1 ? 'positive' : hash % 3 === 2 ? 'negative' : 'neutral',
      description: 'Current risk level assessment'
    }
  ];
  
  // Generate recommendations
  const recommendations = [
    'Maintain consistent DeFi activity to improve your score',
    'Consider diversifying your protocol interactions',
    'Maintain a higher wallet balance to improve stability',
    'Ensure timely loan repayments to maintain a positive history',
    'Increase your collateralization ratio to reduce risk'
  ];
  
  return {
    score: baseScore,
    riskLevel,
    factors,
    recommendations,
    lastUpdated: new Date()
  };
}

/**
 * Generate fallback historical data if blockchain queries fail
 * @param walletAddress Wallet address
 * @returns Array of historical risk data
 */
export function generateFallbackHistoricalData(walletAddress: string): HistoricalRiskData[] {
  const data: HistoricalRiskData[] = [];
  const today = new Date();
  
  // Use wallet address to seed a deterministic pattern
  const hash = walletAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseRisk = 3 + ((hash % 5) * 0.5); // Base risk between 3-5.5
  
  // Generate 30 days of data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Create a pattern that has some consistency but also variation
    const dayFactor = (Math.sin(i * 0.4) * 0.5) + (i % 5) * 0.1;
    const riskValue = Math.max(1, Math.min(10, baseRisk + dayFactor));
    
    data.push({
      date,
      value: riskValue
    });
  }
  
  return data;
}

/**
 * Calculate the overall credit score based on factor scores
 * @param factors Array of credit score factors
 * @returns Overall score scaled to 500-800 range
 */
export function calculateOverallScore(factors: CreditScoreFactor[]): number {
  let totalWeightedScore = 0;
  for (const factor of factors) {
    const weight = FACTOR_WEIGHTS[factor.category as keyof typeof FACTOR_WEIGHTS] || 0;
    totalWeightedScore += factor.score * weight;
  }
  
  // Scale to 500-800 range
  return 500 + Math.round((totalWeightedScore / 100) * 300);
}

/**
 * Determine risk level based on score
 * @param score Credit score
 * @returns Risk level string
 */
export function determineRiskLevel(score: number): string {
  if (score < 600) return 'High';
  if (score > 700) return 'Low';
  return 'Medium';
}
