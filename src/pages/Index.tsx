
import React, { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import CTA from '@/components/home/CTA';
import { motion } from 'framer-motion';
import { Cpu, Shield, Network, Zap } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const technologies = [
    { name: 'AI Models', icon: <Cpu size={24} className="text-arthanet-blue" /> },
    { name: 'Blockchain Security', icon: <Shield size={24} className="text-arthanet-purple" /> },
    { name: 'Cross-Chain Integration', icon: <Network size={24} className="text-arthanet-blue" /> },
    { name: 'Lightning Fast', icon: <Zap size={24} className="text-arthanet-purple" /> },
  ];

  return (
    <div className="bg-arthanet-charcoal min-h-screen">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Logos section */}
        <section className="py-16 border-y border-white/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <p className="text-white/50 text-sm uppercase tracking-wider">Powered by Advanced Technology</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {technologies.map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-2"
                >
                  <div className="p-2 glass-card rounded-full">
                    {tech.icon}
                  </div>
                  <span className="text-white/70">{tech.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        <Features />
        
        {/* Blockchain integration section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-arthanet-darkBlue/50"></div>
          
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <span className="px-4 py-1 glass-card text-xs uppercase tracking-wider font-medium text-arthanet-purple rounded-full inline-block mb-6">
                    Seamless Web3 Integration
                  </span>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Intelligent DeFi Protocols Working for You
                  </h2>
                  
                  <p className="text-white/70 mb-8">
                    Our AI-driven platform seamlessly integrates with major DeFi protocols 
                    to analyze behavior, optimize yields, and automate complex financial 
                    decisions across the blockchain ecosystem.
                  </p>
                  
                  <ul className="space-y-4 mb-8">
                    {[
                      "Credit score generation from on-chain activity",
                      "Automated yield optimization across protocols",
                      "Real-time risk assessment and management",
                      "Cross-chain portfolio rebalancing"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="p-1 rounded-full bg-arthanet-blue/20 mr-3 mt-1">
                          <div className="w-2 h-2 rounded-full bg-arthanet-blue"></div>
                        </div>
                        <span className="text-white/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-square max-w-md mx-auto relative">
                  {/* Grid pattern */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]"></div>
                  </div>
                  
                  {/* Network nodes */}
                  <div className="absolute left-1/4 top-1/4 w-12 h-12 rounded-full bg-arthanet-blue/20 backdrop-blur-md border border-arthanet-blue/30 flex items-center justify-center animate-pulse-glow">
                    <Cpu size={20} className="text-arthanet-blue" />
                  </div>
                  
                  <div className="absolute right-1/4 top-1/3 w-12 h-12 rounded-full bg-arthanet-purple/20 backdrop-blur-md border border-arthanet-purple/30 flex items-center justify-center animate-pulse-glow" style={{ animationDelay: '0.5s' }}>
                    <Shield size={20} className="text-arthanet-purple" />
                  </div>
                  
                  <div className="absolute left-1/3 bottom-1/4 w-12 h-12 rounded-full bg-arthanet-blue/20 backdrop-blur-md border border-arthanet-blue/30 flex items-center justify-center animate-pulse-glow" style={{ animationDelay: '1s' }}>
                    <Network size={20} className="text-arthanet-blue" />
                  </div>
                  
                  <div className="absolute right-1/3 bottom-1/3 w-12 h-12 rounded-full bg-arthanet-purple/20 backdrop-blur-md border border-arthanet-purple/30 flex items-center justify-center animate-pulse-glow" style={{ animationDelay: '1.5s' }}>
                    <Zap size={20} className="text-arthanet-purple" />
                  </div>
                  
                  {/* Connection lines, using SVG for better control */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path d="M120,120 L240,130" stroke="url(#blue-gradient)" strokeWidth="1" />
                    <path d="M120,120 L140,240" stroke="url(#blue-gradient)" strokeWidth="1" />
                    <path d="M240,130 L220,220" stroke="url(#purple-gradient)" strokeWidth="1" />
                    <path d="M140,240 L220,220" stroke="url(#blue-purple-gradient)" strokeWidth="1" />
                    
                    <defs>
                      <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00A3FF" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#00A3FF" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#A259FF" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#A259FF" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="blue-purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00A3FF" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#A259FF" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center circle */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-blue-purple-gradient opacity-80 flex items-center justify-center">
                    <div className="text-white font-bold">ArthaNet</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        <CTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
