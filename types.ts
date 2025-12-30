
export type UserRole = 'super_admin' | 'admin' | 'member' | 'nutritionist';

export interface AdminPermissions {
  canManageLeads: boolean;
  canManageProgress: boolean;
  canManageAdmins: boolean;
  canManagePlans: boolean;
  canManageNutrition: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  bio?: string;
  stripe_customer_id?: string;
  activePlanId?: string;
  permissions?: AdminPermissions;
  assignedCoachId?: string;
  assignedCoachName?: string;
  assignedNutritionistName?: string;
  nutritionalProtocol?: string;
  created_at?: string;
}

export interface FinancialHealthRecord {
  profile_id: string;
  athlete_name: string;
  email: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trailing';
  next_billing: string | null;
  monthly_rate: number | null;
}

export interface MemberProgress {
  id: string;
  member_id: string;
  date: string;
  weight: number;
  body_fat: number;
  performance_score: number;
  notes?: string;
  coach_id: string;
  coach_name: string;
}

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  goal: string;
  source: 'CTA_Button' | 'Contact_Form' | 'AI_Chat';
  status?: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  created_at?: string;
}

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationWeeks: number;
  features: string[];
  recommendedFor?: string[];
  stripePriceId?: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientTitle: string;
  quote: string;
  isFeatured: boolean;
  rating: number;
}
