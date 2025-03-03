
import React, { useEffect, useRef } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Brain, TrendingUp, Sparkles } from 'lucide-react';

const Features = () => {
  const cardsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2,
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-scale-in');
          entry.target.classList.remove('opacity-0', 'scale-95');
        }
      });
    }, options);
    
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card) => {
      observer.observe(card);
    });
    
    return () => {
      cards.forEach((card) => {
        observer.unobserve(card);
      });
    };
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-arthanet-blue" />,
      title: "AI-Powered Credit Scores",
      description: "Generate trust-based lending scores using on-chain data, transaction patterns, and DeFi behavior.",
      glow: "blue" as const
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-arthanet-purple" />,
      title: "DeFi Yield Optimization",
      description: "AI-driven strategies for staking, liquidity, and lending to maximize your returns across protocols.",
      glow: "purple" as const
    },
    {
      icon: <Sparkles className="h-8 w-8 text-arthanet-blue" />,
      title: "Automated Portfolio Management",
      description: "Let AI manage your DeFi assets with real-time monitoring and automated rebalancing.",
      glow: "blue" as const
    }
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Key Features
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Our advanced AI technology transforms how you interact with DeFi protocols,
            making financial services more accessible, efficient, and intelligent.
          </p>
        </div>
        
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <GlassCard 
              key={index} 
              className="feature-card opacity-0 scale-95 p-8 hover:translate-y-[-8px] transition-all duration-500 flex flex-col items-center text-center" 
              glow={feature.glow}
            >
              <div className="p-4 glass-card rounded-full mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
      
      {/* Background elements */}
      <div className="absolute top-1/2 left-0 w-1/3 h-1/3 bg-arthanet-blue/5 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-arthanet-purple/5 blur-[100px] rounded-full"></div>
    </section>
  );
};

export default Features;
