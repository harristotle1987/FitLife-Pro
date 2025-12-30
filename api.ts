
import { UserProfile, Lead, TrainingPlan, MemberProgress, FinancialHealthRecord, Testimonial } from './types';
import { TRAINING_PLANS, TESTIMONIALS } from './constants';

const API_BASE = '/api';
const TOKEN_KEY = 'fitlife_vault_key_2024';

const fetchSafe = async (url: string, options: any = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      json = { success: false, message: "Response parsing failed." };
    }

    if (res.status === 503) {
      return { 
        ok: false, 
        json: () => Promise.resolve({ 
          success: false, 
          message: `Vault Offline: ${json.error || 'SSL Handshake Failed'}. Check DATABASE_URL in Vercel settings.` 
        }) 
      };
    }

    if (!res.ok) {
      json.success = false;
      json.message = json.message || `API Error: ${res.status}`;
    }

    return { ok: res.ok, json: () => Promise.resolve(json) };
  } catch (e: any) {
    return { 
      ok: false, 
      json: () => Promise.resolve({ 
        success: false, 
        message: `Network failure: ${e.message}. The system is likely recalibrating.` 
      }) 
    };
  }
};

export const api = {
  login: async (email: string, pass: string) => {
    const res = await fetchSafe(`${API_BASE}/profiles/login`, { method: 'POST', body: JSON.stringify({ email, password: pass }) });
    const json = await res.json();
    if (json.token) localStorage.setItem(TOKEN_KEY, json.token);
    return json;
  },
  register: async (name: string, email: string, pass: string) => {
    const res = await fetchSafe(`${API_BASE}/profiles/signup`, { method: 'POST', body: JSON.stringify({ name, email, password: pass }) });
    const json = await res.json();
    if (json.token) localStorage.setItem(TOKEN_KEY, json.token);
    return json;
  },
  logout: () => localStorage.removeItem(TOKEN_KEY),
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const res = await fetchSafe(`${API_BASE}/profiles/me`);
    const json = await res.json();
    return json.success ? json.data : null;
  },
  getProfile: async (id: string): Promise<UserProfile | null> => {
    const res = await fetchSafe(`${API_BASE}/profiles/${id}`);
    const json = await res.json();
    return json.success ? json.data : null;
  },
  getPlans: async (): Promise<TrainingPlan[]> => {
    const res = await fetchSafe(`${API_BASE}/plans`);
    const json = await res.json();
    return (json.success && json.data?.length) ? json.data : TRAINING_PLANS;
  },
  getTestimonials: async (): Promise<Testimonial[]> => {
    const res = await fetchSafe(`${API_BASE}/testimonials`);
    const json = await res.json();
    if (json.success && json.data?.length) {
      return json.data.map((t: any) => ({
        id: t.id,
        clientName: t.client_name,
        clientTitle: t.client_title,
        quote: t.quote,
        rating: t.rating,
        isFeatured: t.is_featured
      }));
    }
    return TESTIMONIALS;
  },
  submitLead: async (formData: Lead) => {
    const res = await fetchSafe(`${API_BASE}/leads`, { method: 'POST', body: JSON.stringify(formData) });
    return res.json();
  },
  getAllLeads: async (): Promise<Lead[]> => {
    const res = await fetchSafe(`${API_BASE}/leads/all`);
    const json = await res.json();
    return json.success ? json.data : [];
  },
  updateLeadStatus: async (id: string | number, status: string) => {
    const res = await fetchSafe(`${API_BASE}/leads/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status }) 
    });
    const json = await res.json();
    return json.success;
  },
  getUsersByRole: async (role: string, coachId?: string): Promise<UserProfile[]> => {
    const res = await fetchSafe(`${API_BASE}/profiles?role=${role}${coachId ? `&coach_id=${coachId}` : ''}`);
    const json = await res.json();
    return json.success ? json.data : [];
  },
  getMemberProgress: async (memberId: string): Promise<MemberProgress[]> => {
    const res = await fetchSafe(`${API_BASE}/progress?member_id=${memberId}`);
    const json = await res.json();
    return json.success ? json.data : [];
  },
  addProgressLog: async (logData: Partial<MemberProgress>) => {
    const res = await fetchSafe(`${API_BASE}/progress`, { method: 'POST', body: JSON.stringify(logData) });
    return res.ok;
  },
  createProfile: async (data: any) => {
    const res = await fetchSafe(`${API_BASE}/profiles/signup`, { method: 'POST', body: JSON.stringify(data) });
    return res.json();
  },
  getFinancialHealth: async (): Promise<FinancialHealthRecord[]> => {
    const res = await fetchSafe(`${API_BASE}/finance`);
    const json = await res.json();
    return json.success ? json.data : [];
  },
  createCheckoutSession: async (planId: string, customerEmail: string): Promise<string | null> => {
    const res = await fetchSafe(`${API_BASE}/checkout/create-session`, {
      method: 'POST',
      body: JSON.stringify({ planId, customerEmail })
    });
    const json = await res.json();
    return json.success ? json.url : null;
  },
  bootstrapDatabase: async (): Promise<boolean> => {
    const res = await fetchSafe(`${API_BASE}/system/bootstrap`);
    const json = await res.json();
    return json.success === true;
  }
};
