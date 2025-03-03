
import { toast } from 'sonner';

export interface WalletInfo {
  address: string;
  chainId: string;
  balance: string;
  walletType: 'MetaMask' | 'WalletConnect' | 'Phantom' | 'Unknown';
}

class WalletService {
  private currentWallet: WalletInfo | null = null;
  private listeners: ((wallet: WalletInfo | null) => void)[] = [];

  constructor() {
    this.checkIfWalletConnected();
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', this.handleEthereumInitialized);
      
      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', this.handleAccountsChanged);
        window.ethereum.on('chainChanged', this.handleChainChanged);
      }
    }
  }

  private handleEthereumInitialized = () => {
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

  private checkIfWalletConnected = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          this.connectToMetaMask(true);
        }
      } catch (error) {
        console.error('Error checking if wallet is connected:', error);
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
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      });

      const walletInfo: WalletInfo = {
        address: accounts[0],
        chainId,
        balance: this.weiToEth(balance),
        walletType: 'MetaMask',
      };

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

  public subscribe(listener: (wallet: WalletInfo | null) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
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

// Add Ethereum provider to Window interface
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Singleton instance
export const walletService = new WalletService();
export default walletService;
