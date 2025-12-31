
import React from 'react';
import { X, Shield, FileText, HelpCircle, ChevronRight } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

export type InfoModalType = 'privacy' | 'terms' | 'faq' | null;

interface InfoModalsProps {
  activeModal: InfoModalType;
  onClose: () => void;
}

const InfoModals: React.FC<InfoModalsProps> = ({ activeModal, onClose }) => {
  if (!activeModal) return null;

  const content = {
    privacy: {
      title: "Privacy Architecture",
      icon: <Shield className="w-8 h-8 text-fuchsia-500" />,
      body: (
        <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
          <section>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">1. Data Sovereignty</h4>
            <p>At FitLife Pro, your biometric data is treated with clinical-grade security. We collect performance metrics, nutritional logs, and identity details solely to optimize your biological output.</p>
          </section>
          <section>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">2. Encryption Protocols</h4>
            <p>All communication between your dashboard and our coaches is end-to-end encrypted. We never share your physical progress logs with third-party marketing entities.</p>
          </section>
          <section>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">3. Biometric Retention</h4>
            <p>You may request the full purging of your "Growth Matrix" history at any time. Records are kept for the duration of active coaching plus 24 months for longitudinal analysis unless otherwise specified.</p>
          </section>
        </div>
      )
    },
    terms: {
      title: "Service Protocols",
      icon: <FileText className="w-8 h-8 text-fuchsia-500" />,
      body: (
        <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
          <section>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">1. The Commitment</h4>
            <p>FitLife Pro protocols require strict adherence. Results are scientifically engineered based on the data you provide. Misrepresentation of physical activity or nutrition logs may lead to sub-optimal outcomes.</p>
          </section>
          <section>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">2. Health Waiver</h4>
            <p>By initiating any FitLife protocol, you confirm that you have been cleared by a medical professional for high-intensity physical exertion. Coaches provide performance engineering, not medical diagnosis.</p>
          </section>
          <section>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">3. Intellectual Property</h4>
            <p>Custom training splits, proprietary macro-cycles, and the "Bolt Methodology" documents are for individual use only. Redistribution is strictly prohibited under intellectual property law.</p>
          </section>
        </div>
      )
    },
    faq: {
      title: "Intelligence Briefing",
      icon: <HelpCircle className="w-8 h-8 text-fuchsia-500" />,
      body: (
        <div className="space-y-4">
          {[
            { q: "What is the Bolt Method?", a: "A proprietary system of time-collapsed hypertrophy and metabolic flexibility engineered for high-stress executives." },
            { q: "How are coaches assigned?", a: "Our Super Admin analyzes your lead intake data and matches you with a specialist whose expertise aligns with your primary biological goals." },
            { q: "Can I switch protocols?", a: "Protocol shifts occur at the end of each 4-week block based on the data trends in your Growth Matrix." },
            { q: "Is nutrition included?", a: "Every protocol from 'Starter' to 'Pinnacle' includes surgical nutrition guidance. Higher tiers include 24/7 concierge support." }
          ].map((item, i) => (
            <RevealOnScroll key={i} variant="up" delay={i * 50}> {/* Added RevealOnScroll here */}
              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 group hover:border-fuchsia-500/30 transition-colors">
                <p className="text-white font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-fuchsia-500" /> {item.q}
                </p>
                <p className="text-zinc-500 text-xs leading-relaxed">{item.a}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      )
    }
  };

  const active = content[activeModal];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 md:p-16 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/5 blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-zinc-900 rounded-3xl border border-zinc-800">
              {active.icon}
            </div>
            <div>
              <p className="text-fuchsia-500 font-black uppercase text-[10px] tracking-[0.4em] mb-1">FitLife System</p>
              <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">{active.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-zinc-900 text-zinc-500 hover:text-white rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          {active.body}
        </div>

        <div className="mt-10 pt-8 border-t border-zinc-900 shrink-0 text-center">
           <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.5em]">End of Official Briefing</p>
        </div>
      </div>
    </div>
  );
};

export default InfoModals;