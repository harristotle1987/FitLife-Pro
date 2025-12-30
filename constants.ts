
import { TrainingPlan, Testimonial } from './types.ts';

export const TRAINING_PLANS: TrainingPlan[] = [
  {
    id: 'plan_starter',
    name: 'Starter Protocol',
    description: 'The foundation for your journey. Perfect for those establishing a routine with elite digital guidance.',
    price: 49,
    durationWeeks: 4,
    features: [
      'Digital Training Dashboard',
      'Community Support Access',
      'Fundamental Macro Guide',
      'Standard Mobility Drills'
    ],
    recommendedFor: ['beginners', 'weight loss'],
    stripePriceId: 'price_starter_49'
  },
  {
    id: 'plan_performance',
    name: 'Pro Performance',
    description: 'High-intensity hypertrophy and strength blocks designed for rapid physical transformation.',
    price: 199,
    durationWeeks: 12,
    features: [
      'Custom Split Programming',
      'Bi-Weekly Form Reviews',
      'Advanced Nutrition Plan',
      'Supplement Optimization',
      'Direct Coach Messaging'
    ],
    recommendedFor: ['muscle gain', 'intermediate'],
    stripePriceId: 'price_performance_199'
  },
  {
    id: 'plan_executive',
    name: 'Elite Executive',
    description: 'Total human optimization for high-performers. Manage stress, sleep, and performance seamlessly.',
    price: 499,
    durationWeeks: 16,
    features: [
      'Priority 24/7 Support',
      'Travel & Hotel Workouts',
      'Stress & Sleep Management',
      'Monthly Bio-feedback calls',
      'Executive Nutrition Concierge'
    ],
    recommendedFor: ['executives', 'advanced'],
    stripePriceId: 'price_executive_499'
  },
  {
    id: 'plan_pinnacle',
    name: 'The Pinnacle',
    description: 'The ultimate bespoke experience. 1-on-1 private access and total lifestyle engineering.',
    price: 1000,
    durationWeeks: 24,
    features: [
      'Private Facility Access',
      'In-Person Bio-Hacking Consults',
      'Full Bloodwork Coordination',
      'Personal Chef Meal Planning',
      'The Ultimate Recovery Kit'
    ],
    recommendedFor: ['vip', 'pro athletes', 'high-net-worth'],
    stripePriceId: 'price_pinnacle_1000'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    clientName: 'Sarah Jenkins',
    clientTitle: 'Executive Director',
    quote: "The Elite Executive plan didn't just change my body; it changed my clarity at work. Absolute game-changer.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't2',
    clientName: 'Marcus V.',
    clientTitle: 'Founder',
    quote: "Pinnacle coaching is the only way to train. The attention to detail in nutrition is surgical.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't3',
    clientName: 'Elena G.',
    clientTitle: 'Professional Athlete',
    quote: "Supportive, understanding, and effective. The recovery lab is world-class.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't4',
    clientName: 'David L.',
    clientTitle: 'Software Architect',
    quote: "The Pro Performance cycles got me to 8% body fat in record time. Science-backed results.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't5',
    clientName: 'Jonathan K.',
    clientTitle: 'CTO @ NexGen',
    quote: "Finally, a protocol that respects a 14-hour workday. My energy levels have doubled.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't6',
    clientName: 'Rachel M.',
    clientTitle: 'Managing Partner',
    quote: "The concierge nutrition alone is worth the investment. I no longer have to think about my fuel.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't7',
    clientName: 'Chris B.',
    clientTitle: 'Venture Capitalist',
    quote: "FitLife Pro is the infrastructure I needed to maintain peak performance during fundraising rounds.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't8',
    clientName: 'Amanda S.',
    clientTitle: 'CEO',
    quote: "The travel protocols are a lifesaver. I can hit my targets whether I'm in Tokyo or London.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't9',
    clientName: 'Robert T.',
    clientTitle: 'Ironman Athlete',
    quote: "Transitioning my strength block to the Bolt methodology improved my power-to-weight ratio significantly.",
    isFeatured: true,
    rating: 5
  },
  {
    id: 't10',
    clientName: 'Lisa P.',
    clientTitle: 'Operations Director',
    quote: "The 3D body scans provided the raw data I needed to stop guessing and start growing.",
    isFeatured: true,
    rating: 5
  }
];
