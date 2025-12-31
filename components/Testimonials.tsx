
import React from 'react';
import { Testimonial } from '../types';
import { Star, CheckCircle } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

interface TestimonialsProps {
  testimonials: Testimonial[];
  loading: boolean;
}

const Testimonials: React.FC<TestimonialsProps> = ({ testimonials, loading }) => {
  return (
    <section id="reviews" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Google Reviews Header */}
        <RevealOnScroll variant="down" className="text-center mb-16">
           <div className="flex items-center justify-center space-x-2 mb-4">
               {/* Google G Logo */}
               <svg className="w-10 h-10" viewBox="0 0 24 24">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               <span className="text-4xl font-sans text-gray-500">Reviews</span>
           </div>
           
           <h2 className="text-3xl font-normal text-gray-800">
               Rated <span className="font-bold">4.8 Stars</span> with 763 Reviews
           </h2>
           <div className="flex justify-center space-x-1 mt-2">
               {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />)}
           </div>
        </RevealOnScroll>

        {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="space-y-2 mt-6">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
                <RevealOnScroll 
                    key={t.id} 
                    variant="up" 
                    delay={idx * 100} // Stagger effect: 0ms, 100ms, 200ms...
                    className="h-full"
                >
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow flex flex-col h-full transform hover:-translate-y-2 duration-300">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                                {t.clientName.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{t.clientName}</h4>
                                <div className="flex items-center text-xs text-gray-500">
                                    <span>{t.clientTitle || 'Member'}</span>
                                    <span className="mx-1">•</span>
                                    <span>Verified</span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" className="w-5 h-5 opacity-50" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                            <CheckCircle className="w-4 h-4 text-blue-500 ml-2" />
                        </div>

                        <p className="text-gray-600 leading-relaxed font-normal text-sm italic">
                            "{t.quote}"
                        </p>
                    </div>
                </RevealOnScroll>
            ))}
            </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;