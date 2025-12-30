
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api';
import { Lead, UserProfile, UserRole, FinancialHealthRecord, MemberProgress } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, LogOut, RefreshCw, Activity, ShieldAlert, Plus, UserPlus, 
  ChevronRight, AlertCircle, Loader2, DollarSign, PieChart, 
  TrendingUp, Link as LinkIcon, Sparkles, UserCheck, Mail, Database, Save, X, Home, Beaker, Salad, Info
} from 'lucide-react';

const AdminDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'members' | 'staff' | 'revenue'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [finance, setFinance] = useState<FinancialHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [modalMode, setModalMode] = useState<'progress' | 'nutrition'>('progress');
  const [logData, setLogData] = useState({ weight: '', bodyFat: '', perfScore: '' });
  const [nutritionText, setNutritionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [onboardingId, setOnboardingId] = useState<string | number | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const coachIdFilter = user.role === 'super_admin' ? undefined : user.id;
      const [l, m, a, n, f] = await Promise.all([
        api.getAllLeads(),
        api.getUsersByRole('member', coachIdFilter),
        user.role === 'super_admin' ? api.getUsersByRole('admin') : Promise.resolve([]),
        user.role === 'super_admin' ? api.getUsersByRole('nutritionist') : Promise.resolve([]),
        user.role === 'super_admin' ? api.getFinancialHealth() : Promise.resolve([])
      ]);
      setLeads(l || []);
      setMembers(m || []);
      setStaff([...(a || []), ...(n || [])]);
      setFinance(f || []);
      if (user.role === 'super_admin' && f.length > 0) generateFinancialInsight(f);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user.role, user.id]);

  const generateFinancialInsight = async (data: FinancialHealthRecord[]) => {
    try {
      const mrr = data.reduce((acc, curr) => acc + (curr.monthly_rate || 0), 0);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Financial context: MRR $${mrr}. 3 short business optimization tips for a luxury gym.`,
      });
      setAiInsight(response.text || '');
    } catch (e) { setAiInsight('VAULT INTELLIGENCE OFFLINE.'); }
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmitting(true);
    const ok = await api.addProgressLog({
      member_id: selectedMember.id,
      coach_id: user.id,
      weight: parseFloat(logData.weight),
      body_fat: parseFloat(logData.bodyFat),
      performance_score: parseInt(logData.perfScore),
    });
    if (ok) { setSelectedMember(null); setLogData({ weight: '', bodyFat: '', perfScore: '' }); loadAll(); }
    setSubmitting(false);
  };

  const handleUpdateNutrition = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      // Direct call to update profile via generic method if available, or fetchSafe
      const response = await fetch('/api/profiles/' + selectedMember.id, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fitlife_vault_token')}`
        },
        body: JSON.stringify({ nutritionalProtocol: nutritionText })
      });
      if (response.ok) { setSelectedMember(null); loadAll(); }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-zinc-100 flex font-sans selection:bg-fuchsia-600 selection:text-white">
      <aside className="w-72 border-r border-white/5 p-8 flex flex-col fixed h-full bg-[#020617]/80 backdrop-blur-2xl z-[100]">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm text-lg">FP</div>
            VAULT
          </h2>
          <p className="text-[8px] font-black text-fuchsia-500 uppercase tracking-[0.4em] mt-2">Level: {user.role.toUpperCase()}</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={onGoHome} className="w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-fuchsia-400 hover:text-white hover:bg-white/5 group">
            <Home className="w-5 h-5 mr-4" /> Go Home
          </button>
          <button onClick={() => setActiveTab('leads')} className={`w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest ${activeTab === 'leads' ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
            <Users className="w-5 h-5 mr-4" /> Intake
          </button>
          <button onClick={() => setActiveTab('members')} className={`w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest ${activeTab === 'members' ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
            <Activity className="w-5 h-5 mr-4" /> Matrix
          </button>
          {user.role === 'super_admin' && (
            <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest ${activeTab === 'revenue' ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
              <PieChart className="w-5 h-5 mr-4" /> Capital
            </button>
          )}
        </nav>

        <button onClick={onLogout} className="flex items-center space-x-4 text-zinc-600 hover:text-red-400 font-black uppercase text-[10px] tracking-widest p-6 mt-auto border-t border-white/5">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </aside>

      <main className="flex-1 ml-72 p-12 lg:p-16">
        <header className="flex justify-between items-end mb-16">
          <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">{activeTab}</h1>
          <button onClick={loadAll} className="p-5 bg-zinc-900 border border-white/5 rounded-full hover:border-fuchsia-500 transition-all">
             <RefreshCw className={`w-5 h-5 text-fuchsia-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
             {members.map(member => (
                <div key={member.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[3rem] group hover:border-fuchsia-500/30 transition-all">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-600">{member.name.charAt(0)}</div>
                      <div>
                         <h3 className="font-black italic uppercase text-white">{member.name}</h3>
                         <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{member.activePlanId?.replace('plan_', '').toUpperCase()}</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { setModalMode('progress'); setSelectedMember(member); }}
                        className="bg-white/5 border border-white/5 text-white py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-white/10"
                      >
                         <Activity className="w-3 h-3 mx-auto mb-1" /> Progress
                      </button>
                      <button 
                        onClick={() => { setModalMode('nutrition'); setSelectedMember(member); setNutritionText(member.nutritionalProtocol || ''); }}
                        className="bg-fuchsia-600/10 border border-fuchsia-500/20 text-fuchsia-500 py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-fuchsia-600/20"
                      >
                         <Salad className="w-3 h-3 mx-auto mb-1" /> Fuel Plan
                      </button>
                   </div>
                </div>
             ))}
          </div>
        )}

        {/* Unified Staff Modal */}
        {selectedMember && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in bg-black/90 backdrop-blur-xl">
              <div className="bg-[#020617] border border-white/10 w-full max-w-lg rounded-[3rem] p-10 relative">
                 <button onClick={() => setSelectedMember(null)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X /></button>
                 <h2 className="text-3xl font-black italic uppercase text-white mb-2">{modalMode === 'progress' ? 'Biological Log' : 'Fuel Protocol'}</h2>
                 <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-8">Subject: {selectedMember.name}</p>
                 
                 {modalMode === 'progress' ? (
                   <form onSubmit={handleLogProgress} className="space-y-4">
                      <input placeholder="Weight (LBS)" className="w-full bg-white/5 p-4 rounded-2xl outline-none" value={logData.weight} onChange={e => setLogData({...logData, weight: e.target.value})} />
                      <input placeholder="Body Fat %" className="w-full bg-white/5 p-4 rounded-2xl outline-none" value={logData.bodyFat} onChange={e => setLogData({...logData, bodyFat: e.target.value})} />
                      <input placeholder="Performance (0-100)" className="w-full bg-white/5 p-4 rounded-2xl outline-none" value={logData.perfScore} onChange={e => setLogData({...logData, perfScore: e.target.value})} />
                      <button disabled={submitting} className="w-full bg-fuchsia-600 py-5 rounded-full font-black uppercase text-xs tracking-widest">Commit Log</button>
                   </form>
                 ) : (
                   <div className="space-y-4">
                      <textarea 
                        className="w-full h-64 bg-white/5 border border-white/10 text-white p-6 rounded-3xl outline-none focus:border-fuchsia-500 font-mono text-xs leading-relaxed"
                        placeholder="Define macronutrient targets and timing..."
                        value={nutritionText}
                        onChange={(e) => setNutritionText(e.target.value)}
                      />
                      <button 
                        onClick={handleUpdateNutrition}
                        disabled={submitting}
                        className="w-full bg-fuchsia-600 py-5 rounded-full font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                      >
                         {submitting ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> Save Protocol</>}
                      </button>
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
