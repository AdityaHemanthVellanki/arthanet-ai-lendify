
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import walletService, { WalletInfo } from '@/services/walletService';
import creditScoreService from '@/services/creditScoreService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ConnectWalletButton = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  useEffect(() => {
    const unsubscribe = walletService.subscribe((wallet) => {
      setWalletInfo(wallet);
      
      // Only generate credit score when wallet is connected
      // but don't navigate to credit score page automatically
      if (wallet && isConnecting) {
        console.log("Wallet connected, generating credit score");
        // Start generating credit score
        creditScoreService.generateCreditScore(wallet);
        setIsConnecting(false);
      }
    });

    // Check if wallet is already connected, but don't navigate
    const currentWallet = walletService.getCurrentWallet();
    if (currentWallet) {
      console.log("Wallet already connected:", currentWallet.address);
      setWalletInfo(currentWallet);
    }

    return () => {
      unsubscribe();
    };
  }, [isConnecting]);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      console.log("Attempting to connect wallet");
      // Try to connect to MetaMask first
      await walletService.connectWallet('MetaMask');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    console.log("Disconnecting wallet");
    walletService.disconnectWallet();
  };

  const handleRefreshBalance = async () => {
    if (!walletInfo) return;
    
    setIsRefreshing(true);
    try {
      console.log("Refreshing wallet balance");
      // Re-fetch wallet balance from the blockchain
      if (window.ethereum) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [walletInfo.address, 'latest'],
        });
        
        // Update wallet info with new balance
        const updatedWalletInfo: WalletInfo = {
          ...walletInfo,
          balance: walletService.weiToEth(balance)
        };
        
        // Update in service and set in component
        walletService.updateWalletInfo(updatedWalletInfo);
        setWalletInfo(updatedWalletInfo);
        
        toast.success('Wallet balance updated');
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setIsRefreshing(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const openInExplorer = (address: string) => {
    if (!walletInfo) return;
    
    // Use the chain ID to determine the appropriate explorer URL
    const chainId = walletInfo.chainId;
    let explorerUrl = `https://etherscan.io/address/${address}`;
    
    if (chainId === '0x5') {
      explorerUrl = `https://goerli.etherscan.io/address/${address}`;
    } else if (chainId === '0xaa36a7') {
      explorerUrl = `https://sepolia.etherscan.io/address/${address}`;
    } else if (chainId.startsWith('0x')) {
      // Convert hex chainId to decimal
      const decimalChainId = parseInt(chainId, 16);
      
      // Check for other known networks
      switch (decimalChainId) {
        case 137: // Polygon
          explorerUrl = `https://polygonscan.com/address/${address}`;
          break;
        case 56: // BSC
          explorerUrl = `https://bscscan.com/address/${address}`;
          break;
        case 42161: // Arbitrum
          explorerUrl = `https://arbiscan.io/address/${address}`;
          break;
        case 10: // Optimism
          explorerUrl = `https://optimistic.etherscan.io/address/${address}`;
          break;
      }
    }
    
    window.open(explorerUrl, '_blank');
    toast.success('Opening in blockchain explorer');
  };

  if (walletInfo) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            className="bg-blue-purple-gradient hover:opacity-90 transition-all duration-300 text-white font-medium rounded-lg px-6 h-11"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {truncateAddress(walletInfo.address)}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-arthanet-darkBlue border border-white/10">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white">Connected Wallet</p>
            <p className="text-xs text-white/70">{walletInfo.walletType}</p>
          </div>
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-white">Address</p>
            <p className="text-xs text-white/70 truncate">{walletInfo.address}</p>
          </div>
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-white">Network</p>
            <p className="text-xs text-white/70">{
              walletInfo.chainId === '0x1' ? 'Ethereum Mainnet' :
              walletInfo.chainId === '0x5' ? 'Goerli Testnet' :
              walletInfo.chainId === '0xaa36a7' ? 'Sepolia Testnet' :
              `Chain ID: ${walletInfo.chainId}`
            }</p>
          </div>
          <div className="px-4 py-2 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-white">Balance</p>
              <p className="text-xs text-white/70">{walletInfo.balance} ETH</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            className="cursor-pointer text-white hover:bg-white/10"
            onClick={() => copyToClipboard(walletInfo.address)}
          >
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Address</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer text-white hover:bg-white/10"
            onClick={() => openInExplorer(walletInfo.address)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>View on Explorer</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            className="cursor-pointer text-red-500 hover:bg-white/10"
            onClick={handleDisconnect}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isConnecting}
      className="bg-blue-purple-gradient hover:opacity-90 transition-all duration-300 text-white font-medium rounded-lg px-6 h-11"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};

export default ConnectWalletButton;
