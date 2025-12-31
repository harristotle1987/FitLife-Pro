
import React from 'react';
import RevealOnScroll from './RevealOnScroll';
import * as assets from '../assets';

const Areas = [
  {
    title: "The Iron Vault",
    desc: "Precision racks and competition-grade weights in a focused, low-light setting.",
    image: assets.fac_iron,
    span: "md:col-span-2 md:row-span-2"
  },
  {
    title: "Neon Cardio Deck",
    desc: "State-of-the-art ellipitcals and treadmills with atmospheric lighting.",
    image: assets.fac_cardio,
    span: "md:col-span-1 md:row-span-1"
  },
  {
    title: "Boutique Recovery Hub",
    desc: "High-tech recovery environment featuring cold plunges and infrared therapy.",
    image: assets.fac_recovery,
    span: "md:col-span-1 md:row-span-2"
  },
  {
    title: "Performance Turf",
    desc: "30-meter indoor track for sled work, agility, and battle rope conditioning.",
    image: assets.fac_turf,
    span: "md:col-span-1 md:row-span-1"
  },
  {
    title: "Zen Sanctuary",
    desc: "Minimalist, sun-drenched studio for yoga, meditation, and restorative movement.",
    image: assets.fac_zen,
    span: "md:col-span-1 md:row-span-1"
  },
  {
    title: "The Octagon",
    desc: "Full-scale professional MMA cage with competition-grade mats and high-tension wire.",
    image: assets.fac_octagon,
    span: "md:col-span-1 md:row-span-1"
  }
];

const Facilities = () => {
  return (
    <section id="facilities" className="py-32 bg-zinc-950 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <RevealOnScroll variant="left" className="mb-16">
            <h4 className="text-fuchsia-500 font-bold uppercase tracking-widest text-sm mb-2">Private Infrastructure</h4>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-tight uppercase italic tracking-tighter">
              World Class <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600">Environments.</span>
            </h2>
         </RevealOnScroll>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px] md:auto-rows-[300px]">
            {Areas.map((area, idx) => (
               <RevealOnScroll 
                key={idx} 
                variant="zoom" 
                delay={idx * 50} 
                className={`${area.span} relative group overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl bg-zinc-900`}
               >
                  <img 
                    src={area.image} 
                    alt={area.title} 
                    className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black via-transparent to-transparent">
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{area.title}</h3>
                     <p className="text-zinc-400 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{area.desc}</p>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-white/20 group-hover:border-fuchsia-500 transition-colors duration-500"></div>
               </RevealOnScroll>
            ))}
         </div>

         <RevealOnScroll variant="up" className="mt-20 text-center">
            <p className="text-zinc-500 text-lg font-medium mb-6">Exclusive access to the city's most advanced training infrastructure.</p>
            <div className="flex flex-wrap justify-center gap-4">
               {['Private Lockers', 'Infrared Therapy', 'Cold Plunge', 'Fuel Bar', 'Elite WiFi'].map((amenity, i) => (
                 <span key={i} className="text-[10px] font-black uppercase tracking-widest border border-zinc-800 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
                   {amenity}
                 </span>
               ))}
            </div>
         </RevealOnScroll>
       </div>
    </section>
  );
};

export default Facilities;