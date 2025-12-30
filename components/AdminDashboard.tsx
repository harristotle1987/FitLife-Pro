
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Lead, UserProfile, UserRole } from '../types';
import { FitnessChatSession } from '../aiService';
import { 
  Users, LogOut, RefreshCw, Activity, Menu, X, 
  Loader2, Sparkles, Home, Database, Sword, Terminal,
  LayoutDashboard, Layers, ShieldCheck, UserPlus, Plus, ShieldAlert, Phone,
  Settings, User, CheckSquare, Square, Info, Briefcase, ChevronRight, UserCheck,
  Mail
} from 'lucide-react';

const AdminDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'members' | 'staff' | 'protocols'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);

  // Manual Add Form State
  const [manualUser, setManualUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'member' as UserRole, 
    phone: '',
    permissions: {
      canManageLeads: false,
      canManageMatrix: false,
      canManageSquad: false,
      canManagePlans: false,
      canManageNutrition: false
    }
  });
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  
  const hasPermission = (perm: string) => {
    if (user.role === 'super_admin') return true;
    const p = user.permissions as any;
    if (p?.all) return true;
    return !!p?.[perm];
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [l, m, s, p] = await Promise.all([
        hasPermission('canManageLeads') ? api.getAllLeads() : Promise.resolve([]),
        hasPermission('canManageMatrix') ? api.getUsersByRole('member') : Promise.resolve([]),
        hasPermission('canManageSquad') ? api.getUsersByRole('admin') : Promise.resolve([]),
        api.getPlans()
      ]);
      setLeads(l || []);
      setMembers(m || []);
      setStaff(s || []);
      setPlans(p || []);
    } catch (err: any) { 
      console.error("Data fetch error", err);
    } finally { 
      setLoading(false); 
    }
  }, [user]);

  useEffect(() => { 
    // Set default tab based on first available permission
    const available = [
      { id: 'leads', perm: 'canManageLeads' },
      { id: 'members', perm: 'canManageMatrix' },
      { id: 'staff', perm: 'canManageSquad' },
      { id: 'protocols', perm: 'canManagePlans' }
    ].find(i => hasPermission(i.perm));
    
    if (available) setActiveTab(available.id as any);
    loadAll(); 
  }, [loadAll]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingManual(true);
    try {
      const res = await api.createProfile(manualUser);
      if (res.success) {
        setShowManualAdd(false);
        setManualUser({ name: '', email: '', password: '', role: 'member', phone: '', permissions: { canManageLeads: false, canManageMatrix: false, canManageSquad: false, canManagePlans: false, canManageNutrition: false } });
        loadAll();
      } else alert(res.message);
    } finally { setIsCreatingManual(false); }
  };

  const assignCoach = async (memberId: string, coachName: string) => {
    try {
      const res = await fetch(`/api/profiles/${memberId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('fitlife_vault_key_2024')}` 
        },
        body: JSON.stringify({ assignedCoachName: coachName })
      });
      const data = await res.json();
      if (data.success) {
        loadAll();
        setSelectedMember(null);
      }
    } catch (err) {
      alert("Failed to update unit assignment.");
    }
  };

  const navItems = [
    { id: 'leads', label: 'Intake', icon: Users, perm: 'canManageLeads' },
    { id: 'members', label: 'Athlete Matrix', icon: Activity, perm: 'canManageMatrix' },
    { id: 'staff', label: 'Squad Deployment', icon: ShieldCheck, perm: 'canManageSquad' },
    { id: 'protocols', label: 'Protocol Lab', icon: Layers, perm: 'canManagePlans' },
  ].filter(item => hasPermission(item.perm));

  return (
    <div className="min-h-screen bg-[#020617] text-zinc-100 flex font-sans overflow-hidden">
      {/* Sidebar - Fix: Identification of Sub-Admin vs Super-Admin Identity */}
      <aside className={`fixed lg:relative w-72 h-full bg-[#020617] border-r border-white/5 p-8 flex flex-col z-[120] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-lg font-black italic text-xl">FP</div>
            <div>
              <h2 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">VAULT</h2>
              <p className="text-[8px] font-black text-fuchsia-500 uppercase tracking-[0.4em] mt-1">Status: Online</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
             <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Identity Verified</p>
             <p className="text-sm font-black italic text-white truncate">{user.name}</p>
             <p className="text-[8px] font-black text-fuchsia-500 uppercase tracking-widest mt-1">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={onGoHome} className="w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
            <Home className="w-4 h-4 mr-4" /> Exit Vault
          </button>
          <div className="h-px w-full bg-white/5 my-4"></div>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === item.id ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : 'text-zinc-500 hover:bg-white/5'}`}>
              <item.icon className="w-4 h-4 mr-4" /> {item.label}
            </button>
          ))}
        </nav>
        
        <button onClick={onLogout} className="mt-auto w-full flex items-center justify-center gap-3 bg-red-950/20 border border-red-900/20 text-red-500 hover:bg-red-900/30 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
          <LogOut className="w-4 h-4" /> Terminate Session
        </button>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar p-12 lg:p-16 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-950/10 via-transparent to-transparent">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
             <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">{activeTab}</h1>
             <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-4 flex items-center gap-2">
               <Database className="w-3 h-3" /> INFRASTRUCTURE LAYER: {activeTab.toUpperCase()} // ACTIVE
             </p>
          </div>
          <div className="flex gap-4">
             {activeTab === 'staff' && user.role === 'super_admin' && (
                <button onClick={() => { setManualUser({...manualUser, role: 'admin'}); setShowManualAdd(true); }} className="bg-fuchsia-600 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl"><ShieldCheck className="w-4 h-4" /> New Operator</button>
             )}
             {activeTab === 'members' && (
                <button onClick={() => { setManualUser({...manualUser, role: 'member'}); setShowManualAdd(true); }} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><UserPlus className="w-4 h-4" /> New Athlete</button>
             )}
             <button onClick={loadAll} className="p-5 bg-zinc-900 border border-white/5 rounded-full hover:border-fuchsia-500 transition-all group">
                <RefreshCw className={`w-5 h-5 text-fuchsia-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
             </button>
          </div>
        </header>

        <div className="animate-fade-in">
          {activeTab === 'leads' && (
            <div className="grid gap-6">
              {leads.length === 0 ? (
                <div className="p-20 text-center bg-zinc-900/20 border border-dashed border-white/5 rounded-[3rem]">
                   <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                   <p className="text-zinc-600 font-black uppercase text-xs">No active intakes in queue.</p>
                </div>
              ) : leads.map(lead => (
                <div key={lead.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-white/10 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-2xl font-black italic uppercase text-white">{lead.name}</h3>
                       <span className="bg-fuchsia-600/10 text-fuchsia-500 text-[8px] px-2 py-0.5 rounded font-black uppercase">{lead.status}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{lead.email} // {lead.phone}</p>
                    <div className="mt-4 p-5 bg-black/40 rounded-2xl text-xs text-zinc-300 italic border border-white/5">
                      <span className="text-fuchsia-500 font-black not-italic text-[8px] uppercase block mb-1">STATED GOAL:</span>
                      "{lead.goal}"
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="bg-zinc-800 text-zinc-400 px-6 py-4 rounded-full font-black uppercase text-[10px] hover:text-white transition-all">Dismiss</button>
                    <button className="bg-white text-black px-10 py-4 rounded-full font-black uppercase text-[10px] shadow-xl hover:scale-105 transition-all">Deploy Onboarding</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.length === 0 ? (
                 <div className="col-span-full p-20 text-center bg-zinc-900/20 border border-dashed border-white/5 rounded-[3rem]">
                   <Activity className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                   <p className="text-zinc-600 font-black uppercase text-xs">Athlete Matrix Offline: Zero Deployments Found.</p>
                </div>
              ) : members.map(m => (
                <div key={m.id} onClick={() => setSelectedMember(m)} className="cursor-pointer bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] group hover:border-fuchsia-500/50 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-600/5 blur-3xl pointer-events-none"></div>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#020617] border border-white/5 flex items-center justify-center font-black text-2xl text-fuchsia-500 shadow-inner">{m.name.charAt(0)}</div>
                    <div>
                      <h3 className="text-xl font-black italic uppercase text-white group-hover:text-fuchsia-400 transition-colors">{m.name}</h3>
                      <p className="text-[9px] text-zinc-500 font-black uppercase mt-1">Tier: {m.activePlanId?.replace('plan_', '').toUpperCase() || 'UNASSIGNED'}</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] text-zinc-600 font-black uppercase">Unit Commander:</span>
                       <span className="text-[10px] text-zinc-300 font-bold uppercase">{m.assignedCoachName || 'No Assignment'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] text-zinc-600 font-black uppercase">Enrolled:</span>
                       <span className="text-[10px] text-zinc-500 font-bold uppercase">{m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 flex justify-end">
                     <span className="text-[8px] font-black uppercase tracking-widest text-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open Matrix File <ChevronRight className="w-2 h-2" /></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staff.map(s => (
                <div key={s.id} className="bg-zinc-900/30 border border-white/5 p-10 rounded-[3rem] flex flex-col relative overflow-hidden group">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-fuchsia-600/10 flex items-center justify-center border border-fuchsia-500/20 shadow-inner group-hover:bg-fuchsia-600/20 transition-all"><ShieldCheck className="w-8 h-8 text-fuchsia-500" /></div>
                    <div>
                      <h3 className="font-black italic uppercase text-white text-xl">{s.name}</h3>
                      <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{s.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-6 border-t border-white/5">
                     <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Operator Privileges</p>
                     <div className="flex flex-wrap gap-2">
                        {s.role === 'super_admin' ? (
                          <span className="bg-fuchsia-600/20 text-fuchsia-400 text-[8px] px-3 py-1 rounded-full font-black uppercase border border-fuchsia-500/20">Omni-Access</span>
                        ) : Object.entries(s.permissions || {}).map(([key, val]) => val && (
                          <span key={key} className="bg-white/5 text-zinc-400 text-[8px] px-3 py-1 rounded-full font-black uppercase border border-white/5">{key.replace('canManage', '')}</span>
                        ))}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'protocols' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map(p => (
                <div key={p.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2.5rem] flex flex-col relative group">
                  <h3 className="text-xl font-black italic uppercase text-white mb-2">{p.name}</h3>
                  <p className="text-[10px] text-fuchsia-500 font-black uppercase mb-4 tracking-tighter">${p.price} / Block</p>
                  <p className="text-xs text-zinc-500 line-clamp-3 mb-8 leading-relaxed italic">"{p.description}"</p>
                  <button className="mt-auto w-full bg-white/5 border border-white/10 text-zinc-400 py-4 rounded-xl font-black uppercase text-[9px] hover:bg-white/10 hover:text-white transition-all">Configure Deployment</button>
                </div>
              ))}
              <button onClick={() => alert('New Protocol Drafting Online.')} className="bg-zinc-900/30 border border-white/5 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-zinc-700 hover:text-zinc-500 hover:bg-zinc-900/50 transition-all min-h-[300px]">
                <Plus className="w-10 h-10 mb-4" />
                <span className="font-black uppercase text-[10px] tracking-widest">Draft New Protocol</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-[#020617] border border-white/10 rounded-[4rem] p-12 w-full max-w-2xl relative shadow-[0_0_100px_rgba(192,38,211,0.15)]">
              <button onClick={() => setSelectedMember(null)} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-colors"><X className="w-10 h-10" /></button>
              
              <div className="flex items-center gap-8 mb-12">
                <div className="w-24 h-24 rounded-3xl bg-fuchsia-600/10 border border-fuchsia-500/20 flex items-center justify-center font-black text-4xl text-fuchsia-500 shadow-inner">{selectedMember.name.charAt(0)}</div>
                <div>
                  <h2 className="text-5xl font-black italic uppercase text-white leading-none tracking-tighter">{selectedMember.name}</h2>
                  <p className="text-[10px] text-fuchsia-500 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2"><UserCheck className="w-3 h-3" /> Athlete Matrix Record</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[8px] font-black uppercase text-zinc-600 mb-1 tracking-widest">Communication Channel</p>
                  <p className="text-sm font-bold text-zinc-300">{selectedMember.email}</p>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[8px] font-black uppercase text-zinc-600 mb-1 tracking-widest">Current Deployment Tier</p>
                  <p className="text-sm font-black text-fuchsia-500 uppercase italic tracking-tighter">{selectedMember.activePlanId?.replace('plan_', '') || 'UNRANKED'}</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/5 p-10 rounded-[3rem]">
                <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-8 tracking-widest text-center">Assign Command Unit</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['Coach Bolt', 'Elena Rodriguez', 'Cesar DeCosta', 'Marcus Thorne'].map(coach => (
                    <button key={coach} onClick={() => assignCoach(selectedMember.id, coach)} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedMember.assignedCoachName === coach ? 'bg-fuchsia-600 border-fuchsia-500 text-white shadow-lg shadow-fuchsia-600/30' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-200'}`}>
                      {coach}
                    </button>
                  ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-[#020617] border border-white/10 rounded-[3rem] p-12 w-full max-w-3xl relative">
              <button onClick={() => setShowManualAdd(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-colors"><X className="w-10 h-10" /></button>
              <div className="mb-10">
                <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">Deploy {manualUser.role === 'admin' ? 'Strategic Operator' : 'Elite Athlete'}</h2>
                <p className="text-fuchsia-500 font-black uppercase text-[10px] tracking-widest mt-2">Initializing Profile Ingestor...</p>
              </div>
              
              <form onSubmit={handleManualAdd} className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                 <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    <input required placeholder="Full Identity Name" className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl font-bold text-sm focus:border-fuchsia-500 outline-none transition-all" value={manualUser.name} onChange={e => setManualUser({...manualUser, name: e.target.value})} />
                 </div>
                 <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    <input required type="email" placeholder="Vault Communications Email" className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl font-bold text-sm focus:border-fuchsia-500 outline-none transition-all" value={manualUser.email} onChange={e => setManualUser({...manualUser, email: e.target.value})} />
                 </div>
                 <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    <input type="tel" placeholder="Mobile Contact" className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl font-bold text-sm focus:border-fuchsia-500 outline-none transition-all" value={manualUser.phone} onChange={e => setManualUser({...manualUser, phone: e.target.value})} />
                 </div>
                 <div className="relative">
                    <ShieldAlert className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    <input required type="password" placeholder="Temporary Access Key" className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl font-bold text-sm focus:border-fuchsia-500 outline-none transition-all" value={manualUser.password} onChange={e => setManualUser({...manualUser, password: e.target.value})} />
                 </div>
                </div>
                
                {manualUser.role === 'admin' && (
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col">
                    <p className="text-[10px] font-black uppercase text-fuchsia-500 mb-8 tracking-[0.4em] text-center underline underline-offset-8">Authorization Matrix</p>
                    <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {[
                        { key: 'canManageLeads', label: 'Intake Queue' },
                        { key: 'canManageMatrix', label: 'Athlete Matrices' },
                        { key: 'canManageSquad', label: 'Squad Deployment' },
                        { key: 'canManagePlans', label: 'Protocol Lab' },
                        { key: 'canManageNutrition', label: 'Fuel Infrastructure' }
                      ].map((perm) => (
                        <button key={perm.key} type="button" onClick={() => setManualUser({...manualUser, permissions: {...manualUser.permissions, [perm.key]: !manualUser.permissions[perm.key as keyof typeof manualUser.permissions]}})} className="flex items-center gap-4 w-full text-left group">
                          {manualUser.permissions[perm.key as keyof typeof manualUser.permissions] ? <div className="p-1 bg-fuchsia-600 rounded-lg"><CheckSquare className="w-4 h-4 text-white" /></div> : <div className="p-1 bg-zinc-800 rounded-lg"><Square className="w-4 h-4 text-zinc-600" /></div>}
                          <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-zinc-100 transition-colors">{perm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="md:col-span-2 pt-10">
                  <button type="submit" disabled={isCreatingManual} className="w-full bg-white text-black py-7 rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:bg-zinc-200 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                    {isCreatingManual ? <Loader2 className="animate-spin" /> : "Authorize Deployment Pipeline"}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
