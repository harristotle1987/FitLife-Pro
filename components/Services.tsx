
import React from 'react';
import { TrainingPlan } from '../types';
import PlanCard from './PlanCard';
import RevealOnScroll from './RevealOnScroll';
import * as assets from '../assets';

interface ServicesProps {
  plans: TrainingPlan[];
  loading: boolean;
  onSelectPlan: (planName: string) => void;
}

const Services: React.FC<ServicesProps> = ({ plans, loading, onSelectPlan }) => {
  const getPlanImage = (id: string) => {
    if (id.includes('pinnacle')) return assets.plan_pinnacle;
    if (id.includes('executive')) return assets.plan_executive;
    if (id.includes('performance')) return assets.plan_performance;
    return assets.plan_starter;
  };

  return (
    <section id="plans" className="py-32 bg-zinc-950 relative overflow-hidden border-t border-zinc-900">
      <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-fuchsia-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-zinc-800 pb-8">
            <RevealOnScroll variant="left" className="max-w-2xl">
              <h4 className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2">Tiered Protocols</h4>
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight">
                Engineered For <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-fuchsia-400">Your Ambition.</span>
              </h2>
            </RevealOnScroll>
            <RevealOnScroll variant="right" delay={200} className="hidden md:block text-right">
              <p className="text-zinc-500 font-medium text-lg">Scalable elite coaching.<br/>Zero excuses.</p>
            </RevealOnScroll>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden animate-pulse flex flex-col">
                        <div className="h-48 bg-zinc-800"></div>
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="h-6 w-3/4 bg-zinc-800 rounded mb-4"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-full bg-zinc-800 rounded"></div>
                                <div className="h-4 w-5/6 bg-zinc-800 rounded"></div>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-3">
                                <div className="h-12 bg-zinc-800 rounded-xl"></div>
                                <div className="h-12 bg-zinc-800 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {plans.map((plan, idx) => (
                    <RevealOnScroll key={plan.id} variant="up" delay={idx * 150} className="flex h-full">
                        <PlanCard 
                            plan={plan} 
                            onSelect={() => onSelectPlan(plan.name)}
                            isPopular={plan.id.includes('executive')}
                            image={getPlanImage(plan.id)}
                        />
                    </RevealOnScroll>
                ))}
            </div>
        )}
      </div>
    </section>
  );
};

export default Services;