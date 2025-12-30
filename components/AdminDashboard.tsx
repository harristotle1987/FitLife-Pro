
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Lead, UserProfile, UserRole, AdminPermissions } from '../types';
import { FitnessChatSession } from '../aiService';
import { 
  Users, LogOut, RefreshCw, Activity, Menu, X, 
  Loader2, Sparkles, Home, Database, Sword, Terminal,
  LayoutDashboard, Layers, ShieldCheck, UserPlus, Plus, ShieldAlert, Phone, Settings, Briefcase, UserCog, Trash2, CheckSquare
} from 'lucide-react';
import { TRAINING_PLANS } from '../constants';

const AdminDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'members' | 'staff' | 'protocols'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [dbHost, setDbHost] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<{id: string, text: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);

  // Manual Add Form State
  const [manualUser, setManualUser] = useState({ name: '', email: '', password: '', role: 'member' as UserRole, phone: '' });
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  // Edit Assignment State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [assignmentData, setAssignmentData] = useState<Partial<UserProfile>>({});
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorHint(null);
    try {
      const healthRes = await fetch('/api/system/health');
      const healthData = await healthRes.json();
      if (healthData.success) setDbHost(healthData.host);

      // Super Admins should see everyone, including other super admins and admins
      const coachIdFilter = user.role === 'super_admin' ? undefined : user.id;
      
      const [l, m, a, sa] = await Promise.all([
        api.getAllLeads(),
        api.getUsersByRole('member', coachIdFilter),
        api.getUsersByRole('admin'),
        user.role === 'super_admin' ? api.getUsersByRole('super_admin') : Promise.resolve([])
      ]);
      
      setLeads(l || []);
      setMembers(m || []);
      // Combine admins and super admins for the staff view, avoiding duplicates if any
      const allStaff = [...(a || []), ...(sa || [])].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
      setAdmins(allStaff);

    } catch (err: any) { 
      setErrorHint(err.message || 'Vault infrastructure unresponsive.');
    } finally { 
      setLoading(false); 
    }
  }, [user.id, user.role]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleGenerateStrategy = async (lead: Lead) => {
    if (!lead.id) return;
    setAnalyzingLeadId(lead.id);
    try {
      const coach = new FitnessChatSession();
      const strategy = await coach.generateLeadStrategy(lead.name, lead.goal);
      setActiveStrategy({ id: lead.id, text: strategy });
    } finally {
      setAnalyzingLeadId(null);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingManual(true);
    try {
      const res = await api.createProfile(manualUser);
      if (res.success) {
        setShowManualAdd(false);
        setManualUser({ name: '', email: '', password: '', role: 'member', phone: '' });
        loadAll();
      } else {
        alert(res.message);
      }
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleOpenAssignment = (u: UserProfile) => {
    setEditingUser(u);
    setAssignmentData({
      assignedCoachId: u.assignedCoachId,
      assignedCoachName: u.assignedCoachName,
      activePlanId: u.activePlanId,
      role: u.role,
      assignedNutritionistName: u.assignedNutritionistName,
      name: u.name,
      phone: u.phone,
      email: u.email,
      permissions: u.permissions || {}
    });
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingAssignment(true);
    try {
      const res = await api.updateProfile(editingUser.id, assignmentData);
      if (res.success) {
        setEditingUser(null);
        loadAll();
      } else {
        alert(res.message || 'Update failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    if (!confirm(`WARNING: You are about to terminate ${editingUser.name}'s profile. This action cannot be undone. Confirm deletion?`)) return;
    
    setIsDeleting(true);
    try {
      const res = await api.deleteProfile(editingUser.id);
      if (res.success) {
        setEditingUser(null);
        loadAll();
      } else {
        alert(res.message || 'Deletion failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePermission = (key: keyof AdminPermissions) => {
    const current = assignmentData.permissions || {};
    setAssignmentData({
      ...assignmentData,
      permissions: {
        ...current,
        [key]: !current[key]
      }
    });
  };

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      const ok = await api.bootstrapDatabase();
      if (ok) { 
        loadAll(); 
        alert("Vault Infrastructure Synchronized Successfully.");
      }
    } finally { setIsBootstrapping(false); }
  };

  const navItems = [
    { id: 'leads', label: 'Intake', icon: Users },
    { id: 'members', label: 'Matrix', icon: Activity },
    { id: 'staff', label: 'Squad', icon: ShieldCheck },
    { id: 'protocols', label: 'Plans', icon: Layers },
  ];

  const PERMISSION_LABELS: Record<keyof AdminPermissions, string> = {
    canManageLeads: "Manage Intake (Leads)",
    canManageProgress: "Manage Matrix (Progress)",
    canManageAdmins: "Manage Squad (Staff)",
    canManagePlans: "Manage Protocols (Plans)",
    canManageNutrition: "Manage Nutrition"
  };

  return (
    <div className="min-h-screen bg-[#020617] text-zinc-100 flex font-sans overflow-hidden">
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-6 right-6 z-[150] p-4 bg-fuchsia-600 rounded-full shadow-2xl border border-fuchsia-400"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative w-72 h-full bg-[#020617] border-r border-white/5 p-8 flex flex-col z-[120] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-lg font-black italic text-xl">FP</div>
            <div>
              <h2 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">VAULT</h2>
              <p className="text-[8px] font-black text-fuchsia-500 uppercase tracking-[0.4em] mt-1">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full w-fit">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">System Secure</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={onGoHome} className="w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
            <Home className="w-4 h-4 mr-4" /> Go Home
          </button>
          <div className="h-px bg-white/5 my-4 mx-4" />
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === item.id ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : 'text-zinc-500 hover:bg-white/5'}`}
            >
              <item.icon className="w-4 h-4 mr-4" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
           <button 
              onClick={() => handleOpenAssignment(user)}
              className="w-full flex items-center justify-start gap-3 mb-4 text-zinc-400 hover:text-white transition-colors"
           >
              <UserCog className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Edit My Profile</span>
           </button>
           <div className="flex items-center gap-2 mb-6 px-4 text-zinc-600">
              <Database className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest truncate">{dbHost || 'Syncing...'}</span>
           </div>
           <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 bg-zinc-900 border border-white/5 text-zinc-500 hover:text-red-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <div>
             <div className="flex items-center gap-3 mb-2">
               <Terminal className="w-4 h-4 text-fuchsia-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Command / {activeTab}</span>
             </div>
             <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">{activeTab}</h1>
          </div>
          <div className="flex gap-4">
             {activeTab === 'staff' && (
                <button 
                  onClick={() => { setManualUser({...manualUser, role: 'admin'}); setShowManualAdd(true); }}
                  className="bg-fuchsia-600 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20"
                >
                  <ShieldCheck className="w-4 h-4" /> Add Operator
                </button>
             )}
             {activeTab === 'members' && (
                <button 
                  onClick={() => { setManualUser({...manualUser, role: 'member'}); setShowManualAdd(true); }}
                  className="bg-white text-black px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-xl shadow-white/10"
                >
                  <UserPlus className="w-4 h-4" /> Add Athlete
                </button>
             )}
             <button onClick={loadAll} className="p-5 bg-zinc-900 border border-white/5 rounded-full hover:border-fuchsia-500 transition-all active:scale-90">
                <RefreshCw className={`w-5 h-5 text-fuchsia-500 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </header>

        {errorHint && (
          <div className="mb-10 p-8 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center gap-6 animate-fade-in">
             <div className="p-4 bg-red-500/20 rounded-2xl"><Database className="w-8 h-8 text-red-500" /></div>
             <div className="flex-1">
               <p className="text-[10px] font-black uppercase text-red-500 mb-1 tracking-widest">Infrastucture Error</p>
               <p className="text-sm font-medium text-zinc-300">{errorHint}</p>
             </div>
             <button onClick={handleBootstrap} className="bg-red-600 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-all">
               {isBootstrapping ? <Loader2 className="animate-spin" /> : "Force Sync Vault"}
             </button>
          </div>
        )}

        <div className="animate-fade-in">
          {activeTab === 'leads' && (
            leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/10 border border-white/5 rounded-[4rem] text-center">
                <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
                  <LayoutDashboard className="w-10 h-10 text-zinc-800" />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-zinc-700">Intake Clear</h3>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.5em] mt-2">Zero Pending Strategies</p>
              </div>
            ) : (
              <div className="space-y-6">
                {leads.map(lead => (
                  <div key={lead.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2.5rem] flex flex-col gap-8 group hover:border-fuchsia-500/30 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-fuchsia-600/20 text-fuchsia-500 rounded-md">New Ingest</span>
                              <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Source: {lead.source}</span>
                            </div>
                            <h3 className="text-2xl font-black italic uppercase text-white">{lead.name}</h3>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">{lead.email} // {lead.phone}</p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <button 
                              disabled={analyzingLeadId === lead.id}
                              onClick={() => handleGenerateStrategy(lead)} 
                              className="bg-zinc-900 border border-white/5 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase hover:bg-fuchsia-600 hover:border-fuchsia-500 transition-all flex items-center gap-3"
                            >
                               {analyzingLeadId === lead.id ? <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" /> : <Sword className="w-4 h-4" />}
                               Calculate Plan
                            </button>
                            <button className="bg-white text-black px-8 py-4 rounded-full text-[10px] font-black uppercase hover:bg-zinc-200 transition-all active:scale-95">Onboard</button>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                      <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2 italic">Athlete Objective:</p>
                      <p className="text-sm text-zinc-300 font-medium leading-relaxed italic">"{lead.goal}"</p>
                    </div>

                    {activeStrategy?.id === lead.id && (
                      <div className="bg-fuchsia-600/10 border border-fuchsia-500/30 p-8 rounded-[2rem] animate-fade-in relative overflow-hidden">
                          <button onClick={() => setActiveStrategy(null)} className="absolute top-6 right-6 text-fuchsia-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                          <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-5 h-5 text-fuchsia-500 animate-pulse" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-fuchsia-500">Gemini Strategic Assessment</h4>
                          </div>
                          <p className="text-xl font-black italic uppercase text-white leading-relaxed pr-8">
                             "{activeStrategy.text}"
                          </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'members' && (
            members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/10 border border-white/5 rounded-[4rem] text-center">
                <Activity className="w-16 h-16 text-zinc-800 mb-6" />
                <h3 className="text-2xl font-black italic uppercase text-zinc-700">Matrix Idle</h3>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.5em] mt-2">No Active Athlete Data</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(m => (
                  <div key={m.id} className="bg-zinc-900/30 border border-white/5 p-10 rounded-[3rem] group hover:border-fuchsia-500/30 transition-all flex flex-col">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-white/5 flex items-center justify-center font-black text-2xl text-zinc-600 group-hover:bg-fuchsia-600 group-hover:text-white transition-all">{m.name.charAt(0)}</div>
                        <div>
                          <h3 className="text-xl font-black italic uppercase text-white">{m.name}</h3>
                          <p className="text-[9px] text-fuchsia-500 font-black uppercase tracking-widest">{m.activePlanId?.replace('plan_', '').toUpperCase()}</p>
                          <p className="text-[8px] text-zinc-500 mt-1 uppercase">Coach: {m.assignedCoachName || 'Unassigned'}</p>
                        </div>
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <button onClick={() => alert('Accessing Bio-Log History...')} className="w-full bg-white/5 border border-white/5 text-white py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-white/10 tracking-widest transition-all">Synchronize Matrix</button>
                      <button onClick={() => handleOpenAssignment(m)} className="w-full bg-zinc-800 border border-white/5 text-zinc-400 py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-zinc-700 hover:text-white tracking-widest transition-all flex items-center justify-center gap-2">
                        <Settings className="w-3 h-3" /> Reassign Protocol
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <h2 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] mb-4">Command Operators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {admins.map(admin => (
                  <div key={admin.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[3rem] flex flex-col gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-fuchsia-600/10 flex items-center justify-center border border-fuchsia-500/20">
                        <ShieldCheck className="w-8 h-8 text-fuchsia-500" />
                      </div>
                      <div>
                        <h3 className="font-black italic uppercase text-white">{admin.name}</h3>
                        <p className="text-[9px] text-zinc-500 uppercase font-black">{admin.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleOpenAssignment(admin)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      <UserCog className="w-3 h-3" /> Edit Assignment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'protocols' && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
               <Layers className="w-16 h-16 text-zinc-800 mb-6" />
               <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">Protocol Management Offline</p>
            </div>
          )}
        </div>
      </main>

      {/* Manual Add Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-[#020617] border border-white/10 rounded-[3rem] p-12 w-full max-w-md relative shadow-[0_0_100px_rgba(192,38,211,0.2)]">
              <button onClick={() => setShowManualAdd(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
              
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-fuchsia-600/10 border border-fuchsia-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  {manualUser.role === 'admin' ? <ShieldAlert className="w-8 h-8 text-fuchsia-500" /> : <UserPlus className="w-8 h-8 text-fuchsia-500" />}
                </div>
                <p className="text-fuchsia-500 font-black uppercase text-[9px] tracking-[0.4em] mb-2">Vault Command</p>
                <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                  {manualUser.role === 'admin' ? 'Ingest Operator' : 'Ingest Athlete'}
                </h2>
              </div>

              <form onSubmit={handleManualAdd} className="space-y-4">
                 <input 
                   required 
                   placeholder="Full Name" 
                   className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl focus:border-fuchsia-500 outline-none font-bold text-sm"
                   value={manualUser.name}
                   onChange={e => setManualUser({...manualUser, name: e.target.value})}
                 />
                 <input 
                   required 
                   type="email" 
                   placeholder="Email Address" 
                   className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl focus:border-fuchsia-500 outline-none font-bold text-sm"
                   value={manualUser.email}
                   onChange={e => setManualUser({...manualUser, email: e.target.value})}
                 />
                 <input 
                   placeholder="Phone Number (Optional)" 
                   className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl focus:border-fuchsia-500 outline-none font-bold text-sm"
                   value={manualUser.phone}
                   onChange={e => setManualUser({...manualUser, phone: e.target.value})}
                 />
                 <input 
                   required 
                   type="password" 
                   placeholder="Initial Vault Key" 
                   className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl focus:border-fuchsia-500 outline-none font-bold text-sm"
                   value={manualUser.password}
                   onChange={e => setManualUser({...manualUser, password: e.target.value})}
                 />
                 <div className="pt-6">
                    <button 
                      disabled={isCreatingManual}
                      type="submit" 
                      className="w-full bg-white text-black py-6 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-xl"
                    >
                      {isCreatingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Deployment"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Assignment Editor Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[250] flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-[#020617] border border-white/10 rounded-[3rem] p-12 w-full max-w-lg relative shadow-[0_0_100px_rgba(192,38,211,0.2)] max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button onClick={() => setEditingUser(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
              
              <div className="mb-8">
                 <h2 className="text-3xl font-black italic uppercase text-white mb-2">Reassign / Edit</h2>
                 <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">{editingUser.name}</p>
                 <p className="text-[9px] font-bold text-zinc-600 mt-1">{editingUser.email}</p>
              </div>

              <form onSubmit={handleSaveAssignment} className="space-y-6">
                
                {/* Common Fields */}
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Full Name</label>
                   <input 
                     className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white focus:border-fuchsia-500 outline-none"
                     value={assignmentData.name || ''}
                     onChange={e => setAssignmentData({...assignmentData, name: e.target.value})}
                   />
                </div>
                
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Phone</label>
                   <input 
                     className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white focus:border-fuchsia-500 outline-none"
                     value={assignmentData.phone || ''}
                     onChange={e => setAssignmentData({...assignmentData, phone: e.target.value})}
                   />
                </div>

                {/* SUPER ADMIN: Role Management */}
                {user.role === 'super_admin' && (
                   <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Role Authorization</label>
                       <select 
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white focus:border-fuchsia-500 outline-none appearance-none"
                         value={assignmentData.role || 'member'}
                         onChange={e => setAssignmentData({...assignmentData, role: e.target.value as UserRole})}
                       >
                         <option value="member" className="bg-zinc-900">Member</option>
                         <option value="admin" className="bg-zinc-900">Admin (Coach)</option>
                         <option value="super_admin" className="bg-zinc-900">Super Admin</option>
                         <option value="nutritionist" className="bg-zinc-900">Nutritionist</option>
                       </select>
                   </div>
                )}

                {/* Member Specific Fields (Render based on TARGET role, not original) */}
                {assignmentData.role === 'member' && (
                  <>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2"><Briefcase className="w-3 h-3" /> Assigned Coach</label>
                       <select 
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white focus:border-fuchsia-500 outline-none appearance-none"
                         value={assignmentData.assignedCoachId || ''}
                         onChange={e => {
                            const coach = admins.find(a => a.id === e.target.value);
                            setAssignmentData({
                              ...assignmentData, 
                              assignedCoachId: e.target.value,
                              assignedCoachName: coach ? coach.name : ''
                            });
                         }}
                       >
                         <option value="" className="bg-zinc-900 text-zinc-500">No Coach Assigned</option>
                         {admins.map(admin => (
                           <option key={admin.id} value={admin.id} className="bg-zinc-900">{admin.name} ({admin.role})</option>
                         ))}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2"><Layers className="w-3 h-3" /> Active Protocol</label>
                       <select 
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white focus:border-fuchsia-500 outline-none appearance-none"
                         value={assignmentData.activePlanId || ''}
                         onChange={e => setAssignmentData({...assignmentData, activePlanId: e.target.value})}
                       >
                         {TRAINING_PLANS.map(plan => (
                           <option key={plan.id} value={plan.id} className="bg-zinc-900">{plan.name}</option>
                         ))}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Nutritionist Name</label>
                       <input 
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white focus:border-fuchsia-500 outline-none"
                         value={assignmentData.assignedNutritionistName || ''}
                         onChange={e => setAssignmentData({...assignmentData, assignedNutritionistName: e.target.value})}
                         placeholder="Dr. Julian Vance"
                       />
                    </div>
                  </>
                )}

                {/* Sub-Admin / Nutritionist Permissions (Duties) */}
                {(assignmentData.role === 'admin' || assignmentData.role === 'nutritionist') && (
                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4 text-fuchsia-500" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Operational Duties</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                         {(Object.keys(PERMISSION_LABELS) as Array<keyof AdminPermissions>).map((key) => (
                           <label key={key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                assignmentData.permissions?.[key] ? 'bg-fuchsia-600 border-fuchsia-600 text-white' : 'border-zinc-700 bg-zinc-900'
                              }`}>
                                {assignmentData.permissions?.[key] && <CheckSquare className="w-3 h-3" />}
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={!!assignmentData.permissions?.[key]}
                                  onChange={() => togglePermission(key)}
                                />
                              </div>
                              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{PERMISSION_LABELS[key]}</span>
                           </label>
                         ))}
                      </div>
                   </div>
                )}

                <div className="pt-6 flex gap-4">
                   {user.role === 'super_admin' && editingUser.id !== user.id && (
                     <button
                       type="button"
                       disabled={isDeleting || isSavingAssignment}
                       onClick={handleDeleteUser}
                       className="px-6 bg-red-600/10 border border-red-600/30 text-red-500 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                     >
                       {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                     </button>
                   )}
                   
                   <button 
                      disabled={isSavingAssignment}
                      type="submit" 
                      className="flex-1 bg-fuchsia-600 text-white py-5 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl"
                    >
                      {isSavingAssignment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Changes"}
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
