
import { ethers } from 'ethers';
import { toast } from 'sonner';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: string;
  walletType: string;
}

type WalletCallback = (wallet: WalletInfo | null) => void;

class WalletService {
  private currentWallet: WalletInfo | null = null;
  private subscribers: WalletCallback[] = [];
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    // Initialize the provider if window.ethereum is available
    if (window.ethereum) {
      console.info("Ethereum provider initialized");
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Setup event listeners for account and chain changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      
      // Check if wallet is already connected
      this.checkConnection();
    }
  }

  private async checkConnection() {
    if (!this.provider) return;
    
    try {
      console.info("Checking if wallet is already connected");
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0) {
        console.info("Found connected account:", accounts[0]);
        await this.setupWallet(accounts[0]);
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  }

  private async handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      // User disconnected their wallet
      this.disconnectWallet();
    } else {
      // Account changed, update wallet info
      await this.setupWallet(accounts[0]);
    }
  }

  private async handleChainChanged(chainId: string) {
    // Chain changed, reload page as recommended by MetaMask
    window.location.reload();
  }

  private async setupWallet(address: string) {
    if (!this.provider || !address) return;
    
    try {
      // Get the chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.info("Chain ID:", chainId);
      
      // Get the balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      console.info("Account balance (wei):", balance);
      
      // Create wallet info
      const walletInfo: WalletInfo = {
        address: address,
        balance: this.weiToEth(balance),
        chainId: chainId,
        walletType: 'MetaMask', // Can be expanded to detect other wallet types
      };
      
      // Setup signer
      this.signer = await this.provider.getSigner();
      
      // Update current wallet and notify subscribers
      this.currentWallet = walletInfo;
      this.notifySubscribers();
    } catch (error) {
      console.error("Error setting up wallet:", error);
      toast.error("Failed to setup wallet connection");
    }
  }

  async connectWallet(walletType: string) {
    if (!window.ethereum) {
      toast.error("No Ethereum wallet detected", {
        description: "Please install MetaMask or another Ethereum wallet extension"
      });
      return;
    }
    
    try {
      console.info("Requesting accounts from MetaMask");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.info("Accounts received:", accounts);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      await this.setupWallet(accounts[0]);
      toast.success("Wallet connected successfully");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  disconnectWallet() {
    this.currentWallet = null;
    this.signer = null;
    this.notifySubscribers();
    toast.info("Wallet disconnected");
  }

  getCurrentWallet(): WalletInfo | null {
    return this.currentWallet;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  async getGasPrice(): Promise<bigint> {
    if (!this.provider) {
      throw new Error("No provider available");
    }
    
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(40000000000); // Default to 40 gwei if null
    } catch (error) {
      console.error("Error getting gas price:", error);
      return BigInt(40000000000); // Default to 40 gwei on error
    }
  }

  updateWalletInfo(updatedInfo: WalletInfo) {
    this.currentWallet = updatedInfo;
    this.notifySubscribers();
  }

  weiToEth(weiBalance: string): string {
    if (!weiBalance) return '0';
    const ethBalance = ethers.formatEther(weiBalance);
    return parseFloat(ethBalance).toFixed(4);
  }

  subscribe(callback: WalletCallback): () => void {
    this.subscribers.push(callback);
    
    // Call the callback immediately with the current state
    callback(this.currentWallet);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers() {
    for (const callback of this.subscribers) {
      callback(this.currentWallet);
    }
  }

  // Helper function to check if the current network is supported
  async isNetworkSupported(): Promise<boolean> {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const supportedNetworks = ['0x1', '0x5', '0xaa36a7']; // Mainnet, Goerli, Sepolia
      return supportedNetworks.includes(chainId);
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  }

  // Helper function to get a contract instance
  async getContract(address: string, abi: any): Promise<ethers.Contract | null> {
    if (!this.provider || !address || !abi) {
      console.error("Missing required parameters for contract creation");
      return null;
    }
    
    try {
      return new ethers.Contract(address, abi, this.provider);
    } catch (error) {
      console.error("Error creating contract instance:", error);
      return null;
    }
  }

  // Helper function to get a contract with signer
  async getContractWithSigner(address: string, abi: any): Promise<ethers.Contract | null> {
    if (!this.signer || !address || !abi) {
      console.error("Missing required parameters for contract with signer");
      return null;
    }
    
    try {
      return new ethers.Contract(address, abi, this.signer);
    } catch (error) {
      console.error("Error creating contract with signer:", error);
      return null;
    }
  }

  // Helper function to estimate gas for a transaction
  async estimateGas(tx: any): Promise<bigint> {
    if (!this.provider) {
      throw new Error("No provider available");
    }
    
    try {
      return await this.provider.estimateGas(tx);
    } catch (error) {
      console.error("Error estimating gas:", error);
      throw error;
    }
  }
}

const walletService = new WalletService();
export default walletService;
