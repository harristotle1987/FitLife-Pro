
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../types';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';

// EmailJS Global Reference
declare var emailjs: any;

interface LeadFormProps {
  source: Lead['source'];
  prefilledGoal?: string;
  onSuccess?: () => void;
  variant?: 'card' | 'seamless';
}

const LeadForm: React.FC<LeadFormProps> = ({ source, prefilledGoal = '', onSuccess, variant = 'card' }) => {
  const [formData, setFormData] = useState<Lead>({
    name: '',
    email: '',
    phone: '',
    goal: prefilledGoal,
    source: source
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof Lead, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [highlightGoal, setHighlightGoal] = useState(false);
  const goalInputRef = useRef<HTMLTextAreaElement>(null);

  // Hardcoded EmailJS IDs
  const EMAILJS_PUBLIC_KEY = 'd5_xsgb_XwQYic3F5';
  const EMAILJS_SERVICE_ID = 'service_a4mrm2f';
  const EMAILJS_TEMPLATE_ID = 'template_fmqm7c9';

  useEffect(() => {
    if (typeof emailjs !== 'undefined') {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, []);

  useEffect(() => {
    if (prefilledGoal) {
      setFormData(prev => ({ ...prev, goal: prefilledGoal }));
      setHighlightGoal(true);
      
      if (goalInputRef.current) {
         goalInputRef.current.focus();
      }

      const timer = setTimeout(() => setHighlightGoal(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [prefilledGoal]);

  // Handle 5-second reset
  useEffect(() => {
    let timer: any;
    if (submitStatus === 'success') {
      timer = setTimeout(() => {
        setSubmitStatus('idle');
        setFormData({ name: '', email: '', phone: '', goal: '', source });
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [submitStatus, source]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Lead, string>> = {};
    let isValid = true;
    if (!formData.name.trim()) { newErrors.name = 'Name required'; isValid = false; }
    if (!formData.email.includes('@')) { newErrors.email = 'Valid email required'; isValid = false; }
    if (formData.phone.length < 10) { newErrors.phone = 'Valid phone required'; isValid = false; }
    if (!formData.goal.trim()) { newErrors.goal = 'Goal required'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setApiErrorMessage('');

    try {
      const dbResult = await api.submitLead(formData);
      
      if (dbResult.success) {
        if (typeof emailjs !== 'undefined') {
          try {
            await emailjs.send(
              EMAILJS_SERVICE_ID,
              EMAILJS_TEMPLATE_ID,
              {
                name: formData.name,
                title: "NEW STRATEGY LEAD",
                message: formData.goal,
                email: formData.email,
                phone: formData.phone,
                time: new Date().toLocaleString()
              }
            );
          } catch (e) {
            console.warn("EmailJS failed:", e);
          }
        }
        setSubmitStatus('success');
        if (onSuccess) onSuccess();
      } else {
        setSubmitStatus('error');
        setApiErrorMessage(dbResult.message || 'System error.');
      }
    } catch (err: any) {
      setSubmitStatus('error');
      setApiErrorMessage(err.message || 'Connectivity failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-fuchsia-600/10 border border-fuchsia-500/30 rounded-2xl p-10 text-center animate-fade-in shadow-2xl">
        <div className="relative mb-6">
           <div className="absolute inset-0 bg-fuchsia-500/20 blur-2xl animate-pulse"></div>
           <CheckCircle className="w-16 h-16 text-fuchsia-500 mx-auto relative z-10" />
        </div>
        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">PROTOCOL INITIATED</h3>
        <p className="text-zinc-400 mt-3 text-sm font-bold uppercase tracking-widest">A specialist will contact you shortly.</p>
        <p className="text-[9px] text-zinc-600 mt-6 font-black uppercase tracking-[0.3em]">System refreshing in 5 seconds...</p>
      </div>
    );
  }

  const inputClasses = variant === 'seamless' 
    ? "w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 rounded-xl px-5 py-5 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all font-bold"
    : "w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all font-bold";

  const goalInputClasses = highlightGoal 
    ? `${inputClasses} ring-2 ring-fuchsia-500 bg-fuchsia-500/10` 
    : inputClasses;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input 
            type="text" 
            placeholder="Identity Name" 
            className={inputClasses} 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          {errors.name && <p className="text-[10px] text-fuchsia-500 mt-1 uppercase font-black tracking-widest">{errors.name}</p>}
        </div>
        <div>
          <input 
            type="email" 
            placeholder="Vault Email" 
            className={inputClasses} 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          {errors.email && <p className="text-[10px] text-fuchsia-500 mt-1 uppercase font-black tracking-widest">{errors.email}</p>}
        </div>
      </div>
      <div>
        <input 
          type="tel" 
          placeholder="Contact Number" 
          className={inputClasses} 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
        {errors.phone && <p className="text-[10px] text-fuchsia-500 mt-1 uppercase font-black tracking-widest">{errors.phone}</p>}
      </div>
      <div>
        <textarea 
          ref={goalInputRef}
          placeholder="Define Your Biological Target / Primary Goal" 
          rows={3} 
          className={`${goalInputClasses} resize-none`} 
          value={formData.goal}
          onChange={(e) => setFormData({...formData, goal: e.target.value})}
        />
        {errors.goal && <p className="text-[10px] text-fuchsia-500 mt-1 uppercase font-black tracking-widest">{errors.goal}</p>}
      </div>
      
      {submitStatus === 'error' && (
        <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
           <AlertCircle className="w-5 h-5 flex-shrink-0" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-tight">
             ERROR: {apiErrorMessage}
           </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center transition-all disabled:opacity-50 shadow-xl active:scale-95"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            Initiate Strategy Session
            <ArrowRight className="ml-3 w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};

export default LeadForm;
