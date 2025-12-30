import React from 'react';
import LeadForm from './LeadForm';
import RevealOnScroll from './RevealOnScroll';
import * as assets from '../assets';

interface ContactProps {
  prefilledGoal: string;
}

const Contact: React.FC<ContactProps> = ({ prefilledGoal }) => {
  return (
    <section id="cta" className="relative min-h-[600px] flex items-center justify-center py-24 bg-black overflow-hidden">
      
      <div className="absolute inset-0 z-0">
          <img 
            src={assets.contact_bg} 
            alt="Gym Workout" 
            className="w-full h-full object-cover opacity-40 filter grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
        
        <RevealOnScroll variant="zoom" className="mb-12">
            <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 via-white to-yellow-400 mb-4 animate-pulse">
                FREE PASS
            </h2>
            <div className="inline-block border-2 border-white px-8 py-3 rounded-full">
                <span className="text-white font-bold tracking-[0.3em] uppercase">Live The Experience</span>
            </div>
        </RevealOnScroll>

        <RevealOnScroll variant="up" delay={200} className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-8 rounded-3xl shadow-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-black text-white mb-2">Your first step is FREE</h3>
            <p className="text-gray-400 mb-8">1-Day + 3D Body Scan + Trainer Intro</p>
            
            <LeadForm 
                source="Contact_Form" 
                prefilledGoal={prefilledGoal}
                onSuccess={() => console.log('Lead captured')}
                variant="seamless"
            />
        </RevealOnScroll>

        <RevealOnScroll variant="up" delay={400}>
            <p className="text-gray-500 text-xs mt-8 uppercase tracking-widest">
                *Local residents only. Must be 18+.
            </p>
        </RevealOnScroll>

      </div>
    </section>
  );
};

export default Contact;