
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GlassCard from '@/components/ui/GlassCard';
import ConnectWalletButton from '@/components/ui/ConnectWalletButton';
import { motion } from 'framer-motion';
import { Lock, Wallet, Activity, BarChart3, History, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import walletService, { WalletInfo } from '@/services/walletService';
import creditScoreService, { CreditScoreData } from '@/services/creditScoreService';
import { Button } from '@/components/ui/button';

const CreditScore = () => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const unsubscribe = walletService.subscribe((wallet) => {
      setWalletInfo(wallet);
      
      // Reset credit score when wallet changes
      if (wallet) {
        const cachedScore = creditScoreService.getCachedCreditScore(wallet.address);
        if (cachedScore) {
          setCreditScore(cachedScore);
        } else {
          setCreditScore(null);
        }
      } else {
        setCreditScore(null);
      }
    });

    // Check if wallet is already connected, if so, try to get cached score
    const currentWallet = walletService.getCurrentWallet();
    if (currentWallet) {
      setWalletInfo(currentWallet);
      const cachedScore = creditScoreService.getCachedCreditScore(currentWallet.address);
      if (cachedScore) {
        setCreditScore(cachedScore);
      }
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleGenerateCreditScore = async () => {
    if (!walletInfo) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsGenerating(true);
    try {
      const score = await creditScoreService.generateCreditScore(walletInfo);
      if (score) {
        setCreditScore(score);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInteract = () => {
    toast.info('This feature will be implemented in the next version', {
      description: 'Interactive credit score visualization coming soon'
    });
  };

  // Helper function to determine color based on score
  const getScoreColor = (score: number) => {
    if (score < 600) return 'from-red-500 to-red-600';
    if (score < 700) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  // Helper function to determine width percentage based on score
  const getScorePercentage = (score: number) => {
    return ((score - 500) / 300) * 100; // Scale from 500-800 to 0-100%
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
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-arthanet-purple/20 to-transparent opacity-40 blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="px-4 py-1 glass-card text-xs uppercase tracking-wider font-medium text-arthanet-blue rounded-full inline-block mb-6"
              >
                AI-Powered DeFi Trust
              </motion.span>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-6 text-white"
              >
                Your AI-Powered DeFi Credit Score
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg text-white/70 mb-10"
              >
                ArthaNet analyzes your on-chain activity to generate a comprehensive 
                credit score, enabling better lending terms and unlocking DeFi opportunities.
              </motion.p>
            </div>
          </div>
        </section>
        
        {/* Credit Score Display Section */}
        <section className="py-16 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <GlassCard className="p-12" glow="blue">
                  <div className="flex flex-col items-center">
                    <div className="mb-8 relative">
                      <div className="w-40 h-40 rounded-full bg-gradient-radial from-arthanet-blue/20 to-transparent flex items-center justify-center">
                        {creditScore ? (
                          <div className="w-32 h-32 rounded-full glass-card border border-arthanet-blue/30 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-white">{creditScore.score}</div>
                              <div className={`text-sm mt-1 ${
                                creditScore.riskLevel === 'Low' 
                                  ? 'text-green-400' 
                                  : creditScore.riskLevel === 'Medium' 
                                    ? 'text-yellow-400' 
                                    : 'text-red-400'
                              }`}>
                                {creditScore.riskLevel} Risk
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-full glass-card border border-arthanet-blue/30 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-6xl font-bold text-white">?</div>
                              <div className="text-arthanet-blue text-sm mt-1">
                                {walletInfo ? 'Generate Score' : 'Connect Wallet'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-transparent border-t-arthanet-blue opacity-30 animate-spin" style={{ animationDuration: '3s' }}></div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-6">Your DeFi Credit Score</h3>
                    
                    <div className="w-full max-w-xs mb-8">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        {creditScore ? (
                          <div 
                            className={`h-full bg-gradient-to-r ${getScoreColor(creditScore.score)} rounded-full transition-all duration-1000`} 
                            style={{ width: `${getScorePercentage(creditScore.score)}%` }}
                          ></div>
                        ) : (
                          <div className="h-full w-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all duration-1000"></div>
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-white/50">
                        <span>High Risk</span>
                        <span>Low Risk</span>
                      </div>
                    </div>
                    
                    {walletInfo ? (
                      <Button
                        onClick={handleGenerateCreditScore}
                        disabled={isGenerating}
                        className="bg-blue-purple-gradient hover:opacity-90 transition-all duration-300 text-white font-medium rounded-lg px-6 h-11"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing Data...
                          </>
                        ) : creditScore ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh Score
                          </>
                        ) : (
                          <>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Generate Credit Score
                          </>
                        )}
                      </Button>
                    ) : (
                      <ConnectWalletButton />
                    )}
                    
                    {creditScore && (
                      <div className="mt-6 text-center text-xs text-white/50">
                        Last updated: {creditScore.lastUpdated.toLocaleString()}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <h3 className="text-2xl font-semibold text-white mb-6">What Makes Up Your Score</h3>
                
                <div className="space-y-4">
                  {[
                    { 
                      icon: <Wallet className="h-5 w-5 text-arthanet-blue" />, 
                      title: "Wallet Age & Activity", 
                      description: "Longer history and consistent activity strengthen your score" 
                    },
                    { 
                      icon: <Activity className="h-5 w-5 text-arthanet-purple" />, 
                      title: "Transaction Patterns", 
                      description: "Stable transaction behavior indicates reliability" 
                    },
                    { 
                      icon: <BarChart3 className="h-5 w-5 text-arthanet-blue" />, 
                      title: "DeFi Engagement", 
                      description: "Active participation in lending, staking and governance" 
                    },
                    { 
                      icon: <History className="h-5 w-5 text-arthanet-purple" />, 
                      title: "Loan Repayment History", 
                      description: "Timely repayments on previous DeFi loans" 
                    },
                    { 
                      icon: <Lock className="h-5 w-5 text-arthanet-blue" />, 
                      title: "Risk Profile", 
                      description: "Balanced risk-taking in your DeFi activities" 
                    }
                  ].map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-start p-4 glass-card rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={handleInteract}
                    >
                      <div className="p-2 glass-card rounded-full mr-4">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">{item.title}</h4>
                        <p className="text-white/60 text-sm">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Score Factors Section - Only visible when credit score is generated */}
        {creditScore && (
          <section className="py-16 bg-arthanet-darkBlue">
            <div className="container mx-auto px-4 md:px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-10 text-center">Your Score Factors</h2>
                
                <div className="space-y-6">
                  {creditScore.factors.map((factor, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="glass-card p-6"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-white">{factor.category}</h3>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          factor.impact === 'positive' 
                            ? 'bg-green-500/20 text-green-400' 
                            : factor.impact === 'negative' 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-white/10 text-white/70'
                        }`}>
                          {factor.impact === 'positive' ? 'Positive' : factor.impact === 'negative' ? 'Negative' : 'Neutral'}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-white/50">Score Impact</span>
                          <span className="text-xs font-medium text-white">{factor.score}/100</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              factor.impact === 'positive' 
                                ? 'bg-green-500' 
                                : factor.impact === 'negative' 
                                  ? 'bg-red-500' 
                                  : 'bg-white/30'
                            }`} 
                            style={{ width: `${factor.score}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-white/70">{factor.description}</p>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-12 p-6 glass-card">
                  <h3 className="text-xl font-semibold text-white mb-4">Recommendations to Improve Your Score</h3>
                  <ul className="space-y-3">
                    {creditScore.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <ArrowRight className="h-4 w-4 text-arthanet-blue mt-1 mr-2 flex-shrink-0" />
                        <span className="text-white/70">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Benefits Section */}
        <section className="py-20 bg-arthanet-darkBlue">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Benefits of Your AI Credit Score
              </h2>
              <p className="text-white/70">
                Your decentralized credit score unlocks numerous advantages in the DeFi ecosystem,
                making financial services more accessible and personalized.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "Better Loan Terms",
                  description: "Qualify for lower interest rates and higher loan-to-value ratios based on your score"
                },
                {
                  title: "Access to Undercollateralized Loans",
                  description: "Trusted users can access loans with less collateral, improving capital efficiency"
                },
                {
                  title: "Personalized DeFi Recommendations",
                  description: "Receive AI-driven suggestions tailored to your risk profile and financial goals"
                }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="h-full p-8">
                    <div className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-purple-gradient mb-6">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4">{benefit.title}</h3>
                    <p className="text-white/70">{benefit.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <GlassCard className="p-12 text-center max-w-4xl mx-auto" glow="purple">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to discover your DeFi credit score?
              </h2>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Connect your wallet to get your AI-generated score and unlock 
                personalized DeFi opportunities tailored to your on-chain profile.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                {!walletInfo ? (
                  <ConnectWalletButton />
                ) : !creditScore ? (
                  <Button
                    onClick={handleGenerateCreditScore}
                    disabled={isGenerating}
                    className="bg-blue-purple-gradient hover:opacity-90 transition-all duration-300 text-white font-medium rounded-lg px-6 h-11"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Data...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Generate Credit Score
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerateCreditScore}
                    disabled={isGenerating}
                    className="bg-blue-purple-gradient hover:opacity-90 transition-all duration-300 text-white font-medium rounded-lg px-6 h-11"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Score
                  </Button>
                )}
                <a 
                  href="/how-it-works" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 text-white font-medium"
                >
                  Learn How It Works
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

export default CreditScore;
