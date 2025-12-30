import React, { useState } from 'react';
import { TrainingPlan } from '../types';
import { Check, ArrowRight, Crown, Loader2, MessageCircle } from 'lucide-react';
import { api } from '../api';

interface PlanCardProps {
  plan: TrainingPlan;
  onSelect: () => void;
  isPopular?: boolean;
  image?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect, isPopular, image }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripeCheckout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    
    try {
      const checkoutUrl = await api.createCheckoutSession(plan.id, '');
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        alert(`Initializing Demo Secure Payment for ${plan.name} ($${plan.price})`);
        onSelect();
      }
    } catch (err) {
      console.error("Stripe Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`group relative flex flex-col w-full bg-zinc-900 transition-all duration-500 ${
        isPopular 
          ? 'shadow-[0_0_40px_rgba(250,204,21,0.1)] border-2 border-yellow-400/50 transform scale-105 z-10' 
          : 'border border-zinc-800 hover:border-fuchsia-600'
      } rounded-3xl overflow-hidden`}>
      
      <div className="h-48 relative overflow-hidden">
        {image ? (
            <img 
                src={image} 
                alt={plan.name} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                decoding="async"
            />
        ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">No Image</div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
        
        <div className="absolute bottom-6 left-6 text-white">
            <div className="flex items-baseline">
                <span className={`text-3xl font-black tracking-tighter ${isPopular ? 'text-yellow-400' : 'text-white'}`}>${plan.price}</span>
                <span className="text-xs font-bold uppercase tracking-widest ml-2 text-zinc-400">/ {plan.durationWeeks} Wks</span>
            </div>
        </div>

        {isPopular && (
            <div className="absolute top-4 right-4">
                <div className="bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-black" />
                    Best Value
                </div>
            </div>
        )}
      </div>
      
      <div className="p-8 flex flex-col flex-1 bg-zinc-900 relative">
        <div className="mb-6 relative z-10">
            <h3 className="text-2xl font-black text-white uppercase italic">
                {plan.name}
            </h3>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">{plan.description}</p>
        </div>

        <div className="w-full h-[1px] bg-zinc-800 mb-6"></div>

        <ul className="flex-1 space-y-4 mb-8 relative z-10">
            {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                    isPopular ? 'bg-yellow-400/20 text-yellow-400' : 'bg-fuchsia-600/20 text-fuchsia-500'
                }`}>
                    <Check className="w-3 h-3 stroke-[3px]" />
                </div>
                <span className="text-zinc-300 text-sm font-bold">{feature}</span>
            </li>
            ))}
        </ul>

        <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
                className="py-4 px-2 rounded-xl font-bold uppercase tracking-wider text-[10px] border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2"
            >
                Inquire <MessageCircle className="w-3 h-3" />
            </button>
            <button
                onClick={handleStripeCheckout}
                disabled={isProcessing}
                className={`py-4 px-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center transition-all duration-300 ${
                isPopular
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg shadow-yellow-400/10'
                    : 'bg-zinc-100 text-black hover:bg-white border border-transparent'
                } disabled:opacity-50`}
            >
                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Join Now'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PlanCard;