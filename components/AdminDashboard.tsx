
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api';
import { Lead, UserProfile, FinancialHealthRecord, TrainingPlan } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, LogOut, RefreshCw, Activity, ShieldAlert, Plus, 
  ChevronRight, AlertCircle, Loader2, DollarSign, PieChart, 
  TrendingUp, Sparkles, UserCheck, Mail, Save, X, Home, Salad, WifiOff, Hammer, Briefcase, Settings, UserPlus, CheckCircle, Database
} from 'lucide-react';

const AdminDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'members' | 'staff' | 'protocols' | 'revenue'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [dbHost, setDbHost] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  
  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorHint(null);
    try {
      // Check health and get host info
      const healthRes = await fetch('/api/system/health');
      const healthData = await healthRes.json();
      if (healthData.success) setDbHost(healthData.host);

      const coachIdFilter = user.role === 'super_admin' ? undefined : user.id;
      const [l, m] = await Promise.all([
        api.getAllLeads(),
        api.getUsersByRole('member', coachIdFilter)
      ]);
      
      setLeads(l || []);
      setMembers(m || []);
    } catch (err: any) { 
      setErrorHint(err.message || 'Vault infrastructure unresponsive.');
    } finally { 
      setLoading(false); 
    }
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      const ok = await api.bootstrapDatabase();
      if (ok) { alert("Vault Core Resynced."); loadAll(); }
    } finally { setIsBootstrapping(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-zinc-100 flex font-sans">
      <aside className="w-72 border-r border-white/5 p-8 flex flex-col fixed h-full bg-[#020617] z-[100]">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm text-lg">FP</div>
            VAULT
          </h2>
          <p className="text-[8px] font-black text-fuchsia-500 uppercase tracking-[0.4em] mt-2">{user.role}</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button onClick={onGoHome} className="w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
            <Home className="w-4 h-4 mr-4" /> Go Home
          </button>
          <button onClick={() => setActiveTab('leads')} className={`w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'leads' ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
            <Users className="w-4 h-4 mr-4" /> Intake
          </button>
          <button onClick={() => setActiveTab('members')} className={`w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'members' ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
            <Activity className="w-4 h-4 mr-4" /> Matrix
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
           <div className="flex items-center gap-2 mb-4 px-4 text-zinc-500">
              <Database className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest truncate">{dbHost || 'Identifying...'}</span>
           </div>
           <button onClick={onLogout} className="flex items-center space-x-4 text-zinc-600 hover:text-red-400 font-black uppercase text-[10px] tracking-widest px-4">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-12 lg:p-16">
        <header className="flex justify-between items-end mb-16">
          <div className="flex-1">
             <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">{activeTab}</h1>
             {errorHint && (
               <div className="flex items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-500 animate-pulse">
                  <WifiOff className="w-6 h-6 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">Infrastructure Alert</p>
                    <p className="text-sm font-medium">{errorHint}</p>
                  </div>
                  <button onClick={handleBootstrap} className="bg-red-600 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase hover:bg-red-500 transition-all">
                    {isBootstrapping ? <Loader2 className="animate-spin" /> : "Force Sync"}
                  </button>
               </div>
             )}
          </div>
          <button onClick={loadAll} className="p-5 bg-zinc-900 border border-white/5 rounded-full hover:border-fuchsia-500 transition-all">
             <RefreshCw className={`w-5 h-5 text-fuchsia-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {activeTab === 'leads' && (
          <div className="space-y-4 animate-fade-in">
             {leads.map(lead => (
                <div key={lead.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div>
                      <h3 className="text-xl font-black italic uppercase text-white">{lead.name}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-black">{lead.email} // {lead.phone}</p>
                      <p className="text-xs text-zinc-400 mt-4 italic">"{lead.goal}"</p>
                   </div>
                   <button onClick={() => alert('Onboarding logic initialized.')} className="bg-white text-black px-6 py-3 rounded-full text-[9px] font-black uppercase hover:bg-zinc-200 transition-all">Onboard Athlete</button>
                </div>
             ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
             {members.map(m => (
                <div key={m.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[3rem] group">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-black text-zinc-600">{m.name.charAt(0)}</div>
                      <h3 className="font-black italic uppercase text-white">{m.name}</h3>
                   </div>
                   <button onClick={() => alert('Opening Matrix Logs...')} className="w-full bg-white/5 border border-white/5 text-white py-4 rounded-2xl text-[8px] font-black uppercase hover:bg-white/10 transition-all">View Bio-Data</button>
                </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
