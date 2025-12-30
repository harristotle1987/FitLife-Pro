import React from 'react';
import { MessageCircle } from 'lucide-react';

const FloatingWidget = ({ onCtaClick }: { onCtaClick: () => void }) => {
  return (
    <>
      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-24 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      >
        <MessageCircle className="w-8 h-8 fill-current" />
      </a>

      {/* Sticky Mobile CTA (Optional, looks like screenshot has a bottom bar effect or sticky button) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[90%] md:w-auto md:bottom-10">
         <button 
           onClick={onCtaClick}
           className="w-full md:w-auto bg-fuchsia-600 text-white font-black uppercase tracking-widest py-4 px-10 rounded-full shadow-[0_10px_30px_rgba(192,38,211,0.5)] border-2 border-fuchsia-400 hover:bg-fuchsia-500 transition-colors flex items-center justify-center gap-2"
         >
            Get Your Free Pass
         </button>
      </div>
    </>
  );
};

export default FloatingWidget;