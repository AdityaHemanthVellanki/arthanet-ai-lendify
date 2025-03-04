
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-arthanet-darkBlue pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <div className="mb-6">
              <span className="text-xl font-bold text-gradient-blue-purple">
                ArthaNet
              </span>
            </div>
            <p className="text-sm text-white/70 mb-6">
              Combining AI and blockchain to build the first AI-powered credit scoring 
              and DeFi automation system.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/credit-score" className="text-sm text-white/70 hover:text-white transition-colors">
                  AI Credit Score
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/ai-agents" className="text-sm text-white/70 hover:text-white transition-colors">
                  AI Agents
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-white/70 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-center items-center">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} ArthaNet. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
