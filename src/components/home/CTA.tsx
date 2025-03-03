
import React from 'react';
import { motion } from 'framer-motion';
import ConnectWalletButton from '@/components/ui/ConnectWalletButton';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-blue-purple-gradient opacity-10"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="glass-card p-12 md:p-16 rounded-2xl overflow-hidden relative">
          {/* Background glow effects */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-arthanet-blue/20 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-arthanet-purple/20 rounded-full blur-[100px]"></div>
          
          <div className="relative grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-white mb-6"
              >
                Ready to transform your DeFi experience with AI?
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-white/70 mb-8"
              >
                Connect your wallet to discover your AI-powered credit score and unlock 
                intelligent automation for your DeFi portfolio.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
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
            
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="aspect-square rounded-2xl overflow-hidden glass-card p-1"
              >
                <div className="bg-blue-purple-gradient rounded-xl h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl font-bold text-white mb-2">95</div>
                    <div className="text-white/90 text-lg font-medium">Credit Score</div>
                    <div className="w-full h-1 bg-white/20 rounded-full mt-4 mb-2">
                      <div className="h-full w-[95%] bg-white rounded-full"></div>
                    </div>
                    <div className="text-white/70 text-sm">Excellent</div>
                    
                    <div className="mt-8 text-white/80 text-sm">
                      Connect your wallet to view your actual score
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-arthanet-blue/30 rounded-full blur-[20px]"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-arthanet-purple/30 rounded-full blur-[20px]"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
