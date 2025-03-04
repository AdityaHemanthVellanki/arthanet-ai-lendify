
import { ethers } from 'ethers';
import walletService from '../services/walletService';
import { TransactionData } from '../types/creditScore';
import { withTimeout } from './promiseUtils';
import { KNOWN_LENDING_PROTOCOLS, DEFI_PROTOCOLS } from '../constants/creditScoreConstants';

/**
 * Fetch historical transactions for a wallet with timeout
 * @param walletAddress The wallet address
 * @param timeoutMs Timeout in milliseconds
 * @returns Array of transactions
 */
export async function fetchHistoricalTransactionsWithTimeout(
  walletAddress: string,
  timeoutMs: number
): Promise<TransactionData[]> {
  return withTimeout(
    fetchHistoricalTransactions(walletAddress),
    timeoutMs,
    [] // Empty array as fallback
  );
}

/**
 * Fetch historical transactions for a wallet
 * @param walletAddress The wallet address
 * @returns Array of transactions
 */
export async function fetchHistoricalTransactions(walletAddress: string): Promise<TransactionData[]> {
  try {
    const provider = await walletService.getProvider();
    if (!provider) {
      throw new Error('No provider available');
    }
    
    // Get the current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Look back approximately 3 days (assuming ~7200 blocks per day)
    const lookBackBlocks = 3 * 7200;
    const fromBlock = Math.max(0, currentBlock - lookBackBlocks);
    
    // Process blocks to find transactions from this wallet
    const transactions = [];
    
    // Get last 5 blocks for analysis (reduced to avoid timeout)
    const blocksToCheck = 5;
    for (let i = 0; i < blocksToCheck; i++) {
      const blockNum = currentBlock - i;
      if (blockNum < 0) continue;
      
      try {
        const block = await provider.getBlock(blockNum);
        if (!block || !block.transactions) continue;
        
        // Limit the number of transactions we process per block
        const txsToCheck = block.transactions.slice(0, 5); // Only check first 5 txs
        
        for (const txHash of txsToCheck) {
          try {
            const tx = await provider.getTransaction(txHash);
            if (tx && tx.from && tx.from.toLowerCase() === walletAddress.toLowerCase()) {
              transactions.push({
                hash: tx.hash,
                blockNumber: tx.blockNumber,
                timestamp: block.timestamp,
                from: tx.from,
                to: tx.to,
                value: tx.value
              });
            }
          } catch (error) {
            console.error('Error fetching transaction:', error);
          }
        }
      } catch (blockError) {
        console.error(`Error processing block ${blockNum}:`, blockError);
      }
    }
    
    console.log(`Found ${transactions.length} transactions for wallet ${walletAddress}`);
    return transactions;
  } catch (error) {
    console.error('Error fetching historical transactions:', error);
    return [];
  }
}

/**
 * Check if an address belongs to a known lending protocol
 * @param address The address to check
 * @returns Boolean indicating if address is a known lending protocol
 */
export function isKnownLendingProtocol(address: string): boolean {
  return KNOWN_LENDING_PROTOCOLS.some(protocol => 
    protocol.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Fetch DeFi protocol interactions with timeout
 * @param walletAddress The wallet address
 * @param timeoutMs Timeout in milliseconds
 * @returns Array of protocol interactions
 */
export async function fetchDeFiProtocolInteractionsWithTimeout(
  walletAddress: string,
  timeoutMs: number
): Promise<any[]> {
  return withTimeout(
    fetchDeFiProtocolInteractions(walletAddress),
    timeoutMs,
    [] // Empty array as fallback
  );
}

/**
 * Fetch DeFi protocol interactions
 * @param walletAddress The wallet address
 * @returns Array of protocol interactions
 */
export async function fetchDeFiProtocolInteractions(walletAddress: string): Promise<any[]> {
  try {
    const transactions = await fetchHistoricalTransactionsWithTimeout(walletAddress, 3000);
    const interactions = [];
    
    // Check if any transactions involve known DeFi protocols
    for (const protocol of DEFI_PROTOCOLS) {
      // Count interactions with this protocol
      const protocolTxs = transactions.filter(tx => 
        tx.to && tx.to.toLowerCase() === protocol.address.toLowerCase()
      );
      
      if (protocolTxs.length > 0) {
        const latestTx = protocolTxs.reduce((latest, tx) => 
          (tx.timestamp! > latest.timestamp!) ? tx : latest, 
          protocolTxs[0]
        );
        
        interactions.push({
          protocol: protocol.name,
          address: protocol.address,
          lastInteraction: new Date(Number(latestTx.timestamp) * 1000),
          interactionCount: protocolTxs.length
        });
      }
    }
    
    console.log(`Found ${interactions.length} DeFi protocol interactions for wallet ${walletAddress}`);
    return interactions;
  } catch (error) {
    console.error('Error fetching DeFi protocol interactions:', error);
    return [];
  }
}
