
import { ethers } from 'ethers';

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

// Interface for historical risk data
export interface HistoricalRiskData {
  date: Date;
  value: number;
}

// Factor calculation result type
export interface FactorResult {
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

// Transaction data interface
export interface TransactionData {
  hash?: string;
  blockNumber?: number;
  timestamp?: number;
  from?: string;
  to?: string;
  value?: bigint;
}

// Protocol interaction interface
export interface ProtocolInteraction {
  protocol: string;
  address: string;
  lastInteraction: Date;
  interactionCount: number;
}

// Borrower data interface
export interface BorrowerData {
  totalLoans: number;
  defaultedLoans: number;
  lateRepayments: number;
}
