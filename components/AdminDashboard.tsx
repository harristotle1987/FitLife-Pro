
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Lead, UserProfile, UserRole, AdminPermissions, MemberProgress, TrainingPlan } from '../types';
import { FitnessChatSession } from '../aiService';
import * as assets from '../assets';
import { 
  Users, LogOut, RefreshCw, Activity, Menu, X, 
  Loader2, Sparkles, Home, Database, Sword, Terminal,
  LayoutDashboard, Layers, ShieldCheck, UserPlus, Plus, ShieldAlert, Phone, Settings, Briefcase, UserCog, Trash2, CheckSquare,
  LineChart, PlusCircle, Save, BrainCircuit, Calendar
} from 'lucide-react';
import { TRAINING_PLANS } from '../constants';

const AdminDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'members' | 'staff' | 'protocols'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [dbHost, setDbHost] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<{id: string, text: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);

  // User State
  const [manualUser, setManualUser] = useState({ name: '', email: '', password: '', role: 'member' as UserRole, phone: '' });
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [onboardingLeadId, setOnboardingLeadId] = useState<string | null>(null);

  // Edit State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [assignmentData, setAssignmentData] = useState<Partial<UserProfile>>({});
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Matrix State
  const [matrixMember, setMatrixMember] = useState<UserProfile | null>(null);
  const [matrixLogs, setMatrixLogs] = useState<MemberProgress[]>([]);
  const [newLog, setNewLog] = useState({ weight: '', body_fat: '', performance_score: '75', notes: '' });
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Plan State
  const [editingPlan, setEditingPlan] = useState<Partial<TrainingPlan> | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  
  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorHint(null);
    try {
      const healthRes = await fetch('/api/system/health');
      const healthData = await healthRes.json();
      if (healthData.success) setDbHost(healthData.host);

      const coachIdFilter = user.role === 'super_admin' ? undefined : user.id;
      
      const [l, m, a, sa, p] = await Promise.all([
        api.getAllLeads(),
        api.getUsersByRole('member', coachIdFilter),
        api.getUsersByRole('admin'),
        user.role === 'super_admin' ? api.getUsersByRole('super_admin') : Promise.resolve([]),
        api.getPlans()
      ]);
      
      setLeads(l || []);
      setMembers(m || []);
      setPlans(p || []);
      
      // Aggregate staff for the Squad view
      const staffList = [...(a || []), ...(sa || [])].filter((v,i,a) => a.findIndex(t => (t.id === v.id)) === i);
      setAdmins(staffList);

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

  const handleOnboard = (lead: Lead) => {
    setManualUser({ 
      name: lead.name, 
      email: lead.email, 
      password: 'FitLife' + Math.floor(Math.random() * 9000 + 1000), 
      role: 'member', 
      phone: lead.phone 
    });
    setOnboardingLeadId(lead.id || null);
    setShowManualAdd(true);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingManual(true);
    try {
      const res = await api.createProfile(manualUser);
      if (res.success) {
        if (onboardingLeadId) {
          await api.updateLeadStatus(onboardingLeadId, 'Closed');
          setOnboardingLeadId(null);
        }
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

  const handleOpenMatrix = async (m: UserProfile) => {
    setMatrixMember(m);
    setMatrixLogs([]);
    const logs = await api.getMemberProgress(m.id);
    setMatrixLogs(logs || []);
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matrixMember) return;
    setIsSavingLog(true);
    try {
      const res = await api.addProgressLog({
        member_id: matrixMember.id,
        weight: parseFloat(newLog.weight),
        body_fat: parseFloat(newLog.body_fat),
        performance_score: parseInt(newLog.performance_score),
        notes: newLog.notes,
        date: new Date().toISOString()
      });
      if (res.success) {
        setNewLog({ weight: '', body_fat: '', performance_score: '75', notes: '' });
        const logs = await api.getMemberProgress(matrixMember.id);
        setMatrixLogs(logs || []);
      }
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleOpenAssignment = (u: UserProfile) => {
    setEditingUser(u);
    setAssignmentData({
      assignedCoachId: u.assignedCoachId || '',
      assignedCoachName: u.assignedCoachName || '',
      activePlanId: u.activePlanId || 'plan_starter',
      role: u.role,
      name: u.name || '',
      phone: u.phone || '',
      email: u.email || '',
      permissions: u.permissions || {
        canManageLeads: false,
        canManageProgress: false,
        canManageAdmins: false,
        canManagePlans: false,
        canManageNutrition: false
      }
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
    if (!confirm(`WARNING: Remove athlete ${editingUser.name} from the system? This action is permanent.`)) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteProfile(editingUser.id);
      if (res.success) {
        setEditingUser(null);
        loadAll();
      }
    } finally { setIsDeleting(false); }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSavingPlan(true);
    try {
      let res;
      if (editingPlan.id) {
        res = await api.updatePlan(editingPlan.id, editingPlan);
      } else {
        res = await api.createPlan(editingPlan);
      }
      if (res.success) {
        setEditingPlan(null);
        loadAll();
      }
    } finally { setIsSavingPlan(false); }
  };

  const togglePermission = (key: keyof AdminPermissions) => {
    const current = assignmentData.permissions || {
      canManageLeads: false,
      canManageProgress: false,
      canManageAdmins: false,
      canManagePlans: false,
      canManageNutrition: false
    };
    setAssignmentData({
      ...assignmentData,
      permissions: { ...current, [key]: !current[key] }
    });
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
           <button onClick={() => handleOpenAssignment(user)} className="w-full flex items-center justify-start gap-3 mb-4 text-zinc-400 hover:text-white transition-colors">
              <UserCog className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">My Account</span>
           </button>
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
                <button onClick={() => { setManualUser({...manualUser, role: 'admin'}); setShowManualAdd(true); }} className="bg-fuchsia-600 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20">
                  <ShieldCheck className="w-4 h-4" /> Add Operator
                </button>
             )}
             {activeTab === 'members' && (
                <button onClick={() => { setManualUser({...manualUser, role: 'member'}); setShowManualAdd(true); }} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-xl shadow-white/10">
                  <UserPlus className="w-4 h-4" /> Add Athlete
                </button>
             )}
             {activeTab === 'protocols' && (
                <button onClick={() => setEditingPlan({ features: [] })} className="bg-fuchsia-600 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20">
                  <PlusCircle className="w-4 h-4" /> Create Protocol
                </button>
             )}
             <button onClick={loadAll} className="p-5 bg-zinc-900 border border-white/5 rounded-full hover:border-fuchsia-500 transition-all">
                <RefreshCw className={`w-5 h-5 text-fuchsia-500 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </header>

        <div className="animate-fade-in">
          {activeTab === 'leads' && (
            <div className="space-y-6">
              {leads.length === 0 ? (
                <div className="text-center py-20 text-zinc-700 font-black uppercase italic tracking-widest">No Active Intake Leads</div>
              ) : leads.map(lead => (
                <div key={lead.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2.5rem] flex flex-col gap-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black italic uppercase text-white">{lead.name}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{lead.email} // {lead.status}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleGenerateStrategy(lead)} className="bg-zinc-800 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase flex items-center gap-3">
                         {analyzingLeadId === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sword className="w-4 h-4" />} AI Strategize
                      </button>
                      <button onClick={() => handleOnboard(lead)} className="bg-white text-black px-8 py-4 rounded-full text-[10px] font-black uppercase">Onboard Athlete</button>
                    </div>
                  </div>
                  {activeStrategy?.id === lead.id && (
                    <div className="p-8 bg-fuchsia-600/10 border border-fuchsia-500/30 rounded-3xl italic">
                       "{activeStrategy.text}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.length === 0 ? (
                <div className="col-span-full text-center py-20 text-zinc-700 font-black uppercase italic tracking-widest">No Active Athletes in Matrix</div>
              ) : members.map(m => (
                <div key={m.id} className="bg-zinc-900/30 border border-white/5 p-10 rounded-[3rem] group hover:border-fuchsia-500/30 transition-all flex flex-col">
                  <h3 className="text-xl font-black italic uppercase text-white mb-2">{m.name}</h3>
                  <p className="text-[9px] text-fuchsia-500 font-black uppercase mb-8">{m.activePlanId?.replace('plan_', '').toUpperCase()}</p>
                  <div className="mt-auto flex flex-col gap-2">
                    <button onClick={() => handleOpenMatrix(m)} className="w-full bg-white/5 border border-white/5 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <LineChart className="w-3 h-3" /> Matrix Sync
                    </button>
                    <button onClick={() => handleOpenAssignment(m)} className="w-full bg-zinc-800 border border-white/5 text-zinc-400 py-4 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-700 hover:text-white transition-all">
                      <Settings className="w-3 h-3" /> Edit Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {admins.length === 0 ? (
                <div className="col-span-full text-center py-20 text-zinc-700 font-black uppercase italic tracking-widest">No Staff Operators in Squad</div>
              ) : admins.map(staff => (
                <div key={staff.id} className="bg-zinc-900/30 border border-white/5 p-10 rounded-[3rem] group hover:border-fuchsia-500/30 transition-all flex flex-col">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-fuchsia-600/10 rounded-2xl border border-fuchsia-500/20">
                      <ShieldCheck className="w-6 h-6 text-fuchsia-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic uppercase text-white">{staff.name}</h3>
                      <p className="text-[9px] text-fuchsia-500 font-black uppercase">{staff.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <button onClick={() => handleOpenAssignment(staff)} className="mt-auto w-full bg-zinc-800 border border-white/5 text-zinc-400 py-4 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-700 hover:text-white transition-all">
                    <UserCog className="w-3 h-3" /> Edit Assignment
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'protocols' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {plans.map(plan => (
                 <div key={plan.id} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2.5rem] flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                         <h3 className="text-2xl font-black italic uppercase text-white">{plan.name}</h3>
                         <p className="text-fuchsia-500 font-black text-xl">${plan.price}</p>
                       </div>
                       <button onClick={() => setEditingPlan(plan)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                          <Settings className="w-4 h-4" />
                       </button>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6">{plan.description}</p>
                    <ul className="space-y-2 mt-auto">
                       {plan.features.slice(0, 3).map((f, i) => (
                         <li key={i} className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
                           <CheckSquare className="w-3 h-3 text-fuchsia-500" /> {f}
                         </li>
                       ))}
                    </ul>
                 </div>
               ))}
            </div>
          )}
        </div>
      </main>

      {/* Manual Add Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-[#020617] border border-white/10 rounded-[3rem] p-12 w-full max-w-md relative shadow-2xl">
              <button onClick={() => setShowManualAdd(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
              <h2 className="text-3xl font-black italic uppercase text-white mb-8">Deploy {manualUser.role === 'admin' ? 'Operator' : 'Athlete'}</h2>
              <form onSubmit={handleManualAdd} className="space-y-4">
                 <input required placeholder="Full Name" className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-bold text-sm" value={manualUser.name} onChange={e => setManualUser({...manualUser, name: e.target.value})} />
                 <input required type="email" placeholder="Email Address" className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-bold text-sm" value={manualUser.email} onChange={e => setManualUser({...manualUser, email: e.target.value})} />
                 <input required placeholder="Initial Vault Key" className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl font-bold text-sm" value={manualUser.password} onChange={e => setManualUser({...manualUser, password: e.target.value})} />
                 <button disabled={isCreatingManual} className="w-full bg-white text-black py-6 rounded-full font-black uppercase text-[10px] tracking-widest mt-6">
                    {isCreatingManual ? <Loader2 className="animate-spin" /> : "Authorize Deployment"}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Matrix Sync Modal */}
      {matrixMember && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-[#020617] border border-white/10 rounded-[4rem] p-12 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col md:flex-row gap-12">
            <button onClick={() => setMatrixMember(null)} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
            
            <div className="md:w-1/3">
              <h2 className="text-4xl font-black italic uppercase text-white mb-2">Matrix Sync</h2>
              <p className="text-[10px] font-black uppercase text-fuchsia-500 tracking-[0.3em] mb-12">{matrixMember.name}</p>
              
              <form onSubmit={handleAddLog} className="space-y-4">
                 <div>
                    <label className="text-[9px] font-black uppercase text-zinc-600 mb-1 block ml-2">Weight (Lbs)</label>
                    <input required className="w-full bg-white/5 p-4 rounded-2xl font-bold" value={newLog.weight} onChange={e => setNewLog({...newLog, weight: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-zinc-600 mb-1 block ml-2">Body Fat (%)</label>
                    <input required className="w-full bg-white/5 p-4 rounded-2xl font-bold" value={newLog.body_fat} onChange={e => setNewLog({...newLog, body_fat: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-zinc-600 mb-1 block ml-2">Performance (0-100)</label>
                    <input required type="range" className="w-full accent-fuchsia-500" value={newLog.performance_score} onChange={e => setNewLog({...newLog, performance_score: e.target.value})} />
                 </div>
                 <button disabled={isSavingLog} className="w-full bg-fuchsia-600 py-5 rounded-full font-black uppercase text-[10px] tracking-widest mt-6">
                    {isSavingLog ? <Loader2 className="animate-spin" /> : "Commit Bio-Data"}
                 </button>
              </form>
            </div>

            <div className="flex-1 space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Historical Feed</h3>
               {matrixLogs.length === 0 ? (
                 <p className="text-center py-20 text-zinc-700 font-black uppercase text-[10px]">No Matrix History</p>
               ) : matrixLogs.map((log, i) => (
                 <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex justify-between items-center group">
                    <div>
                      <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">{new Date(log.date).toLocaleDateString()}</p>
                      <p className="text-xl font-black text-white italic">{log.performance_score} <span className="text-[8px] font-bold uppercase opacity-30">Efficiency</span></p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black uppercase text-fuchsia-500">{log.weight}LBS</p>
                       <p className="text-[9px] font-bold text-zinc-600">{log.body_fat}% BF</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[250] flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-[#020617] border border-white/10 rounded-[3rem] p-12 w-full max-w-lg relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button onClick={() => setEditingUser(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
              
              <div className="mb-8">
                 <h2 className="text-3xl font-black italic uppercase text-white mb-2">Authority Control</h2>
                 <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">{editingUser.name}</p>
                 <p className="text-[9px] font-bold text-zinc-600 mt-1">{editingUser.email}</p>
              </div>

              <form onSubmit={handleSaveAssignment} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Full Name</label>
                   <input className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none" value={assignmentData.name || ''} onChange={e => setAssignmentData({...assignmentData, name: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Phone</label>
                   <input className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none" value={assignmentData.phone || ''} onChange={e => setAssignmentData({...assignmentData, phone: e.target.value})} />
                </div>

                {user.role === 'super_admin' && (
                   <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> System Role</label>
                       <select className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none appearance-none" value={assignmentData.role || 'member'} onChange={e => setAssignmentData({...assignmentData, role: e.target.value as UserRole})}>
                         <option value="member" className="bg-zinc-900">Member (Athlete)</option>
                         <option value="admin" className="bg-zinc-900">Admin (Coach)</option>
                         <option value="super_admin" className="bg-zinc-900">Super Admin</option>
                         <option value="nutritionist" className="bg-zinc-900">Nutritionist</option>
                       </select>
                   </div>
                )}

                {assignmentData.role === 'member' && (
                  <>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2"><Briefcase className="w-3 h-3" /> Assigned Coach</label>
                       <select className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none appearance-none" value={assignmentData.assignedCoachId || ''} onChange={e => {
                          const coach = admins.find(a => a.id === e.target.value);
                          setAssignmentData({ ...assignmentData, assignedCoachId: e.target.value, assignedCoachName: coach ? coach.name : '' });
                       }}>
                         <option value="" className="bg-zinc-900 text-zinc-500">Unassigned</option>
                         {admins.map(admin => <option key={admin.id} value={admin.id} className="bg-zinc-900">{admin.name}</option>)}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2"><Layers className="w-3 h-3" /> Active Protocol</label>
                       <select className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none appearance-none" value={assignmentData.activePlanId || ''} onChange={e => setAssignmentData({...assignmentData, activePlanId: e.target.value})}>
                         {plans.map(plan => <option key={plan.id} value={plan.id} className="bg-zinc-900">{plan.name}</option>)}
                       </select>
                    </div>
                  </>
                )}

                {(assignmentData.role === 'admin' || assignmentData.role === 'nutritionist') && user.role === 'super_admin' && (
                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4 text-fuchsia-500" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Privilege Escalation (Super Admin)</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                         {(Object.keys(PERMISSION_LABELS) as Array<keyof AdminPermissions>).map((key) => (
                           <label key={key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                assignmentData.permissions?.[key] ? 'bg-fuchsia-600 border-fuchsia-600 text-white' : 'border-zinc-700 bg-zinc-900'
                              }`}>
                                {assignmentData.permissions?.[key] && <CheckSquare className="w-3 h-3" />}
                                <input type="checkbox" className="hidden" checked={!!assignmentData.permissions?.[key]} onChange={() => togglePermission(key)} />
                              </div>
                              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{PERMISSION_LABELS[key]}</span>
                           </label>
                         ))}
                      </div>
                   </div>
                )}

                <div className="pt-6 flex gap-4">
                   {user.role === 'super_admin' && editingUser.id !== user.id && (
                     <button type="button" disabled={isDeleting} onClick={handleDeleteUser} className="px-6 bg-red-600/10 border border-red-600/30 text-red-500 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
                       {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                     </button>
                   )}
                   <button disabled={isSavingAssignment} type="submit" className="flex-1 bg-fuchsia-600 text-white py-5 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl">
                      {isSavingAssignment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Authority"}
                    </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Plan Editor Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[250] flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-[#020617] border border-white/10 rounded-[3rem] p-12 w-full max-w-lg relative shadow-2xl">
              <button onClick={() => setEditingPlan(null)} className="absolute top-8 right-8 text-zinc-500"><X className="w-8 h-8" /></button>
              <h2 className="text-3xl font-black italic uppercase text-white mb-8">{editingPlan.id ? 'Edit Protocol' : 'Deploy Protocol'}</h2>
              <form onSubmit={handleSavePlan} className="space-y-6">
                 <input required placeholder="Plan Identifier" disabled={!!editingPlan.id} className="w-full bg-white/5 p-5 rounded-2xl" value={editingPlan.id || ''} onChange={e => setEditingPlan({...editingPlan, id: e.target.value})} />
                 <input required placeholder="Display Name" className="w-full bg-white/5 p-5 rounded-2xl" value={editingPlan.name || ''} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} />
                 <input required type="number" placeholder="Price ($)" className="w-full bg-white/5 p-5 rounded-2xl" value={editingPlan.price || ''} onChange={e => setEditingPlan({...editingPlan, price: parseFloat(e.target.value)})} />
                 <textarea required placeholder="Description" className="w-full bg-white/5 p-5 rounded-2xl h-24" value={editingPlan.description || ''} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} />
                 <button disabled={isSavingPlan} className="w-full bg-fuchsia-600 py-6 rounded-full font-black uppercase text-[10px] tracking-widest">
                   {isSavingPlan ? <Loader2 className="animate-spin" /> : "Commit Infrastructure"}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
