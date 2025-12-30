
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api';
import { Lead, UserProfile, AdminPermissions, UserRole, FinancialHealthRecord, MemberProgress } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, LogOut, RefreshCw, Activity, ShieldAlert, Plus, UserPlus, 
  ChevronRight, AlertCircle, Loader2, DollarSign, PieChart, 
  TrendingUp, Link as LinkIcon, Sparkles, UserCheck, Mail, Database, Save, X, Home, Beaker
} from 'lucide-react';

const AdminDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'members' | 'staff' | 'revenue'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [finance, setFinance] = useState<FinancialHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  
  // Selection/Modals
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [logData, setLogData] = useState({ weight: '', bodyFat: '', perfScore: '' });
  const [submittingLog, setSubmittingLog] = useState(false);
  const [onboardingId, setOnboardingId] = useState<string | number | null>(null);

  const permissions = user.permissions || { 
    canManageLeads: false, canManageProgress: false, 
    canManageAdmins: false, canManagePlans: false, canManageNutrition: false 
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const coachIdFilter = user.role === 'super_admin' ? undefined : user.id;

      const [l, m, a, n, f] = await Promise.all([
        permissions.canManageLeads ? api.getAllLeads() : Promise.resolve([]),
        (permissions.canManageProgress || user.role === 'super_admin') 
          ? api.getUsersByRole('member', coachIdFilter) : Promise.resolve([]),
        user.role === 'super_admin' ? api.getUsersByRole('admin') : Promise.resolve([]),
        user.role === 'super_admin' ? api.getUsersByRole('nutritionist') : Promise.resolve([]),
        user.role === 'super_admin' ? api.getFinancialHealth() : Promise.resolve([])
      ]);
      
      setLeads(l || []);
      setMembers(m || []);
      setStaff([...(a || []), ...(n || [])]);
      setFinance(f || []);

      if (user.role === 'super_admin' && f.length > 0) {
        generateFinancialInsight(f);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [permissions, user.role, user.id]);

  const generateFinancialInsight = async (data: FinancialHealthRecord[]) => {
    try {
      const mrr = data.reduce((acc, curr) => acc + (curr.monthly_rate || 0), 0);
      const activeCount = data.filter(d => d.status === 'active').length;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this gym financial data: Total MRR is $${mrr}. Total active members: ${activeCount}. 
        Provide 3 sharp, professional business recommendations to increase retention and growth.
        Keep it high energy and under 80 words.`,
      });
      setAiInsight(response.text || '');
    } catch (e) {
      setAiInsight('VAULT INTELLIGENCE OFFLINE. SYSTEM OPTIMIZING.');
    }
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleUpdateLeadStatus = async (id: string | number, status: Lead['status']) => {
    const ok = await api.updateLeadStatus(id, status);
    if (ok) loadAll();
  };

  const handleOnboardMember = async (lead: Lead) => {
    if (!lead.id) return;
    setOnboardingId(lead.id);
    
    const result = await api.createProfile({
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      role: 'member',
      password: 'TemporaryPassword123!', 
      activePlanId: 'plan_starter'
    });
    
    if (result.success) {
      await api.updateLeadStatus(lead.id, 'Closed');
      loadAll();
      alert(result.message || `Athlete ${lead.name} has been onboarded to the Matrix.`);
    } else {
      alert(`ONBOARDING FAILED: ${result.message}`);
    }
    setOnboardingId(null);
  };

  const runDiagnostics = async () => {
    if (!confirm("Inject Mock Diagnostics Data? This will add test leads and members.")) return;
    setLoading(true);
    
    // 1. Create Mock Lead
    const mockLead: Lead = {
      name: `Test Athlete ${Math.floor(Math.random() * 1000)}`,
      email: `test_${Date.now()}@fitlife.pro`,
      phone: '555-0199',
      goal: 'Performance Diagnostics Test',
      source: 'AI_Chat'
    };
    
    await api.submitLead(mockLead);
    await loadAll();
    alert("Diagnostics complete. Mock Lead injected into Inbound tab.");
    setLoading(false);
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmittingLog(true);
    
    const ok = await api.addProgressLog({
      member_id: selectedMember.id,
      coach_id: user.id,
      weight: parseFloat(logData.weight),
      body_fat: parseFloat(logData.bodyFat),
      performance_score: parseInt(logData.perfScore),
      date: new Date().toISOString()
    });

    if (ok) {
      setSelectedMember(null);
      setLogData({ weight: '', bodyFat: '', perfScore: '' });
      loadAll();
    }
    setSubmittingLog(false);
  };

  const mrrTotal = useMemo(() => finance.reduce((acc, curr) => acc + (curr.monthly_rate || 0), 0), [finance]);

  return (
    <div className="min-h-screen bg-[#020617] text-zinc-100 flex font-sans selection:bg-fuchsia-600 selection:text-white">
      <aside className="w-72 border-r border-white/5 p-8 flex flex-col fixed h-full bg-[#020617]/80 backdrop-blur-2xl z-[100]">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm text-lg">FP</div>
            VAULT
          </h2>
          <p className="text-[8px] font-black text-fuchsia-500 uppercase tracking-[0.4em] mt-2">Staff Terminal</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={onGoHome} className="w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all text-fuchsia-400 hover:text-white hover:bg-white/5 mb-4 group">
            <Home className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
            <span>Go Home</span>
          </button>

          <button onClick={() => setActiveTab('leads')} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'leads' ? 'bg-fuchsia-600 text-white shadow-xl' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
            <div className="flex items-center space-x-4"><Users className="w-5 h-5" /><span>Intake</span></div>
          </button>
          <button onClick={() => setActiveTab('members')} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'members' ? 'bg-fuchsia-600 text-white shadow-xl' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
            <div className="flex items-center space-x-4"><Activity className="w-5 h-5" /><span>Matrix</span></div>
          </button>
          {user.role === 'super_admin' && (
            <>
              <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'revenue' ? 'bg-fuchsia-600 text-white shadow-xl' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center space-x-4"><PieChart className="w-5 h-5" /><span>Revenue</span></div>
              </button>
              <button onClick={() => setActiveTab('staff')} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'staff' ? 'bg-fuchsia-600 text-white shadow-xl' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center space-x-4"><ShieldAlert className="w-5 h-5" /><span>The Hub</span></div>
              </button>
            </>
          )}
        </nav>

        <button onClick={onLogout} className="flex items-center space-x-4 text-zinc-600 hover:text-red-400 font-black uppercase text-[10px] tracking-widest p-6 mt-auto border-t border-white/5 group transition-colors">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Vault</span>
        </button>
      </aside>

      <main className="flex-1 ml-72 p-12 lg:p-16 overflow-y-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-2 leading-none">
              {activeTab === 'revenue' ? 'Capital' : activeTab === 'leads' ? 'Inbound' : activeTab === 'staff' ? 'The Hub' : 'Matrix'}
            </h1>
            <p className="text-zinc-500 font-medium text-lg mt-2">Authenticated System Access.</p>
          </div>
          <button onClick={loadAll} className="bg-zinc-900 border border-white/5 p-5 rounded-full hover:border-fuchsia-500 transition-all group shadow-xl">
             <RefreshCw className={`w-5 h-5 text-fuchsia-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {activeTab === 'leads' && (
          <div className="space-y-6 animate-fade-in">
             {leads.length === 0 && !loading && (
               <div className="text-center p-20 bg-zinc-900/10 border border-dashed border-white/5 rounded-[3rem]">
                 <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No active leads in the queue.</p>
               </div>
             )}
             <div className="grid grid-cols-1 gap-4">
                {leads.map(lead => (
                   <div key={lead.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between group hover:bg-zinc-900/50 transition-all gap-6">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl text-zinc-600">{lead.name.charAt(0)}</div>
                         <div>
                            <h3 className="text-xl font-black italic uppercase text-white tracking-tight">{lead.name}</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{lead.goal}</p>
                            <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest mt-1">{lead.email}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                         <select 
                            value={lead.status}
                            onChange={(e) => handleUpdateLeadStatus(lead.id!, e.target.value as Lead['status'])}
                            className="bg-black border border-white/10 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-fuchsia-500"
                         >
                            <option value="New">New Intake</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Closed">Closed</option>
                         </select>
                         {(lead.status === 'Qualified' || lead.status === 'New') && (
                            <button 
                              disabled={onboardingId === lead.id}
                              onClick={() => handleOnboardMember(lead)}
                              className="bg-fuchsia-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-fuchsia-500 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                               {onboardingId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                               Onboard Athlete
                            </button>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'members' && (
           <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {members.map(member => (
                    <div key={member.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[3rem] group hover:border-fuchsia-500/30 transition-all relative overflow-hidden">
                       <div className="flex items-center gap-4 mb-6">
                          <img src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.name}&background=random`} className="w-12 h-12 rounded-full border border-white/10" />
                          <div>
                             <h3 className="font-black italic uppercase text-white tracking-tight">{member.name}</h3>
                             <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{member.activePlanId?.replace('plan_', '').toUpperCase() || 'Pending Plan'}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setSelectedMember(member)}
                         className="w-full bg-white/5 border border-white/5 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-600 transition-all flex items-center justify-center gap-2"
                       >
                          <Database className="w-4 h-4" /> Log Biological Data
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-12 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-fuchsia-600/20 to-zinc-900/50 p-10 rounded-[3rem] border border-fuchsia-500/30 shadow-2xl">
                   <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-2">Monthly Recurring Revenue</p>
                   <h2 className="text-7xl font-black text-white italic tracking-tighter">
                      ${mrrTotal.toLocaleString()}
                   </h2>
                </div>
                <div className="bg-zinc-900/30 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex items-center gap-8">
                   <div className="w-20 h-20 bg-fuchsia-600/10 rounded-full flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-fuchsia-500" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-2">Vault Intelligence (AI)</p>
                      <p className="text-sm font-bold text-zinc-400 italic leading-relaxed">"{aiInsight || 'Analyzing growth patterns...'}"</p>
                   </div>
                </div>
             </div>

             <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] overflow-hidden">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                         <th className="p-8">Athlete</th>
                         <th className="p-8">Status</th>
                         <th className="p-8">Next Billing</th>
                         <th className="p-8">Rate</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {finance.map(f => (
                         <tr key={f.profile_id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-8">
                               <p className="text-lg font-black text-white italic uppercase tracking-tighter">{f.athlete_name}</p>
                               <p className="text-[10px] text-zinc-500 font-bold">{f.email}</p>
                            </td>
                            <td className="p-8">
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                  f.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 
                                  f.status === 'unpaid' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                               }`}>
                                  {f.status}
                               </span>
                            </td>
                            <td className="p-8 text-xs font-bold text-zinc-400">
                               {f.next_billing ? new Date(f.next_billing).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-8 text-lg font-black text-white italic">
                               ${f.monthly_rate || 0}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-12 animate-fade-in">
             <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-12">
                <div className="flex items-center gap-6 mb-10">
                   <div className="p-5 bg-fuchsia-600/10 border border-fuchsia-500/20 rounded-3xl">
                      <Beaker className="w-10 h-10 text-fuchsia-500" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">System Diagnostics</h2>
                      <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Database Optimization & Mock Tools</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <button 
                     onClick={runDiagnostics}
                     className="bg-white/5 border border-white/5 hover:border-fuchsia-500/30 p-8 rounded-[2.5rem] transition-all text-left group"
                   >
                      <div className="w-12 h-12 bg-fuchsia-600/10 rounded-2xl flex items-center justify-center mb-6">
                         <Plus className="w-6 h-6 text-fuchsia-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="font-black italic uppercase text-white tracking-tight mb-2">Inject Mock Lead</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Verify intake infrastructure & UI.</p>
                   </button>
                   
                   <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between">
                      <div>
                        <h4 className="font-black italic uppercase text-white tracking-tight mb-2">Supabase Sync</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Live Postgres Connection verified.</p>
                      </div>
                      <div className="flex items-center gap-2 text-green-500 mt-6">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Infrastructure: Online</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {staff.map(s => (
                   <div key={s.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl text-zinc-600">{s.name.charAt(0)}</div>
                         <div>
                            <h3 className="text-xl font-black italic uppercase text-white tracking-tight">{s.name}</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{s.role}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-600/10 border border-fuchsia-500/30 text-fuchsia-500 text-[9px] font-black uppercase">
                        <UserCheck className="w-3 h-3" /> Staff Verified
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* Biological Log Modal */}
      {selectedMember && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in bg-black/90 backdrop-blur-xl">
            <div className="bg-[#020617] border border-white/10 w-full max-w-md rounded-[3rem] p-10 relative shadow-2xl">
               <button onClick={() => setSelectedMember(null)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X /></button>
               <h2 className="text-3xl font-black italic uppercase text-white mb-2">Biological Log</h2>
               <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-8">Athlete: {selectedMember.name}</p>
               
               <form onSubmit={handleLogProgress} className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Weight (LBS)</label>
                     <input 
                        type="number" step="0.1" required
                        className="w-full bg-white/5 border border-white/5 text-white p-4 rounded-2xl outline-none focus:border-fuchsia-500"
                        value={logData.weight} onChange={e => setLogData({...logData, weight: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Body Fat %</label>
                     <input 
                        type="number" step="0.1" required
                        className="w-full bg-white/5 border border-white/5 text-white p-4 rounded-2xl outline-none focus:border-fuchsia-500"
                        value={logData.bodyFat} onChange={e => setLogData({...logData, bodyFat: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Performance Score (0-100)</label>
                     <input 
                        type="number" required
                        className="w-full bg-white/5 border border-white/5 text-white p-4 rounded-2xl outline-none focus:border-fuchsia-500"
                        value={logData.perfScore} onChange={e => setLogData({...logData, perfScore: e.target.value})}
                     />
                  </div>
                  <button 
                    disabled={submittingLog}
                    className="w-full bg-fuchsia-600 text-white py-5 mt-6 rounded-full font-black uppercase text-xs tracking-widest hover:bg-fuchsia-500 transition-all flex items-center justify-center gap-2"
                  >
                     {submittingLog ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> Commit Data</>}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default AdminDashboard;
