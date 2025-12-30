
import React, { useEffect, useState, useMemo } from 'react';
import { Users, LogOut, RefreshCw, Activity, ShieldAlert, Plus, TrendingUp, Home, Database, Save, X, BrainCircuit, Award, Calendar, CreditCard, Mail, MapPin } from 'lucide-react';

// Fix imports to reference correct modules
import { api } from './api';
import { UserProfile, MemberProgress, Lead, FinancialHealthRecord } from './types';
import { FitnessAnalysisEngine } from './aiService';

import { GoogleGenAI } from "@google/genai";

// --- ADMIN DASHBOARD ---
export const AdminDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [log, setLog] = useState({ weight: '', bodyFat: '', score: '' });

  const load = async () => {
    setLoading(true);
    const [l, m] = await Promise.all([api.getAllLeads(), api.getUsersByRole('member')]);
    setLeads(l); setMembers(m); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleOnboard = async (lead: Lead) => {
    const res = await api.createProfile({ name: lead.name, email: lead.email, role: 'member', password: 'TemporaryPassword123!', activePlanId: 'plan_starter' });
    if (res.success) { await api.updateLeadStatus(lead.id, 'Closed'); load(); }
  };

  const handleLog = async (e: any) => {
    e.preventDefault(); if (!selected) return;
    const ok = await api.addProgressLog({ member_id: selected.id, coach_id: user.id, weight: parseFloat(log.weight), body_fat: parseFloat(log.bodyFat), performance_score: parseInt(log.score), date: new Date().toISOString() });
    if (ok) { setSelected(null); load(); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <aside className="w-72 border-r border-white/5 p-12 flex flex-col">
        <h2 className="text-2xl font-black italic mb-12 uppercase">Vault</h2>
        <nav className="flex-1 space-y-4">
          <button onClick={() => setActiveTab('leads')} className={`w-full text-left p-4 rounded-xl font-black uppercase text-[10px] ${activeTab === 'leads' ? 'bg-fuchsia-600' : ''}`}>Intake</button>
          <button onClick={() => setActiveTab('members')} className={`w-full text-left p-4 rounded-xl font-black uppercase text-[10px] ${activeTab === 'members' ? 'bg-fuchsia-600' : ''}`}>Matrix</button>
          <button onClick={onGoHome} className="w-full text-left p-4 font-black uppercase text-[10px] opacity-50">Exit to Site</button>
        </nav>
        <button onClick={onLogout} className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase"><LogOut className="w-4 h-4" /> Sign Out</button>
      </aside>
      <main className="flex-1 p-16">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">{activeTab}</h1>
          <button onClick={load} className="p-4 bg-zinc-900 rounded-full"><RefreshCw className={loading ? 'animate-spin' : ''} /></button>
        </div>
        <div className="grid gap-6">
          {activeTab === 'leads' && leads.map(l => (
            <div key={l.id} className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 flex justify-between items-center">
              <div><h3 className="text-xl font-black italic uppercase">{l.name}</h3><p className="text-[10px] opacity-50 uppercase tracking-widest">{l.goal}</p></div>
              <button onClick={() => handleOnboard(l)} className="bg-fuchsia-600 px-6 py-2 rounded-full text-[10px] font-black uppercase">Onboard</button>
            </div>
          ))}
          {activeTab === 'members' && members.map(m => (
            <div key={m.id} className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 flex justify-between items-center">
              <div><h3 className="text-xl font-black italic uppercase">{m.name}</h3><p className="text-[10px] opacity-50 uppercase tracking-widest">{m.activePlanId}</p></div>
              <button onClick={() => setSelected(m)} className="bg-white text-black px-6 py-2 rounded-full text-[10px] font-black uppercase">Log Progress</button>
            </div>
          ))}
        </div>
      </main>
      {selected && <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-8 z-[200]">
        <div className="bg-[#020617] border border-white/10 p-12 rounded-[3rem] w-full max-w-md">
          <h2 className="text-3xl font-black italic uppercase mb-8">Log Bio Data</h2>
          <form onSubmit={handleLog} className="space-y-4">
            <input placeholder="Weight" className="w-full bg-white/5 p-4 rounded-xl" value={log.weight} onChange={e => setLog({...log, weight: e.target.value})} />
            <input placeholder="Body Fat %" className="w-full bg-white/5 p-4 rounded-xl" value={log.bodyFat} onChange={e => setLog({...log, bodyFat: e.target.value})} />
            <input placeholder="Performance" className="w-full bg-white/5 p-4 rounded-xl" value={log.score} onChange={e => setLog({...log, score: e.target.value})} />
            <button className="w-full bg-fuchsia-600 py-5 rounded-full font-black uppercase">Commit Data</button>
            <button type="button" onClick={() => setSelected(null)} className="w-full text-zinc-500 font-black uppercase text-[10px]">Cancel</button>
          </form>
        </div>
      </div>}
    </div>
  );
};

// --- MEMBER DASHBOARD ---
export const MemberDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [history, setHistory] = useState<MemberProgress[]>([]);
  useEffect(() => { api.getMemberProgress(user.id).then(setHistory); }, [user.id]);
  const insight = useMemo(() => FitnessAnalysisEngine.analyzeProgress(history), [history]);
  const latest = history[0];
  return (
    <div className="min-h-screen bg-[#020617] text-white p-12">
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-fuchsia-600 rounded-full border-4 border-[#020617] shadow-xl overflow-hidden"><img src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} className="w-full h-full object-cover" /></div>
          <div><h1 className="text-4xl font-black italic uppercase tracking-tighter">{user.name}</h1><p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest">Active Athlete</p></div>
        </div>
        <div className="flex gap-4"><button onClick={onGoHome} className="bg-zinc-900 px-6 py-3 rounded-full text-[10px] font-black uppercase">Home</button><button onClick={onLogout} className="p-3 bg-zinc-900 rounded-full"><LogOut className="w-5 h-5" /></button></div>
      </header>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-fuchsia-900/20 to-zinc-900 border border-fuchsia-500/30 p-10 rounded-[3rem]">
            <h2 className="text-2xl font-black italic uppercase mb-4 text-fuchsia-500">Coach's Analysis</h2>
            <p className="text-xl font-black italic uppercase tracking-tight">"{insight}"</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 text-center"><p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Weight</p><p className="text-4xl font-black">{latest?.weight || '--'} <span className="text-xs">lbs</span></p></div>
            <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 text-center"><p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Efficiency</p><p className="text-4xl font-black text-fuchsia-500 italic">{latest?.performance_score || '--'}</p></div>
            <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 text-center"><p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Body Fat</p><p className="text-4xl font-black">{latest?.body_fat || '--'}%</p></div>
          </div>
        </div>
        <div className="bg-zinc-900/30 p-10 rounded-[3rem] border border-white/5"><h3 className="text-[10px] font-black uppercase tracking-widest mb-6">Staff Contact</h3><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/10 rounded-xl"></div><div><p className="font-black italic uppercase">Coach Bolt</p><p className="text-[9px] text-zinc-500 uppercase">Strategy Specialist</p></div></div><button className="w-full bg-white text-black py-4 mt-8 rounded-full font-black uppercase text-[10px]">Request Briefing</button></div>
      </div>
    </div>
  );
};
