
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogIn, ChevronRight, PlayCircle, Target, ShieldCheck, Zap, Star, CheckCircle, Check, ArrowRight, Crown, Loader2, MessageCircle, Instagram, Twitter, Facebook, ChevronUp, Shield, FileText, HelpCircle, Lock, Mail, UserPlus, Droplet, Award, MapPin } from 'lucide-react';

// Fix imports to reference correct modules
import { api } from './api.ts';
import * as assets from './assets.ts';
import { TRAINING_PLANS } from './constants.ts';
import { UserProfile, Lead, TrainingPlan } from './types.ts';

// --- SHARED UI HELPERS ---
export const RevealOnScroll: React.FC<{children: React.ReactNode, delay?: number, variant?: string, className?: string}> = ({ children, delay = 0, variant = 'up', className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.unobserve(e.target); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>{children}</div>;
};

// --- NAVIGATION & LAYOUT ---
export const Navbar: React.FC<{onCtaClick: () => void, onLoginMember: () => void, user: UserProfile | null}> = ({ onCtaClick, onLoginMember, user }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handle); return () => window.removeEventListener('scroll', handle);
  }, []);
  return (
    <nav className={`fixed top-0 w-full z-[100] transition-all ${scrolled ? 'bg-black/95 backdrop-blur-xl py-3 border-b border-white/5' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2"><div className="border-2 border-white p-1 rounded-sm"><span className="text-xl font-black italic">FP</span></div><span className="text-lg font-black uppercase italic">FITLIFE<span className="text-fuchsia-500">PRO</span></span></div>
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={onLoginMember} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"><User className="w-4 h-4" /> {user ? 'Vault' : 'Sign In'}</button>
          <button onClick={onCtaClick} className="bg-white text-black px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest">Free Pass</button>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white"><Menu /></button>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black z-[110] p-8 flex flex-col">
        <button onClick={() => setIsOpen(false)} className="self-end mb-12"><X /></button>
        <button onClick={onLoginMember} className="text-4xl font-black uppercase italic mb-8">Member Vault</button>
        <button onClick={onCtaClick} className="mt-auto bg-fuchsia-600 py-5 rounded-full font-black uppercase tracking-widest">Get Your Pass</button>
      </div>}
    </nav>
  );
};

// --- LANDING SECTIONS ---
export const Hero: React.FC<{onCtaClick: () => void}> = ({ onCtaClick }) => (
  <section className="relative min-h-screen flex items-center bg-black overflow-hidden px-8">
    <div className="absolute inset-0 opacity-40"><img src={assets.hero_bg} className="w-full h-full object-cover" /></div>
    <div className="relative z-10 max-w-4xl">
      <p className="text-fuchsia-500 font-mono text-[10px] tracking-[0.4em] uppercase mb-4">[ SYSTEM STATUS: ARMED ]</p>
      <h1 className="text-6xl md:text-8xl font-black text-white italic leading-none tracking-tighter uppercase mb-8">RE-ENGINEER YOUR <br/> HUMAN ARCHITECTURE.</h1>
      <button onClick={onCtaClick} className="bg-fuchsia-600 px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-fuchsia-500 transition-all shadow-[0_0_50px_rgba(192,38,211,0.4)]">Initiate Protocol</button>
    </div>
  </section>
);

export const About = () => (
  <section className="py-24 bg-black px-8">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <RevealOnScroll variant="left">
        <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-8">BUILT FOR THE <span className="text-fuchsia-500">RELENTLESS.</span></h2>
        <p className="text-zinc-400 text-lg leading-relaxed mb-8">I don't train hobbies. I train lifestyles. My methodology integrates hypertrophy, recovery, and precision nutrition into one cohesive framework.</p>
        <div className="grid grid-cols-3 gap-4">
          {[Target, ShieldCheck, Zap].map((Icon, i) => <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center"><Icon className="text-white" /></div>)}
        </div>
      </RevealOnScroll>
      <div className="relative h-[500px] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800"><img src={assets.about_main} className="w-full h-full object-cover grayscale" /></div>
    </div>
  </section>
);

export const Services: React.FC<{plans: TrainingPlan[], onSelect: (n: string) => void}> = ({ plans, onSelect }) => (
  <section className="py-24 bg-zinc-950 px-8">
    <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map(p => (
        <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-fuchsia-600 transition-all flex flex-col">
          <h3 className="text-2xl font-black text-white uppercase italic mb-4">{p.name}</h3>
          <p className="text-zinc-400 text-sm mb-6 flex-1">{p.description}</p>
          <div className="text-3xl font-black text-white mb-6">${p.price}<span className="text-xs text-zinc-500"> / protocol</span></div>
          <button onClick={() => onSelect(p.name)} className="bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">Join Now</button>
        </div>
      ))}
    </div>
  </section>
);

export const LeadForm: React.FC<{source: string, prefilled: string}> = ({ source, prefilled }) => {
  const [data, setData] = useState({ name: '', email: '', phone: '', goal: prefilled });
  const [sent, setSent] = useState(false);
  const submit = async (e: any) => { e.preventDefault(); await api.submitLead({...data, source: source as any}); setSent(true); };
  if (sent) return <div className="p-12 text-center bg-fuchsia-600/10 rounded-3xl border border-fuchsia-500"><CheckCircle className="mx-auto mb-4 text-fuchsia-500 w-12 h-12" /><h3 className="text-2xl font-black italic">PROTOCOL INITIATED</h3></div>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <input required placeholder="Name" className="w-full bg-black border border-zinc-800 p-4 rounded-xl" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
      <input required type="email" placeholder="Email" className="w-full bg-black border border-zinc-800 p-4 rounded-xl" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
      <textarea required placeholder="Goal" className="w-full bg-black border border-zinc-800 p-4 rounded-xl h-32" value={data.goal} onChange={e => setData({...data, goal: e.target.value})} />
      <button className="w-full bg-fuchsia-600 py-4 rounded-xl font-black uppercase tracking-widest">Request Strategy Call</button>
    </form>
  );
};

export const Footer = () => (
  <footer className="py-12 bg-black border-t border-zinc-900 text-center">
    <div className="flex justify-center gap-6 mb-8 text-zinc-600"><Instagram /><Twitter /><Facebook /></div>
    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700">&copy; {new Date().getFullYear()} FITLIFE PRO GLOBAL</p>
  </footer>
);

export const LoginModal: React.FC<{onClose: () => void, onLoginSuccess: (u: UserProfile) => void}> = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState(''); const [pass, setPass] = useState('');
  const submit = async (e: any) => { e.preventDefault(); const res = await api.login(email, pass); if (res.success) onLoginSuccess(res.data); else alert(res.message); };
  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8">
      <div className="bg-[#020617] border border-white/10 p-12 rounded-[3rem] w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-zinc-500"><X /></button>
        <h2 className="text-4xl font-black italic uppercase text-white mb-8">Vault Login</h2>
        <form onSubmit={submit} className="space-y-4">
          <input required type="email" placeholder="Email" className="w-full bg-white/5 p-5 rounded-2xl" value={email} onChange={e => setEmail(e.target.value)} />
          <input required type="password" placeholder="Password" className="w-full bg-white/5 p-5 rounded-2xl" value={pass} onChange={e => setPass(e.target.value)} />
          <button className="w-full bg-white text-black py-6 rounded-full font-black uppercase tracking-widest">Initiate Session</button>
        </form>
      </div>
    </div>
  );
};
