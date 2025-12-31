
import React from 'react';
import RevealOnScroll from './RevealOnScroll';
import * as assets from '../assets';

const Trainers = [
  { name: "Cesar DeCosta", title: "Fitness Director", specialty: "Body Recomposition", image: assets.team_cesar },
  { name: "Elena Rodriguez", title: "Head Coach", specialty: "Functional Movement", image: assets.team_elena },
  { name: "Marcus Thorne", title: "Strength Lead", specialty: "Powerlifting", image: assets.team_marcus },
  { name: "Sarah Chen", title: "Mobility Expert", specialty: "Yoga & Corrective", image: assets.team_sarah },
  { name: "Dr. Julian Vance", title: "Nutritionist", specialty: "Metabolic Health", image: assets.team_julian },
  { name: "Maya Brooks", title: "High Performance", specialty: "HIIT Athletics", image: assets.team_maya },
  { name: "Leo 'Iron' Vance", title: "Combat Specialist", specialty: "Boxing & Striking", image: assets.team_leo },
  { name: "Isabella Moon", title: "Vitality Coach", specialty: "Longevity Training", image: assets.team_isabella },
  { name: "Jackson Wilde", title: "Recovery Chief", specialty: "Physiotherapy", image: assets.team_jackson }
];

const Team = () => {
  return (
    <section id="team" className="py-24 bg-black relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <RevealOnScroll variant="right" className="absolute top-0 left-0 w-full overflow-hidden leading-none select-none pointer-events-none opacity-5">
        <h2 className="text-[15vw] font-black text-white whitespace-nowrap -ml-20 uppercase">The Squad</h2>
      </RevealOnScroll>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-2 italic uppercase tracking-tighter">THE SQUAD</h2>
            <p className="text-fuchsia-500 font-bold uppercase tracking-widest text-sm">Industry-Leading Expertise</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {Trainers.map((trainer, idx) => (
                <RevealOnScroll key={idx} variant="up" delay={idx * 30} className="group relative">
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden aspect-[3/4] flex flex-col shadow-2xl">
                        <div className="flex-1 overflow-hidden relative bg-zinc-800">
                            <img 
                                src={trainer.image} 
                                alt={trainer.name} 
                                className="w-full h-full object-cover object-top filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="absolute bottom-2 left-2">
                                <span className="bg-black/80 backdrop-blur-sm text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border border-white/20 rounded-full text-white">{trainer.specialty}</span>
                            </div>
                        </div>
                        <div className="bg-black p-4 text-center border-t border-zinc-800 relative">
                             <h3 className="text-sm font-black text-white uppercase italic tracking-tight">{trainer.name}</h3>
                             <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-widest">{trainer.title}</p>
                        </div>
                    </div>
                </RevealOnScroll>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Team;