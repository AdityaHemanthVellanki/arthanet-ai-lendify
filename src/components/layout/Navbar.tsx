import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConnectWalletButton from '@/components/ui/ConnectWalletButton';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Credit Score', path: '/credit-score' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'AI Agents', path: '/ai-agents' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-lg bg-arthanet-charcoal/80 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-gradient-blue-purple">
              ArthaNet
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Connect Wallet Button (Desktop) */}
          <div className="hidden md:block">
            <ConnectWalletButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-card animate-slide-down">
          <nav className="flex flex-col space-y-4 p-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4">
              <ConnectWalletButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
