
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api';
import { Lead, UserProfile, FinancialHealthRecord, TrainingPlan } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, LogOut, RefreshCw, Activity, ShieldAlert, Plus, 
  ChevronRight, AlertCircle, Loader2, DollarSign, PieChart, 
  TrendingUp, Sparkles, UserCheck, Mail, Save, X, Home, Salad, WifiOff, Hammer, Briefcase, Settings
} from 'lucide-react';

const AdminDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'members' | 'staff' | 'protocols' | 'revenue'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [finance, setFinance] = useState<FinancialHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [modalMode, setModalMode] = useState<'progress' | 'nutrition'>('progress');
  const [logData, setLogData] = useState({ weight: '', bodyFat: '', perfScore: '' });
  const [nutritionText, setNutritionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorHint(null);
    try {
      const coachIdFilter = user.role === 'super_admin' ? undefined : user.id;
      const [l, m, a, n, f, p] = await Promise.all([
        api.getAllLeads(),
        api.getUsersByRole('member', coachIdFilter),
        user.role === 'super_admin' ? api.getUsersByRole('admin') : Promise.resolve([]),
        user.role === 'super_admin' ? api.getUsersByRole('nutritionist') : Promise.resolve([]),
        user.role === 'super_admin' ? api.getFinancialHealth() : Promise.resolve([]),
        api.getPlans()
      ]);
      
      setLeads(l || []);
      setMembers(m || []);
      setStaff([...(a || []), ...(n || [])]);
      setFinance(f || []);
      setPlans(p || []);
      if (user.role === 'super_admin' && f.length > 0) generateFinancialInsight(f);
    } catch (err: any) { 
      setErrorHint(err.message || 'The vault database is currently offline.');
    } finally { 
      setLoading(false); 
    }
  }, [user.role, user.id]);

  const generateFinancialInsight = async (data: FinancialHealthRecord[]) => {
    try {
      const mrr = data.reduce((acc, curr) => acc + (curr.monthly_rate || 0), 0);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze a gym MRR of $${mrr.toLocaleString()}. Give 3 high-impact business tips in 2 sentences.`,
      });
      setAiInsight(response.text || '');
    } catch (e) { setAiInsight('VAULT INTELLIGENCE OFFLINE.'); }
  };

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      const ok = await api.bootstrapDatabase();
      if (ok) { alert("Vault Synced."); loadAll(); }
    } finally { setIsBootstrapping(false); }
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  const mrrTotal = useMemo(() => finance.reduce((acc, curr) => acc + (curr.monthly_rate || 0), 0), [finance]);

  return (
    <div className="min-h-screen bg-[#020617] text-zinc-100 flex font-sans">
      {/* Sidebar */}
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
          {[
            { id: 'leads', label: 'Intake', icon: Users },
            { id: 'members', label: 'Matrix', icon: Activity },
            { id: 'staff', label: 'Squad', icon: Briefcase },
            { id: 'protocols', label: 'Offerings', icon: Settings },
            { id: 'revenue', label: 'Capital', icon: DollarSign, role: 'super_admin' }
          ].filter(t => !t.role || t.role === user.role).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
              <tab.icon className="w-4 h-4 mr-4" /> {tab.label}
            </button>
          ))}
        </nav>

        <button onClick={onLogout} className="flex items-center space-x-4 text-zinc-600 hover:text-red-400 font-black uppercase text-[10px] tracking-widest p-6 mt-auto border-t border-white/5">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
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
                  <button onClick={handleBootstrap} className="bg-red-600 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase hover:bg-red-500">
                    {isBootstrapping ? <Loader2 className="animate-spin" /> : "Force Sync"}
                  </button>
               </div>
             )}
          </div>
          <div className="flex gap-4">
             {user.role === 'super_admin' && (
               <div className="bg-zinc-900 px-8 py-4 rounded-3xl border border-white/5 text-right">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Projected MRR</p>
                  <p className="text-2xl font-black text-fuchsia-500">${mrrTotal.toLocaleString()}</p>
               </div>
             )}
             <button onClick={loadAll} className="p-5 bg-zinc-900 border border-white/5 rounded-full hover:border-fuchsia-500 transition-all">
                <RefreshCw className={`w-5 h-5 text-fuchsia-500 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </header>

        {activeTab === 'revenue' && user.role === 'super_admin' && (
          <div className="space-y-8 animate-fade-in">
             <div className="bg-fuchsia-600/10 border border-fuchsia-500/30 p-10 rounded-[3rem] relative overflow-hidden">
                <Sparkles className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
                <h3 className="text-fuchsia-500 font-black uppercase text-[10px] tracking-widest mb-4">Capital Intelligence</h3>
                <p className="text-2xl font-black italic uppercase leading-relaxed max-w-2xl">"{aiInsight || 'CALCULATING BUSINESS TRAJECTORY...'}"</p>
             </div>
             <div className="grid gap-4">
                {finance.map((rec, i) => (
                  <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex justify-between items-center">
                     <div>
                        <h4 className="font-black italic uppercase text-white">{rec.athlete_name}</h4>
                        <p className="text-[9px] text-zinc-500 uppercase">{rec.email}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-lg font-black text-white">${rec.monthly_rate}</p>
                        <p className="text-[8px] font-black text-green-500 uppercase">Status: {rec.status}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
             {members.map(m => (
                <div key={m.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[3rem] group hover:border-fuchsia-500/30 transition-all">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-black text-zinc-600">{m.name.charAt(0)}</div>
                      <div>
                         <h3 className="font-black italic uppercase text-white">{m.name}</h3>
                         <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{m.activePlanId?.replace('plan_', '').toUpperCase()}</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setModalMode('progress'); setSelectedMember(m); }} className="bg-white/5 border border-white/5 text-white py-4 rounded-2xl text-[8px] font-black uppercase hover:bg-white/10">Progress</button>
                      <button onClick={() => { setModalMode('nutrition'); setSelectedMember(m); setNutritionText(m.nutritionalProtocol || ''); }} className="bg-fuchsia-600/10 border border-fuchsia-500/20 text-fuchsia-500 py-4 rounded-2xl text-[8px] font-black uppercase hover:bg-fuchsia-600/20">Fuel Plan</button>
                   </div>
                </div>
             ))}
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
             {plans.map(p => (
                <div key={p.id} className="bg-zinc-900 border border-white/5 p-10 rounded-[3rem] relative">
                   <div className="absolute top-8 right-8 text-fuchsia-500"><TrendingUp className="w-6 h-6" /></div>
                   <h3 className="text-3xl font-black italic uppercase text-white mb-2">{p.name}</h3>
                   <p className="text-zinc-500 text-xs mb-8">{p.description}</p>
                   <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-4xl font-black text-white">${parseFloat(p.price as any).toFixed(0)}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Per Protocol</span>
                   </div>
                   <button className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Edit Protocol</button>
                </div>
             ))}
          </div>
        )}

        {selectedMember && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
              <div className="bg-[#020617] border border-white/10 w-full max-w-lg rounded-[3rem] p-10 relative">
                 <button onClick={() => setSelectedMember(null)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X /></button>
                 <h2 className="text-3xl font-black italic uppercase text-white mb-2">{modalMode === 'progress' ? 'Bio-Data Log' : 'Fuel Protocol'}</h2>
                 <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-8">Subject: {selectedMember.name}</p>
                 
                 {modalMode === 'progress' ? (
                   <form onSubmit={async (e) => {
                      e.preventDefault();
                      setSubmitting(true);
                      await api.addProgressLog({ member_id: selectedMember.id, weight: parseFloat(logData.weight), body_fat: parseFloat(logData.bodyFat), performance_score: parseInt(logData.perfScore), coach_id: user.id });
                      setSelectedMember(null);
                      setSubmitting(false);
                      loadAll();
                   }} className="space-y-4">
                      <input placeholder="Weight" className="w-full bg-white/5 p-4 rounded-2xl outline-none" onChange={e => setLogData({...logData, weight: e.target.value})} />
                      <input placeholder="Body Fat %" className="w-full bg-white/5 p-4 rounded-2xl outline-none" onChange={e => setLogData({...logData, bodyFat: e.target.value})} />
                      <input placeholder="Score (0-100)" className="w-full bg-white/5 p-4 rounded-2xl outline-none" onChange={e => setLogData({...logData, perfScore: e.target.value})} />
                      <button disabled={submitting} className="w-full bg-fuchsia-600 py-5 rounded-full font-black uppercase">Commit Matrix</button>
                   </form>
                 ) : (
                   <div className="space-y-4">
                      <textarea className="w-full h-64 bg-white/5 border border-white/10 text-white p-6 rounded-3xl outline-none font-mono text-xs" value={nutritionText} onChange={e => setNutritionText(e.target.value)} />
                      <button onClick={async () => {
                         setSubmitting(true);
                         await api.createProfile({ ...selectedMember, nutritionalProtocol: nutritionText }); // Using createProfile as placeholder for update
                         setSelectedMember(null);
                         setSubmitting(false);
                         loadAll();
                      }} disabled={submitting} className="w-full bg-fuchsia-600 py-5 rounded-full font-black uppercase">Save Fuel Plan</button>
                   </div>
                 )}
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
