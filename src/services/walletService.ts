import { toast } from 'sonner';
import { ethers } from 'ethers';

export interface WalletInfo {
  address: string;
  chainId: string;
  balance: string;
  walletType: 'MetaMask' | 'WalletConnect' | 'Phantom' | 'Unknown';
}

class WalletService {
  private currentWallet: WalletInfo | null = null;
  private listeners: ((wallet: WalletInfo | null) => void)[] = [];
  private provider: ethers.Provider | null = null;
  private reconnecting: boolean = false;
  private cachedEthPrice: number | null = null;
  private lastPriceUpdate: number = 0;

  constructor() {
    this.initProvider();
    this.checkIfWalletConnected();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', this.handleEthereumInitialized);
      
      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', this.handleAccountsChanged);
        window.ethereum.on('chainChanged', this.handleChainChanged);
        window.ethereum.on('disconnect', this.handleDisconnect);
      }
    }
  }

  private initProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  private handleEthereumInitialized = () => {
    this.initProvider();
    this.checkIfWalletConnected();
  };

  private handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      this.disconnectWallet();
      toast.info('Wallet disconnected');
    } else if (this.currentWallet) {
      this.connectToMetaMask(); // Refresh connection
    }
  };

  private handleChainChanged = () => {
    if (this.currentWallet) {
      this.connectToMetaMask(); // Refresh connection
      toast.info('Network changed');
    }
  };

  private handleDisconnect = (error: { code: number; message: string }) => {
    this.disconnectWallet();
    toast.error(`Wallet disconnected: ${error.message}`);
  };

  private checkIfWalletConnected = async () => {
    if (window.ethereum && !this.reconnecting) {
      this.reconnecting = true;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          await this.connectToMetaMask(true);
        }
      } catch (error) {
        console.error('Error checking if wallet is connected:', error);
      } finally {
        this.reconnecting = false;
      }
    }
  };

  public async connectWallet(type: 'MetaMask' | 'WalletConnect' | 'Phantom'): Promise<WalletInfo | null> {
    try {
      switch (type) {
        case 'MetaMask':
          return await this.connectToMetaMask();
        case 'WalletConnect':
          return await this.connectToWalletConnect();
        case 'Phantom':
          return await this.connectToPhantom();
        default:
          throw new Error('Unsupported wallet type');
      }
    } catch (error: any) {
      toast.error(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  private async connectToMetaMask(silent = false): Promise<WalletInfo | null> {
    if (!window.ethereum) {
      if (!silent) {
        toast.error('MetaMask is not installed. Please install MetaMask and try again.', {
          action: {
            label: 'Install',
            onClick: () => window.open('https://metamask.io/download.html', '_blank'),
          },
        });
      }
      return null;
    }

    try {
      // Request accounts access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get current chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      // Get account balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      });

      // Format wallet info
      const walletInfo: WalletInfo = {
        address: accounts[0],
        chainId,
        balance: this.weiToEth(balance),
        walletType: 'MetaMask',
      };

      // Update state and notify listeners
      this.currentWallet = walletInfo;
      this.notifyListeners();
      
      if (!silent) {
        toast.success('Successfully connected to MetaMask');
      }
      
      return walletInfo;
    } catch (error: any) {
      if (!silent) {
        if (error.code === 4001) {
          toast.error('User rejected the connection request');
        } else {
          toast.error(`Failed to connect to MetaMask: ${error.message || 'Unknown error'}`);
        }
      }
      return null;
    }
  }

  private async connectToWalletConnect(): Promise<WalletInfo | null> {
    toast.info('WalletConnect integration will be available in the next update');
    
    // Placeholder for WalletConnect integration
    // In a real implementation, you would use the WalletConnect library here
    
    return null;
  }

  private async connectToPhantom(): Promise<WalletInfo | null> {
    toast.info('Phantom wallet integration will be available in the next update');
    
    // Placeholder for Phantom wallet integration
    // In a real implementation, you would use the Phantom wallet API here
    
    return null;
  }

  public disconnectWallet(): void {
    this.currentWallet = null;
    this.notifyListeners();
    toast.success('Wallet disconnected');
  }

  public getCurrentWallet(): WalletInfo | null {
    return this.currentWallet;
  }

  public async getEthPrice(): Promise<number> {
    const now = Date.now();
    if (this.cachedEthPrice && (now - this.lastPriceUpdate < 5 * 60 * 1000)) {
      return this.cachedEthPrice;
    }

    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      
      if (data && data.ethereum && data.ethereum.usd) {
        this.cachedEthPrice = data.ethereum.usd;
        this.lastPriceUpdate = now;
        return this.cachedEthPrice;
      }
      throw new Error('Invalid price data from API');
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      return this.cachedEthPrice || 1800;
    }
  }

  public getProvider(): ethers.Provider | null {
    if (!this.provider && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
    return this.provider;
  }

  public async getSigner(): Promise<ethers.Signer | null> {
    try {
      const provider = this.getProvider();
      if (!provider) return null;
      
      if (provider instanceof ethers.BrowserProvider) {
        return await provider.getSigner();
      }
      
      console.error('Provider is not a BrowserProvider, cannot get signer');
      return null;
    } catch (error) {
      console.error('Error getting signer:', error);
      return null;
    }
  }

  public async sendTransaction(tx: any): Promise<ethers.TransactionResponse | null> {
    try {
      const signer = await this.getSigner();
      if (!signer) {
        toast.error('Wallet not connected or signer not available');
        return null;
      }
      
      const txResponse = await signer.sendTransaction(tx);
      
      toast.info('Transaction sent', {
        description: `Transaction hash: ${txResponse.hash.substring(0, 10)}...`,
        action: {
          label: 'View',
          onClick: () => {
            const chainId = this.currentWallet?.chainId;
            let explorerUrl = `https://etherscan.io/tx/${txResponse.hash}`;
            
            if (chainId === '0x5') {
              explorerUrl = `https://goerli.etherscan.io/tx/${txResponse.hash}`;
            } else if (chainId === '0xaa36a7') {
              explorerUrl = `https://sepolia.etherscan.io/tx/${txResponse.hash}`;
            }
            
            window.open(explorerUrl, '_blank');
          }
        }
      });
      
      return txResponse;
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      if (error.code === 4001) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
      
      return null;
    }
  }

  public subscribe(listener: (wallet: WalletInfo | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentWallet));
  }

  private weiToEth(weiBalance: string): string {
    try {
      const wei = BigInt(weiBalance);
      const eth = Number(wei) / 1e18;
      return eth.toFixed(4);
    } catch (error) {
      return '0.0000';
    }
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const walletService = new WalletService();
export default walletService;
