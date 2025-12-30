import React from 'react';
import { Instagram, Twitter, Facebook, ChevronUp } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';
import { InfoModalType } from './InfoModals';

interface FooterProps {
  onCtaClick: () => void;
  onOpenInfo: (type: InfoModalType) => void;
}

const Footer: React.FC<FooterProps> = ({ onCtaClick, onOpenInfo }) => {
  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/fitlifepro', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/fitlifepro', label: 'Instagram' },
    { icon: Twitter, href: 'https://twitter.com/fitlifepro', label: 'Twitter' },
  ];

  const handleSmoothScroll = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-black border-t border-zinc-900 pt-16 pb-10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            <div className="flex flex-col items-center mb-12">
                <div className="flex space-x-6 mb-8">
                     {socialLinks.map((social, i) => (
                        <RevealOnScroll key={i} variant="zoom" delay={i * 100}>
                            <a 
                              href={social.href} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              aria-label={social.label}
                              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-fuchsia-600 hover:border-fuchsia-600 transition-all duration-300"
                            >
                                <social.icon className="w-4 h-4" />
                            </a>
                        </RevealOnScroll>
                     ))}
                </div>

                <RevealOnScroll variant="up" delay={300} className="space-y-2 mb-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">FITLIFE<span className="text-fuchsia-500">PRO</span></h3>
                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">500 Elite Ave, Miami Beach, FL 33139</p>
                </RevealOnScroll>

                <RevealOnScroll variant="up" delay={400}>
                    <button 
                      onClick={onCtaClick}
                      className="bg-fuchsia-600 text-white px-10 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-fuchsia-500 hover:scale-105 transition-all"
                    >
                        Initiate Strategy
                    </button>
                </RevealOnScroll>
            </div>

            <div className="border-t border-zinc-900 pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex space-x-8 text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">
                    <button onClick={() => onOpenInfo('faq')} className="hover:text-white transition-colors">Intelligence FAQ</button>
                    <button onClick={() => onOpenInfo('privacy')} className="hover:text-white transition-colors">Privacy</button>
                    <button onClick={() => onOpenInfo('terms')} className="hover:text-white transition-colors">Protocols</button>
                </div>
                
                <div className="flex items-center gap-8">
                  <a href="#hero" onClick={(e) => handleSmoothScroll(e, '#hero')} className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center gap-2 group">
                    <ChevronUp className="w-3 h-3 group-hover:-translate-y-1 transition-transform" /> Top
                  </a>
                  <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.4em]">&copy; {new Date().getFullYear()} FITLIFE PRO GLOBAL</p>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;