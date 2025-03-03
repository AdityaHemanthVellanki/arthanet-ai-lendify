
import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, MessageSquare, ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-arthanet-darkBlue pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
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
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-arthanet-blue transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white/70 hover:text-arthanet-blue transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-white/70 hover:text-arthanet-blue transition-colors">
                <MessageSquare size={20} />
              </a>
            </div>
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

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-white/70 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-white/70 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Subscribe */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Stay Updated</h4>
            <p className="text-sm text-white/70 mb-4">
              Subscribe to our newsletter for the latest updates
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 bg-arthanet-gray text-white rounded-l-lg outline-none border border-white/10 flex-1"
              />
              <button className="bg-arthanet-blue px-3 rounded-r-lg hover:bg-opacity-90 transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} ArthaNet. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-white/60 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
