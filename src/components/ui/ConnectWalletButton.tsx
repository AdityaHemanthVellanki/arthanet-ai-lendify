
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import walletService, { WalletInfo } from '@/services/walletService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ConnectWalletButton = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  useEffect(() => {
    const unsubscribe = walletService.subscribe((wallet) => {
      setWalletInfo(wallet);
    });

    // Check if wallet is already connected
    const currentWallet = walletService.getCurrentWallet();
    if (currentWallet) {
      setWalletInfo(currentWallet);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Try to connect to MetaMask first
      await walletService.connectWallet('MetaMask');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnectWallet();
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const openInExplorer = (address: string) => {
    // Default to Ethereum Mainnet, but in a real app you'd use the appropriate explorer for the current chain
    window.open(`https://etherscan.io/address/${address}`, '_blank');
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
            <p className="text-sm font-medium text-white">Balance</p>
            <p className="text-xs text-white/70">{walletInfo.balance} ETH</p>
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
