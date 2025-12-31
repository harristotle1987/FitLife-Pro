
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
      
      // Focus if visible
      if (goalInputRef.current) {
         goalInputRef.current.focus();
      }

      const timer = setTimeout(() => setHighlightGoal(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [prefilledGoal]);

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
      // 1. Save to Database via API
      const dbResult = await api.submitLead(formData);
      
      if (dbResult.success) {
        // 2. Trigger EmailJS Notification
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
            console.warn("EmailJS failed, but DB succeeded:", e);
          }
        }
        setSubmitStatus('success');
        if (onSuccess) onSuccess();
      } else {
        setSubmitStatus('error');
        setApiErrorMessage(dbResult.message || 'System was unable to process your request.');
      }
    } catch (err: any) {
      setSubmitStatus('error');
      setApiErrorMessage(err.message || 'Connectivity failure detected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-fuchsia-600/10 border border-fuchsia-500/30 rounded-2xl p-8 text-center animate-fade-in shadow-2xl">
        <CheckCircle className="w-16 h-16 text-fuchsia-500 mx-auto mb-4" />
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">PROTOCOL INITIATED</h3>
        <p className="text-zinc-400 mt-2">A strategy specialist will contact you at {formData.phone} shortly.</p>
        <button 
          onClick={() => setSubmitStatus('idle')}
          className="mt-6 text-fuchsia-500 font-black uppercase text-xs tracking-widest hover:underline"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  const inputClasses = variant === 'seamless' 
    ? "w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 rounded-xl px-4 py-4 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all"
    : "w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all";

  const goalInputClasses = highlightGoal 
    ? `${inputClasses} ring-2 ring-fuchsia-500 bg-fuchsia-500/10` 
    : inputClasses;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input 
            type="text" 
            placeholder="Name" 
            className={inputClasses} 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          {errors.name && <p className="text-[10px] text-fuchsia-500 mt-1 uppercase font-bold">{errors.name}</p>}
        </div>
        <div>
          <input 
            type="email" 
            placeholder="Email" 
            className={inputClasses} 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          {errors.email && <p className="text-[10px] text-fuchsia-500 mt-1 uppercase font-bold">{errors.email}</p>}
        </div>
      </div>
      <div>
        <input 
          type="tel" 
          placeholder="Phone Number" 
          className={inputClasses} 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
        {errors.phone && <p className="text-[10px] text-fuchsia-500 mt-1 uppercase font-bold">{errors.phone}</p>}
      </div>
      <div>
        <textarea 
          ref={goalInputRef}
          placeholder="What is your primary goal?" 
          rows={3} 
          className={`${goalInputClasses} resize-none`} 
          value={formData.goal}
          onChange={(e) => setFormData({...formData, goal: e.target.value})}
        />
        {errors.goal && <p className="text-[10px] text-fuchsia-500 mt-1 uppercase font-bold">{errors.goal}</p>}
      </div>
      
      {submitStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
           <AlertCircle className="w-5 h-5 flex-shrink-0" />
           <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
             {apiErrorMessage}
           </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white py-5 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center transition-all disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            Initiate Strategy Call
            <ArrowRight className="ml-2 w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};

export default LeadForm;