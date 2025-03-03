
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GlassCard from '@/components/ui/GlassCard';
import ConnectWalletButton from '@/components/ui/ConnectWalletButton';
import { motion } from 'framer-motion';
import { Wallet, Database, Cpu, Brain, BarChart3, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const HowItWorks = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: <Wallet className="h-8 w-8 text-white" />,
      title: "Connect Your Wallet",
      description: "Connect your Web3 wallet to allow the AI to analyze your on-chain data securely.",
      color: "blue"
    },
    {
      icon: <Database className="h-8 w-8 text-white" />,
      title: "Scan On-Chain Data",
      description: "Our system analyzes your transaction history, DeFi interactions, and blockchain activity.",
      color: "purple"
    },
    {
      icon: <Cpu className="h-8 w-8 text-white" />,
      title: "AI Analysis",
      description: "Advanced AI models process your data to identify patterns and assess financial behavior.",
      color: "blue"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-white" />,
      title: "Generate Credit Score",
      description: "A comprehensive DeFi credit score is generated based on your blockchain activity.",
      color: "purple"
    },
    {
      icon: <Brain className="h-8 w-8 text-white" />,
      title: "AI Recommendations",
      description: "Receive personalized recommendations for DeFi platforms, yields, and risk management.",
      color: "blue"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [steps.length]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    toast.info(`Step ${index + 1}: ${steps[index].title}`, {
      description: steps[index].description
    });
  };

  return (
    <div className="bg-arthanet-charcoal min-h-screen">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden -z-10">
            {/* Radial gradient in the center */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-arthanet-blue/20 to-transparent opacity-40 blur-3xl" />
            
            {/* Purple gradient ellipse */}
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-arthanet-purple/20 to-transparent opacity-40 blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="px-4 py-1 glass-card text-xs uppercase tracking-wider font-medium text-arthanet-blue rounded-full inline-block mb-6"
              >
                The Process
              </motion.span>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-6 text-white"
              >
                How ArthaNet Works
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg text-white/70 mb-10"
              >
                Discover how our AI technology analyzes on-chain data to create 
                personalized credit scores and automate your DeFi experience.
              </motion.p>
            </div>
          </div>
        </section>
        
        {/* Steps Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold text-white mb-8">
                  The ArthaNet Process
                </h2>
                
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`flex items-start p-4 glass-card rounded-lg cursor-pointer transition-all duration-300 ${
                        activeStep === index 
                          ? `border border-arthanet-${step.color} glow-${step.color}` 
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => handleStepClick(index)}
                    >
                      <div className={`relative p-3 mr-4 rounded-full bg-arthanet-${step.color}/20 border border-arthanet-${step.color}/30`}>
                        {step.icon}
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-arthanet-charcoal flex items-center justify-center text-xs font-medium border border-white/10">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                        <p className="text-white/60 text-sm">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="relative rounded-xl overflow-hidden aspect-square max-w-md mx-auto"
                >
                  <GlassCard className="h-full p-8 flex items-center justify-center" glow={steps[activeStep].color as "blue" | "purple"}>
                    <div className="relative w-full h-full">
                      {/* Interactive visualization based on active step */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {activeStep === 0 && (
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-arthanet-blue/20 flex items-center justify-center">
                              <Wallet size={36} className="text-arthanet-blue" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Connect Wallet</h3>
                            <p className="text-white/70 text-sm">Securely connect your Web3 wallet to begin</p>
                          </div>
                        )}
                        
                        {activeStep === 1 && (
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-arthanet-purple/20 flex items-center justify-center">
                              <Database size={36} className="text-arthanet-purple" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Analyzing Data</h3>
                            <div className="flex justify-center space-x-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-arthanet-purple animate-pulse" style={{ animationDelay: '0s' }}></div>
                              <div className="w-2 h-2 rounded-full bg-arthanet-purple animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 rounded-full bg-arthanet-purple animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <p className="text-white/70 text-sm">Scanning your on-chain transaction history</p>
                          </div>
                        )}
                        
                        {activeStep === 2 && (
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-arthanet-blue/20 flex items-center justify-center">
                              <Cpu size={36} className="text-arthanet-blue" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">AI Processing</h3>
                            <div className="w-36 h-3 mx-auto bg-white/10 rounded-full mb-2 overflow-hidden">
                              <div className="h-full w-2/3 bg-arthanet-blue rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-white/70 text-sm">Machine learning models analyzing patterns</p>
                          </div>
                        )}
                        
                        {activeStep === 3 && (
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-arthanet-purple/20 flex items-center justify-center">
                              <BarChart3 size={36} className="text-arthanet-purple" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Credit Score Generated</h3>
                            <div className="text-3xl font-bold text-white mb-2">
                              <span className="text-arthanet-purple">85</span><span className="text-sm">/100</span>
                            </div>
                            <p className="text-white/70 text-sm">Your decentralized credit score is ready</p>
                          </div>
                        )}
                        
                        {activeStep === 4 && (
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-arthanet-blue/20 flex items-center justify-center">
                              <Brain size={36} className="text-arthanet-blue" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">AI Recommendations</h3>
                            <div className="space-y-2 text-left">
                              <div className="glass-card py-1 px-2 rounded text-xs text-white/90">
                                <span className="inline-block w-2 h-2 mr-1 rounded-full bg-green-400"></span>
                                Increase Aave deposits for better score
                              </div>
                              <div className="glass-card py-1 px-2 rounded text-xs text-white/90">
                                <span className="inline-block w-2 h-2 mr-1 rounded-full bg-yellow-400"></span>
                                Optimize collateral ratio on Compound
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
                
                {/* Background elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-arthanet-blue/30 rounded-full blur-md"></div>
                <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-arthanet-purple/30 rounded-full blur-md"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Technology Section */}
        <section className="py-20 bg-arthanet-darkBlue">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Our Technology Stack
              </h2>
              <p className="text-white/70">
                ArthaNet leverages cutting-edge technologies to deliver a seamless, 
                secure, and intelligent DeFi experience.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "AI & Machine Learning",
                  description: "Advanced neural networks analyze patterns in on-chain data to generate accurate credit scores and predictions"
                },
                {
                  title: "Blockchain Integration",
                  description: "Seamless connection with major blockchain networks including Ethereum, Solana, Polygon, and Arbitrum"
                },
                {
                  title: "DeFi Protocol Connectivity",
                  description: "Direct integration with leading DeFi platforms like Aave, Compound, Uniswap, and Curve"
                },
                {
                  title: "Zero-Knowledge Proofs",
                  description: "Preserve privacy while proving creditworthiness through zk-SNARKs technology"
                },
                {
                  title: "Smart Contract Automation",
                  description: "Automated execution of financial transactions based on AI-driven decisions"
                },
                {
                  title: "Cross-Chain Interoperability",
                  description: "Seamless analysis and management of assets across multiple blockchain networks"
                }
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="h-full p-8">
                    <h3 className="text-xl font-semibold text-white mb-4">{tech.title}</h3>
                    <p className="text-white/70">{tech.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <GlassCard className="p-12 text-center max-w-4xl mx-auto" glow="blue">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to experience AI-powered DeFi?
              </h2>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Connect your wallet to start your journey with ArthaNet and discover 
                how AI can transform your DeFi experience.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <ConnectWalletButton />
                <a 
                  href="/credit-score" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 text-white font-medium"
                >
                  View Credit Score
                  <ArrowRight size={16} className="ml-2" />
                </a>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HowItWorks;
