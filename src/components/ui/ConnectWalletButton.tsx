
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';

const ConnectWalletButton = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      toast.success('Wallet connection feature will be implemented in the next version', {
        description: 'This is a placeholder for Web3 wallet integration',
      });
    }, 1500);
  };

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
