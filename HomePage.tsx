
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Facilities from './components/Facilities';
import Team from './components/Team';
import Nutrition from './components/Nutrition';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import TrustedPayment from './components/TrustedPayment';
import Footer from './components/Footer';
import FloatingWidget from './components/FloatingWidget';
import AiAssistant from './components/AiAssistant';
import InfoModals, { InfoModalType } from './components/InfoModals';
import { UserProfile, TrainingPlan, Testimonial } from './types';
import { api } from './api';

interface HomePageProps {
  onLoginMember: () => void;
  user: UserProfile | null;
}

const HomePage: React.FC<HomePageProps> = ({ onLoginMember, user }) => {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [prefilledGoal, setPrefilledGoal] = useState('');
  const [activeInfoModal, setActiveInfoModal] = useState<InfoModalType>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, t] = await Promise.all([
          api.getPlans(),
          api.getTestimonials()
        ]);
        setPlans(p);
        setTestimonials(t); 
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoadingPlans(false);
        setLoadingReviews(false);
      }
    };
    fetchData();
  }, []);

  const handleCtaClick = () => {
    document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRecommendation = (rec: string) => {
    setPrefilledGoal(rec);
    document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <Navbar 
        onCtaClick={handleCtaClick} 
        onLoginMember={onLoginMember} 
        user={user} 
      />
      
      <main>
        <Hero onCtaClick={handleCtaClick} />
        
        <div id="philosophy">
          <About />
        </div>
        
        <Services 
          plans={plans} 
          loading={loadingPlans} 
          onSelectPlan={(name) => {
            setPrefilledGoal(`I'm interested in the ${name} protocol.`);
            document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
          }} 
        />
        
        <Facilities />
        
        <div className="bg-black py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4">PROTOCOL SELECTOR</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Artificial Intelligence Assisted Ingestor</p>
            </div>
            <AiAssistant onRecommendation={handleRecommendation} />
        </div>
        
        <Nutrition />
        <Team />
        <Testimonials testimonials={testimonials} loading={loadingReviews} />
        
        <div id="cta">
          <Contact prefilledGoal={prefilledGoal} />
        </div>
        
        <TrustedPayment />
      </main>

      <Footer 
        onCtaClick={handleCtaClick} 
        onOpenInfo={(type) => setActiveInfoModal(type)} 
      />
      
      <FloatingWidget onCtaClick={handleCtaClick} />

      <InfoModals 
        activeModal={activeInfoModal} 
        onClose={() => setActiveInfoModal(null)} 
      />
    </div>
  );
};

export default HomePage;