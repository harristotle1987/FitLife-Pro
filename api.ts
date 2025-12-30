
import { GoogleGenAI } from "@google/genai";
import { UserProfile, Lead, TrainingPlan, MemberProgress, FinancialHealthRecord } from './types';
import { TRAINING_PLANS } from './constants';

const API_BASE = '/api';
const TOKEN_KEY = 'fitlife_vault_token';

/**
 * Hardened fetch utility to prevent "Unexpected character" errors by 
 * validating response status and type before parsing.
 */
const fetchSafe = async (url: string, options: any = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    // Catch 404 early to avoid trying to parse HTML as JSON
    if (res.status === 404) {
      return { 
        ok: false, 
        status: 404, 
        json: () => Promise.resolve({ success: false, message: 'Vault endpoint not found. Ensure server is running.' })
      };
    }

    const text = await res.text();
    try {
      const json = text ? JSON.parse(text) : {};
      return { 
        ok: res.ok, 
        status: res.status, 
        json: () => Promise.resolve(json)
      };
    } catch (e) {
      return { 
        ok: false, 
        status: res.status, 
        json: () => Promise.resolve({ success: false, message: 'Malformed server response.' })
      };
    }
  } catch (e) {
    return { 
      ok: false, 
      status: 0, 
      json: () => Promise.resolve({ success: false, message: 'Vault server unreachable.' })
    };
  }
};

export const api = {
  login: async (email: string, pass: string) => {
    const res = await fetchSafe(`${API_BASE}/profiles/login`, { 
      method: 'POST', 
      body: JSON.stringify({ email, password: pass }) 
    });
    const json = await res.json();
    if (json.token) localStorage.setItem(TOKEN_KEY, json.token);
    return json;
  },

  register: async (name: string, email: string, pass: string) => {
    const res = await fetchSafe(`${API_BASE}/profiles/signup`, { 
      method: 'POST', 
      body: JSON.stringify({ name, email, password: pass }) 
    });
    const json = await res.json();
    if (json.token) localStorage.setItem(TOKEN_KEY, json.token);
    return json;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    try {
      const res = await fetchSafe(`${API_BASE}/profiles/me`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      return null;
    }
  },

  getProfile: async (id: string): Promise<UserProfile | null> => {
    try {
      const res = await fetchSafe(`${API_BASE}/profiles/${id}`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      return null;
    }
  },

  getPlans: async (): Promise<TrainingPlan[]> => {
    try {
      const res = await fetchSafe(`${API_BASE}/plans`);
      const json = await res.json();
      return (json.success && json.data?.length) ? json.data : TRAINING_PLANS;
    } catch (err) {
      return TRAINING_PLANS;
    }
  },

  submitLead: async (formData: Lead) => {
    const res = await fetchSafe(`${API_BASE}/leads`, {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    return res.json();
  },

  getAllLeads: async (): Promise<Lead[]> => {
    const res = await fetchSafe(`${API_BASE}/leads/all`);
    const json = await res.json();
    return json.success ? json.data : [];
  },

  updateLeadStatus: async (id: string | number, status: Lead['status']) => {
    const res = await fetchSafe(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return res.ok;
  },

  getUsersByRole: async (role: string, coachId?: string): Promise<UserProfile[]> => {
    const res = await fetchSafe(`${API_BASE}/profiles?role=${role}${coachId ? `&coach_id=${coachId}` : ''}`);
    const json = await res.json();
    return json.success ? json.data : [];
  },

  getFinancialHealth: async (): Promise<FinancialHealthRecord[]> => {
    const res = await fetchSafe(`${API_BASE}/profiles/financial-health`);
    const json = await res.json();
    return json.success ? json.data : [];
  },

  getMemberProgress: async (memberId: string): Promise<MemberProgress[]> => {
    const res = await fetchSafe(`${API_BASE}/progress?member_id=${memberId}`);
    const json = await res.json();
    return json.success ? json.data : [];
  },

  addProgressLog: async (logData: Partial<MemberProgress>) => {
    const res = await fetchSafe(`${API_BASE}/progress`, {
      method: 'POST',
      body: JSON.stringify(logData)
    });
    return res.ok;
  },

  createProfile: async (data: any) => {
    const res = await fetchSafe(`${API_BASE}/profiles/signup`, {
      method: 'POST', 
      body: JSON.stringify(data)
    });
    return res.json();
  },

  createCheckoutSession: async (planId: string, email: string): Promise<string | null> => {
    const res = await fetchSafe(`${API_BASE}/stripe/create-checkout`, {
      method: 'POST',
      body: JSON.stringify({ planId, email })
    });
    const json = await res.json();
    return json.success ? json.url : null;
  }
};
