
import React, { useEffect, useState } from 'react';
import { PlayCircle, X, ChevronRight } from 'lucide-react';
import * as assets from '../assets';

interface HeroProps {
  onCtaClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section id="hero" className="relative min-h-[500px] md:min-h-[550px] flex items-center justify-center overflow-hidden bg-black px-4 sm:px-6 lg:px-8">
      
      {/* Background Layer */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-black/75 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10"></div>
        
        <img 
          src={assets.hero_bg}
          alt="FitLife Pro Hero"
          className="w-full h-full object-cover object-center scale-105"
          loading="eager"
          decoding="async"
          // @ts-ignore
          fetchpriority="high"
        />
      </div>

      {/* Main Content Layer - High Velocity Spacing */}
      <div className="relative z-30 w-full max-w-7xl mx-auto py-4 text-center lg:text-left">
        <div className="max-w-4xl">
          
          {/* HIGH-VELOCITY HERO STACK - ZERO SPACING */}
          <div className={`flex flex-col space-y-0 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
             <p className="text-fuchsia-500 font-mono text-[9px] sm:text-[10px] tracking-[0.4em] uppercase mb-0 drop-shadow-lg opacity-80">
                [ SYSTEM STATUS: PRODUCTION-READY // NEXT-GEN INFRASTRUCTURE DEPLOYED ]
             </p>
             
             <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.8] tracking-tighter italic uppercase mt-1 mb-0">
                RE-ENGINEER YOUR <br/> 
                <span className="text-zinc-500">HUMAN </span>
                <span className="text-white">ARCHITECTURE.</span>
             </h1>

             <p className="text-sm sm:text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mt-3 leading-snug">
                Stop guessing your progress. Use our smart-tier training ingestor & see 12% more muscle in 30 days.
             </p>
          </div>

          <div className={`flex flex-col sm:flex-row gap-5 justify-center lg:justify-start items-center mt-6 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <button 
              onClick={onCtaClick}
              className="group relative overflow-hidden bg-fuchsia-600 text-white px-10 py-3.5 rounded-full font-black uppercase tracking-[0.15em] hover:bg-fuchsia-500 transition-all duration-300 transform hover:scale-105 shadow-[0_0_50px_rgba(192,38,211,0.4)] w-full sm:w-auto text-[11px]"
            >
              <span className="flex items-center justify-center gap-2">
                Get Your Free Pass <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button 
              onClick={() => setShowVideo(true)}
              className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors group cursor-pointer"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/10 rounded-full animate-ping"></div>
                <PlayCircle className="w-10 h-10 text-yellow-400 group-hover:scale-110 transition-transform relative z-10" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-left leading-tight">
                Watch The<br/>Experience
              </span>
            </button>
          </div>
        </div>
      </div>

      {showVideo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 sm:p-8 animate-fade-in">
          <button 
            onClick={() => setShowVideo(false)}
            className="absolute top-8 right-8 text-white hover:text-fuchsia-500 z-[210] p-2 transition-colors"
          >
            <X className="w-10 h-10" />
          </button>
          <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(192,38,211,0.3)] border border-white/10 bg-black">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/ce8zAyJxPyA?autoplay=1&modestbranding=1"
              title="FitLife Experience"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;