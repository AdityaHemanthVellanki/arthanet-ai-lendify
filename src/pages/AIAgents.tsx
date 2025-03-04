
import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Link, Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GlassCard from '@/components/ui/GlassCard';
import ConnectWalletButton from '@/components/ui/ConnectWalletButton';
import { motion } from 'framer-motion';
import { Bot, Brain, TrendingUp, GitBranch, Maximize, ArrowRight, Play, Info, Link as LinkIcon, Shield } from 'lucide-react';
import { toast } from 'sonner';
import walletService from '@/services/walletService';
import AgentDashboard from '@/components/ai-agents/AgentDashboard';
import { AgentType } from '@/services/aiAgentService';
import { Button } from '@/components/ui/button';

// Define the main AI Agents page
const AgentsHome = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const unsubscribe = walletService.subscribe((wallet) => {
      setIsWalletConnected(!!wallet);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const agents = [
    {
      id: 'auto-lender',
      icon: <TrendingUp className="h-6 w-6 text-arthanet-blue" />,
      name: 'AI Auto-Lender',
      description: 'Automatically finds the best lending rates across multiple DeFi protocols and dynamically adjusts collateral based on market conditions.',
      capabilities: [
        'Real-time APY comparison across lending platforms',
        'Automatic collateral optimization to prevent liquidations',
        'Gas-efficient transaction routing for lending operations'
      ],
      platforms: ['Aave', 'Compound', 'Morpho', 'Venus'],
      glow: 'blue' as const
    },
    {
      id: 'yield-farmer',
      icon: <Brain className="h-6 w-6 text-arthanet-purple" />,
      name: 'Smart Yield Farmer',
      description: 'Optimizes yield farming strategies by automatically staking and providing liquidity to the most profitable pools based on risk assessment.',
      capabilities: [
        'Risk-adjusted yield optimization across protocols',
        'Impermanent loss protection strategies',
        'Auto-compounding of rewards for maximum APY'
      ],
      platforms: ['Lido', 'Uniswap', 'Curve', 'Balancer'],
      glow: 'purple' as const
    },
    {
      id: 'risk-analyzer',
      icon: <Shield className="h-6 w-6 text-arthanet-blue" />,
      name: 'Risk Analyzer',
      description: 'Continuously monitors your DeFi positions to predict potential liquidations and proactively rebalances your portfolio to minimize risk.',
      capabilities: [
        'AI-driven liquidation risk prediction',
        'Automated position rebalancing for risk mitigation',
        'Market volatility analysis and alerts'
      ],
      platforms: ['The Graph', 'Dune Analytics', 'Chain Analysis'],
      glow: 'blue' as const
    },
    {
      id: 'portfolio-manager',
      icon: <Maximize className="h-6 w-6 text-arthanet-purple" />,
      name: 'Portfolio Manager',
      description: 'Holistic management of your entire DeFi portfolio with AI-driven insights, automated rebalancing, and comprehensive performance tracking.',
      capabilities: [
        'Automated diversification based on risk tolerance',
        'Performance analytics against benchmarks',
        'Tax-efficient transaction suggestions'
      ],
      platforms: ['Multiple DeFi protocols', 'Cross-chain assets'],
      glow: 'purple' as const
    }
  ];

  const handleAgentInteraction = (agentId: string) => {
    if (!isWalletConnected) {
      toast.info('Please connect your wallet to interact with AI agents');
      return;
    }

    navigate(`/ai-agents/${agentId}`);
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
                Intelligent DeFi Automation
              </motion.span>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-6 text-white"
              >
                Web3 AI Agents
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg text-white/70 mb-10"
              >
                ArthaNet's AI agents work tirelessly to optimize your DeFi positions, 
                maximize yields, and minimize risks across multiple protocols.
              </motion.p>

              {!isWalletConnected && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <ConnectWalletButton />
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* AI Agents Section */}
        <section className="py-16 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="h-full"
                >
                  <GlassCard className="h-full p-8" glow={agent.glow}>
                    <div className="flex items-center mb-6">
                      <div className="p-3 glass-card rounded-full mr-4">
                        {agent.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                    </div>
                    
                    <p className="text-white/70 mb-6">{agent.description}</p>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-white mb-3">Capabilities:</h4>
                      <ul className="space-y-2">
                        {agent.capabilities.map((capability, i) => (
                          <li key={i} className="flex items-start">
                            <GitBranch className="h-4 w-4 text-arthanet-blue mr-2 mt-1 flex-shrink-0" />
                            <span className="text-sm text-white/70">{capability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-white mb-2">Integrated Platforms:</h4>
                      <div className="flex flex-wrap gap-2">
                        {agent.platforms.map((platform, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1 rounded-full glass-card text-xs text-white/70"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-auto flex justify-between">
                      <Button
                        onClick={() => handleAgentInteraction(agent.id)}
                        className="flex items-center text-white bg-blue-purple-gradient hover:opacity-90"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {isWalletConnected ? 'Launch Agent' : 'Connect Wallet'}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={() => toast.info('Documentation will be available soon')}
                        className="flex items-center text-white/50 hover:text-white transition-colors"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Learn More
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 bg-arthanet-darkBlue">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                How AI Agents Work
              </h2>
              <p className="text-white/70">
                ArthaNet's AI agents leverage on-chain data, machine learning models, and advanced algorithms
                to automate and optimize your DeFi activities across multiple protocols.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Connector Line */}
                <div className="absolute left-[28px] top-10 bottom-10 w-1 bg-gradient-to-b from-arthanet-blue to-arthanet-purple"></div>
                
                {/* Steps */}
                {[
                  {
                    title: "Wallet Connection & Data Analysis",
                    description: "AI agents securely access your wallet data and analyze your transaction history, assets, and DeFi positions.",
                    icon: <LinkIcon className="h-5 w-5 text-white" />
                  },
                  {
                    title: "Market Condition Monitoring",
                    description: "Continuous monitoring of market conditions, protocol APYs, gas fees, and risk parameters across the DeFi ecosystem.",
                    icon: <TrendingUp className="h-5 w-5 text-white" />
                  },
                  {
                    title: "AI-Powered Decision Making",
                    description: "Neural networks process market data and your portfolio to generate optimal strategies based on your risk profile.",
                    icon: <Brain className="h-5 w-5 text-white" />
                  },
                  {
                    title: "Automated Execution",
                    description: "Smart contracts execute the AI-recommended strategies with optimal gas timing and slippage protection.",
                    icon: <Bot className="h-5 w-5 text-white" />
                  }
                ].map((step, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex mb-10 last:mb-0"
                  >
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-arthanet-blue to-arthanet-purple flex items-center justify-center">
                        {step.icon}
                      </div>
                    </div>
                    <div className="ml-6 glass-card p-6 flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-white/70">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <GlassCard className="p-12 text-center max-w-4xl mx-auto" glow="purple">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to automate your DeFi strategy?
              </h2>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Connect your wallet to access ArthaNet's AI agents and experience the future 
                of intelligent DeFi automation. Get started today with our beta release.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                {!isWalletConnected ? (
                  <ConnectWalletButton />
                ) : (
                  <Button
                    onClick={() => handleAgentInteraction('auto-lender')}
                    className="inline-flex items-center bg-blue-purple-gradient hover:opacity-90 transition-all duration-300 text-white font-medium rounded-lg px-6 py-3"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Deploy AI Agent
                  </Button>
                )}
                <Link 
                  to="/how-it-works" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 text-white font-medium"
                >
                  Learn How It Works
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

// Agent Detail Pages
const AutoLenderAgent = () => {
  return (
    <div className="bg-arthanet-charcoal min-h-screen">
      <Navbar />
      <AgentDashboard 
        agentType="auto-lender"
        agentName="AI Auto-Lender"
        agentDescription="Optimizes lending positions across DeFi protocols for maximum APY with minimal risk"
        icon={<TrendingUp className="h-6 w-6 text-arthanet-blue" />}
      />
      <Footer />
    </div>
  );
};

const YieldFarmerAgent = () => {
  return (
    <div className="bg-arthanet-charcoal min-h-screen">
      <Navbar />
      <AgentDashboard 
        agentType="yield-farmer"
        agentName="Smart Yield Farmer"
        agentDescription="Maximizes yield farming returns with intelligent strategy allocation"
        icon={<Brain className="h-6 w-6 text-arthanet-purple" />}
      />
      <Footer />
    </div>
  );
};

const RiskAnalyzerAgent = () => {
  return (
    <div className="bg-arthanet-charcoal min-h-screen">
      <Navbar />
      <AgentDashboard 
        agentType="risk-analyzer"
        agentName="Risk Analyzer"
        agentDescription="Continuously monitors your positions to prevent liquidations and reduce risk"
        icon={<Shield className="h-6 w-6 text-arthanet-blue" />}
      />
      <Footer />
    </div>
  );
};

const PortfolioManagerAgent = () => {
  return (
    <div className="bg-arthanet-charcoal min-h-screen">
      <Navbar />
      <AgentDashboard 
        agentType="portfolio-manager"
        agentName="Portfolio Manager"
        agentDescription="Holistic portfolio management across all your DeFi positions"
        icon={<Maximize className="h-6 w-6 text-arthanet-purple" />}
      />
      <Footer />
    </div>
  );
};

// Main AI Agents component with routing
const AIAgents = () => {
  return (
    <Routes>
      <Route index element={<AgentsHome />} />
      <Route path="auto-lender" element={<AutoLenderAgent />} />
      <Route path="yield-farmer" element={<YieldFarmerAgent />} />
      <Route path="risk-analyzer" element={<RiskAnalyzerAgent />} />
      <Route path="portfolio-manager" element={<PortfolioManagerAgent />} />
    </Routes>
  );
};

export default AIAgents;
