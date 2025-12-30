
import React from 'react';
import RevealOnScroll from './RevealOnScroll.tsx';
import * as assets from '../assets.ts';

const Nutrition = () => {
  return (
    <section id="nutrition" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-600 via-rose-400 to-yellow-300"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <RevealOnScroll variant="down" className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-2">
                <span className="text-4xl font-black text-white italic tracking-tighter">FITLIFE</span>
                <div className="h-8 w-1 bg-white/50 rounded-full"></div>
                <span className="text-4xl font-black text-white tracking-tighter">PRO</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-white mb-6 drop-shadow-md">Nutrition</h2>
            <div className="w-24 h-2 bg-white mx-auto rounded-full mb-8"></div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-2 gap-12 items-center">
            <RevealOnScroll variant="left" className="text-white space-y-6">
                <h3 className="text-2xl font-bold leading-tight">
                    Here at FitLife Pro we have you covered when it comes to creating a nutritional plan.
                </h3>
                <p className="text-lg font-medium opacity-90 leading-relaxed">
                    That matches up with your workout program and the goals you’re looking to accomplish. Whether it's muscle gain, fat loss, or performance, we fuel your ambition.
                </p>
                <ul className="space-y-3 mt-4">
                    {['Customized Macros', 'Meal Timing Strategy', 'Supplement Guidance'].map((item, i) => (
                        <li key={i} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <span className="font-bold tracking-wider uppercase text-sm">{item}</span>
                        </li>
                    ))}
                </ul>
            </RevealOnScroll>

            <RevealOnScroll variant="zoom" delay={100} className="relative">
                <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                    <img 
                        src={assets.nutrition_main} 
                        alt="Healthy Nutrition Bowl" 
                        className="rounded-full shadow-2xl border-8 border-white/20 w-full max-w-md mx-auto"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/30 rounded-full z-0 animate-spin-slow"></div>
            </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};

export default Nutrition;