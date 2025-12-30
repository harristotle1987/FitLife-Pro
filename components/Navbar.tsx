
import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogIn, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface NavbarProps {
  onCtaClick: () => void;
  onLoginMember: () => void;
  user: UserProfile | null;
}

const Navbar: React.FC<NavbarProps> = ({ onCtaClick, onLoginMember, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Philosophy', id: '#philosophy' },
    { name: 'Protocols', id: '#plans' },
    { name: 'Facilities', id: '#facilities' },
    { name: 'Squad', id: '#team' },
  ];

  const handleScroll = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-black/95 backdrop-blur-xl border-b border-white/5 py-3 shadow-2xl' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        
        {/* Brand Logo */}
        <a href="#hero" onClick={(e) => handleScroll(e, '#hero')} className="flex items-center space-x-2 group shrink-0">
          <div className="border-2 border-white p-1 rounded-sm group-hover:border-fuchsia-500 transition-colors">
             <span className="text-xl font-black tracking-tighter text-white italic">FP</span>
          </div>
          <span className="text-lg font-black tracking-tight text-white uppercase italic hidden sm:inline">FITLIFE<span className="text-fuchsia-500">PRO</span></span>
        </a>

        {/* Desktop & Tablet Navigation (md and up) */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-4 lg:space-x-6">
            {navLinks.map((link) => (
              <a 
                key={link.id} 
                href={link.id} 
                onClick={(e) => handleScroll(e, link.id)}
                className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-6 pl-6 border-l border-zinc-900">
            {/* Member Portal Entry */}
            <button 
              onClick={onLoginMember}
              className="flex items-center space-x-2 text-zinc-500 hover:text-white transition-all group"
            >
              <div className={`p-1.5 rounded-full border border-zinc-800 group-hover:border-fuchsia-500 transition-colors ${user ? 'bg-fuchsia-600/10 border-fuchsia-500 text-fuchsia-500' : ''}`}>
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[9px] font-black uppercase tracking-widest">{user ? 'Dashboard' : 'Sign In'}</span>
                <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tight group-hover:text-zinc-400">Member Portal</span>
              </div>
            </button>

            <button onClick={onCtaClick} className="bg-white text-black px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl">
              Free Pass
            </button>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="md:hidden flex items-center gap-4">
           <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
             {isOpen ? <X className="h-7 w-7 text-fuchsia-500" /> : <Menu className="h-7 w-7" />}
           </button>
        </div>
      </div>

      {/* Mobile Sidebar Dropdown */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black z-[110] flex flex-col p-8 animate-fade-in">
           <div className="flex justify-between items-center mb-12">
              <span className="text-xl font-black italic tracking-tighter text-white">FITLIFE<span className="text-fuchsia-500">PRO</span></span>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500"><X className="w-8 h-8" /></button>
           </div>
           
           <div className="flex flex-col space-y-8">
              {navLinks.map((link) => (
                <a 
                  key={link.id} 
                  href={link.id} 
                  onClick={(e) => handleScroll(e, link.id)}
                  className="text-4xl font-black uppercase italic tracking-tighter text-zinc-800 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px w-full bg-zinc-900 my-4"></div>
              <button onClick={onLoginMember} className="text-2xl font-black uppercase italic tracking-tighter text-fuchsia-500 text-left flex items-center gap-3">
                <LogIn className="w-6 h-6" /> {user ? 'Your Dashboard' : 'Member Login'}
              </button>
           </div>

           <button 
             onClick={() => { setIsOpen(false); onCtaClick(); }}
             className="mt-auto bg-fuchsia-600 text-white py-5 rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2"
           >
             Get Your Free Pass <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
