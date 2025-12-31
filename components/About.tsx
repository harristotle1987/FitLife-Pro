
import React from 'react';
import { Target, ShieldCheck, Zap } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';
import * as assets from '../assets';

const About = () => {
  return (
    <section id="philosophy" className="pt-0 pb-24 bg-black text-slate-200 relative overflow-hidden">
       <div className="absolute -left-20 top-0 text-[400px] font-black text-white opacity-[0.02] select-none pointer-events-none font-sans">
         P
       </div>

       <div className="absolute right-0 top-1/2 w-1/2 h-full bg-gradient-to-l from-fuchsia-900/10 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1">
            <RevealOnScroll variant="left">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="h-[2px] w-12 bg-fuchsia-600"></div>
                    <h4 className="text-fuchsia-500 font-bold uppercase tracking-widest text-sm">The Philosophy</h4>
                </div>
                
                <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 leading-[0.95] tracking-tight">
                BUILT FOR THE <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">RELENTLESS.</span>
                </h2>
                
                <p className="text-xl text-zinc-400 leading-relaxed mb-8 font-light">
                I don't train hobbies. I train lifestyles. As a former competitive athlete turned executive performance coach, I’ve engineered a system that respects your schedule while demanding your best.
                </p>
            </RevealOnScroll>
            
            <RevealOnScroll variant="up" delay={100}>
                <p className="text-md text-zinc-500 leading-relaxed mb-10 font-normal border-l-4 border-fuchsia-600 pl-6">
                "Most programs fail because they ignore the reality of a high-pressure career. My methodology integrates precision nutrition, time-efficient hypertrophy, and recovery protocols used by pro athletes."
                </p>
            </RevealOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                  { icon: Target, title: "Precision", sub: "Data-driven macros.", delay: 200 },
                  { icon: ShieldCheck, title: "Accountability", sub: "Daily check-ins.", delay: 300 },
                  { icon: Zap, title: "Vitality", sub: "Reclaim your edge.", delay: 400 }
              ].map((item, i) => (
                  <RevealOnScroll key={i} variant="up" delay={item.delay} className="group">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:border-fuchsia-500 transition-colors duration-300">
                        <item.icon className="w-6 h-6 text-white group-hover:text-fuchsia-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-zinc-500">{item.sub}</p>
                  </RevealOnScroll>
              ))}
            </div>
          </div>

          <div className="relative order-1 lg:order-2 h-[500px] md:h-[600px]">
             <RevealOnScroll variant="right" delay={100} className="w-full h-full">
                 <div className="absolute top-10 right-10 w-full h-full border-2 border-zinc-800 rounded-sm z-0"></div>
                 
                 <div className="absolute top-0 right-0 w-4/5 h-4/5 shadow-2xl z-10 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
                    <img 
                        src={assets.about_main} 
                        alt="Coach philosophy portrait" 
                        className="w-full h-full object-cover transition-transform duration-700 filter grayscale contrast-125"
                        loading="lazy"
                        decoding="async"
                    />
                 </div>

                 <div className="absolute bottom-10 left-0 w-3/5 h-1/2 shadow-2xl z-20 overflow-hidden rounded-sm border-4 border-black bg-zinc-900">
                    <img 
                        src={assets.about_texture} 
                        alt="Gym Texture" 
                        className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
                        loading="lazy"
                        decoding="async"
                    />
                    <div className="absolute inset-0 bg-fuchsia-900/20 mix-blend-overlay"></div>
                 </div>

                 <RevealOnScroll variant="zoom" delay={300} className="absolute bottom-20 -right-4 bg-zinc-900 border border-zinc-800 text-white p-6 shadow-2xl z-30 max-w-[200px]">
                   <p className="font-serif italic text-2xl text-yellow-400 font-bold mb-2">10+</p>
                   <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Years Experience Coaching Executives</p>
                 </RevealOnScroll>
             </RevealOnScroll>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;