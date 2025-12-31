
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const TrustedPayment = () => {
  return (
    <section className="bg-zinc-950 border-t border-zinc-900 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-fuchsia-900/10 via-transparent to-yellow-900/10 blur-3xl pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <RevealOnScroll variant="up" delay={100}>
            <div className="flex flex-col lg:flex-row justify-between items-center gap-10 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-xl">
                
                {/* Security Assurance */}
                <div className="flex flex-col gap-2 text-center lg:text-left">
                     <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                        <ShieldCheck className="w-6 h-6 text-green-500" />
                        <span className="text-white font-black uppercase tracking-widest text-lg">Secure Checkout</span>
                     </div>
                     <p className="text-zinc-400 text-sm max-w-md">
                        All transactions are 256-bit SSL encrypted. We partner with industry leaders to ensure your data is always protected.
                     </p>
                </div>

                {/* Payment Logos */}
                <div className="flex flex-wrap justify-center items-center gap-6">
                    {/* Visa */}
                    <div className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
                        <svg className="h-8 w-auto" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="32" rx="2" fill="white"/>
                            <path d="M19.78 5.60001H23.08L21.02 26.4H17.72L19.78 5.60001ZM33.32 16.92C33.32 11.24 25.5 10.96 25.54 8.86001C25.56 8.22001 26.16 7.56001 27.56 7.42001C28.26 7.34001 30.14 7.28001 32.22 8.24001L32.8 5.48001C32.02 5.20001 31.02 4.98001 29.8 5.00001C26.12 5.00001 23.5 6.92001 23.46 9.80001C23.42 11.96 25.4 13.14 26.9 13.88C28.44 14.64 28.96 15.12 28.96 15.82C28.96 16.9 27.6 17.4 26.36 17.4C25.26 17.4 24.64 17.26 24.14 17.04L23.42 19.96C24.34 20.38 26.04 20.76 27.7 20.76C31.54 20.76 33.32 18.82 33.32 16.92ZM40.92 26.4H44.06L41.32 5.60001H38.28C37.58 5.60001 37 6.00001 36.72 6.72001L31.32 26.4H34.78L35.48 23.36H39.84L40.24 26.4H40.92ZM36.42 19.86L38.28 11.78L39.38 19.86H36.42ZM15.82 5.60001H12.6L8.14001 26.4H11.52L15.82 5.60001ZM8.56001 5.60001L5.80001 19.66L5.50001 18.06C5.00001 15.72 2.68001 10.5 0.500006 8.20001L4.62001 26.4H8.10001L13.84 5.60001H8.56001Z" fill="#1A1F71"/>
                        </svg>
                    </div>

                    {/* Mastercard */}
                    <div className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
                        <svg className="h-8 w-auto" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="32" rx="2" fill="#222"/>
                            <path d="M19.1 26.6C22.6 24.4 24.8 20.6 24.8 16.1C24.8 11.6 22.5 7.7 19.1 5.5C17 12.1 17 19.8 19.1 26.6Z" fill="#FF5F00"/>
                            <path d="M29.5 5.5C26 7.7 23.8 11.5 23.8 16.1C23.8 20.6 26.1 24.4 29.5 26.6C31.6 20 31.6 12.3 29.5 5.5Z" fill="#EB001B"/>
                            <path d="M41 16.1C41 24.9 33.8 32 25 32C24.6 32 24.2 32 23.8 32C23.6 32 23.4 32 23.2 32C28.1 29.5 31.5 24.5 31.5 18.6C31.5 17.8 31.4 17 31.3 16.2C40.6 16.2 41 16.1 41 16.1Z" fill="#F79E1B"/>
                            <path d="M7 16.1C7 7.3 14.2 0.2 23 0.2C23.4 0.2 23.8 0.2 24.2 0.2C24.4 0.2 24.6 0.2 24.8 0.2C19.9 2.7 16.5 7.7 16.5 13.6C16.5 14.4 16.6 15.2 16.7 16C7.4 16 7 16.1 7 16.1Z" fill="#FF5F00"/>
                        </svg>
                    </div>

                    {/* Stripe Badge */}
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-md border border-slate-800">
                        <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-bold uppercase tracking-wider">Powered by Stripe</span>
                    </div>
                </div>
            </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};

export default TrustedPayment;