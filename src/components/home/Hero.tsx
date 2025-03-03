
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ConnectWalletButton from '@/components/ui/ConnectWalletButton';
import GradientBackground from '@/components/animations/GradientBackground';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const rect = containerRef.current.getBoundingClientRect();
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      const xPercentage = x / rect.width;
      const yPercentage = y / rect.height;
      
      const xOffset = (xPercentage - 0.5) * 20;
      const yOffset = (yPercentage - 0.5) * 20;
      
      const glowElements = containerRef.current.querySelectorAll('.glow-element');
      glowElements.forEach((element) => {
        const el = element as HTMLElement;
        el.style.transform = `translate(${xOffset * -0.5}px, ${yOffset * -0.5}px)`;
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative pt-36 pb-20 md:pt-44 md:pb-32 overflow-hidden"
    >
      <GradientBackground />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6"
          >
            <span className="px-4 py-1 glass-card text-xs uppercase tracking-wider font-medium text-arthanet-blue rounded-full">
              The Future of DeFi Lending
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-shadow-lg glow-element"
          >
            <span className="text-gradient-blue-purple">
              Decentralized Credit.
            </span>
            <br />
            <span className="text-white">
              Intelligent Automation.
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg md:text-xl text-white/80 mb-10 max-w-3xl glow-element"
          >
            ArthaNet combines AI and blockchain to build the first AI-powered credit scoring 
            and DeFi automation system, optimizing lending, borrowing, and financial 
            decision-making in Web3.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 glow-element"
          >
            <ConnectWalletButton />
            <a 
              href="/how-it-works" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 text-white font-medium"
            >
              Learn More
              <ArrowRight size={16} className="ml-2" />
            </a>
          </motion.div>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-1/3 left-10 w-24 h-24 blur-xl bg-arthanet-blue/20 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute bottom-1/4 right-20 w-32 h-32 blur-xl bg-arthanet-purple/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
    </section>
  );
};

export default Hero;
