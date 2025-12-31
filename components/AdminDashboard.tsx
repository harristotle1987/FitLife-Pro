
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api';
import { Lead, UserProfile, UserRole, AdminPermissions, MemberProgress, TrainingPlan } from '../types';
import { FitnessChatSession } from '../aiService';
import * as assets from '../assets';
import { 
  Users, LogOut, RefreshCw, Activity, Menu, X, 
  Loader2, Sparkles, Home, Database, Sword, Terminal,
  LayoutDashboard, Layers, ShieldCheck, UserPlus, Plus, ShieldAlert, Phone, Settings, Briefcase, UserCog, Trash2, CheckSquare,
  LineChart, PlusCircle, Save, BrainCircuit, Calendar, Check
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

  // Granular Permissions
  const permissions = useMemo(() => ({
    isSuper: user.role === 'super_admin',
    canManageLeads: user.role === 'super_admin' || !!user.permissions?.canManageLeads,
    canManageProgress: user.role === 'super_admin' || !!user.permissions?.canManageProgress,
    canManageAdmins: user.role === 'super_admin' || !!user.permissions?.canManageAdmins,
    canManagePlans: user.role === 'super_admin' || !!user.permissions?.canManagePlans,
  }), [user]);
  
  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorHint(null);
    try {
      const healthRes = await fetch('/api/system/health');
      const healthData = await healthRes.json();
      if (healthData.success) setDbHost(healthData.host);

      const coachIdFilter = !permissions.isSuper ? user.id : undefined;
      
      const dataPromises = [];
      if (permissions.canManageLeads) dataPromises.push(api.getAllLeads()); else dataPromises.push(Promise.resolve([]));
      if (permissions.canManageProgress) dataPromises.push(api.getUsersByRole('member', coachIdFilter)); else dataPromises.push(Promise.resolve([]));
      if (permissions.canManageAdmins) {
        dataPromises.push(api.getUsersByRole('admin'));
        if (permissions.isSuper) dataPromises.push(api.getUsersByRole('super_admin'));
        else dataPromises.push(Promise.resolve([]));
      } else {
        dataPromises.push(Promise.resolve([]), Promise.resolve([]));
      }
      dataPromises.push(api.getPlans());

      const [l, m, a, sa, p] = await Promise.all(dataPromises);
      
      setLeads(l || []);
      setMembers(m || []);
      setPlans(p || []);
      
      const staffList = [...(a || []), ...(sa || [])].filter((v,i,a) => a.findIndex(t => (t.id === v.id)) === i);
      setAdmins(staffList);

    } catch (err: any) { 
      setErrorHint(err.message || 'Vault infrastructure unresponsive.');
    } finally { 
      setLoading(false); 
    }
  }, [user.id, permissions]);

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
    
    // Clean payload for non-super admins to prevent 403s from backend
    const payload = { ...assignmentData };
    if (!permissions.isSuper) {
        delete payload.role;
        delete payload.permissions;
    }

    try {
      const res = await api.updateProfile(editingUser.id, payload);
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
      } else {
        alert(res.message || 'Deletion failed');
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

  const navItems = useMemo(() => [
    { id: 'leads', label: 'Intake', icon: Users, enabled: permissions.canManageLeads },
    { id: 'members', label: 'Matrix', icon: Activity, enabled: permissions.canManageProgress },
    { id: 'staff', label: 'Squad', icon: ShieldCheck, enabled: permissions.canManageAdmins },
    { id: 'protocols', label: 'Plans', icon: Layers, enabled: permissions.canManagePlans },
  ].filter(item => item.enabled), [permissions]);

  useEffect(() => {
    if (!navItems.find(item => item.id === activeTab)) {
      setActiveTab(navItems[0]?.id || 'leads');
    }
  }, [navItems, activeTab]);

  const PERMISSION_LABELS: Record<keyof AdminPermissions, string> = {
    canManageLeads: "Manage Intake (Leads)",
    canManageProgress: "Manage Matrix (Progress)",
    canManageAdmins: "Manage Squad (Staff)",
    canManagePlans: "Manage Protocols (Plans)",
    canManageNutrition: "Manage Nutrition"
  };
  
  const renderSkeletons = () => {
    // Skeleton rendering logic...
  };

  return (
    <div className="min-h-screen bg-[#020617] text-zinc-100 flex font-sans overflow-hidden">
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
          <button type="button" onClick={(e) => { e.preventDefault(); onGoHome(); }} className="w-full flex items-center px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
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
             {activeTab === 'staff' && permissions.canManageAdmins && (
                <button onClick={() => { setManualUser({...manualUser, role: 'admin'}); setShowManualAdd(true); }} className="bg-fuchsia-600 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20">
                  <ShieldCheck className="w-4 h-4" /> Add Operator
                </button>
             )}
             {activeTab === 'members' && permissions.canManageProgress && (
                <button onClick={() => { setManualUser({...manualUser, role: 'member'}); setShowManualAdd(true); }} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-xl shadow-white/10">
                  <UserPlus className="w-4 h-4" /> Add Athlete
                </button>
             )}
             {activeTab === 'protocols' && permissions.canManagePlans && (
                <button onClick={() => setEditingPlan({ features: [] })} className="bg-fuchsia-600 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20">
                  <PlusCircle className="w-4 h-4" /> Create Protocol
                </button>
             )}
             <button onClick={loadAll} className="p-5 bg-zinc-900 border border-white/5 rounded-full hover:border-fuchsia-500 transition-all">
                <RefreshCw className={`w-5 h-5 text-fuchsia-500 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </header>
        
        {/* Main content rendering based on activeTab */}
        
      </main>

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
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Full Name</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none font-bold text-sm"
                      value={assignmentData.name || ''} 
                      onChange={e => setAssignmentData({...assignmentData, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Email Address</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none font-bold text-sm"
                      value={assignmentData.email || ''} 
                      onChange={e => setAssignmentData({...assignmentData, email: e.target.value})} 
                    />
                  </div>
                   <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Phone Number</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none font-bold text-sm"
                      value={assignmentData.phone || ''} 
                      onChange={e => setAssignmentData({...assignmentData, phone: e.target.value})} 
                    />
                  </div>

                  {permissions.isSuper && (
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">System Role</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none font-bold text-sm appearance-none"
                        value={assignmentData.role}
                        onChange={e => setAssignmentData({...assignmentData, role: e.target.value as any})}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="nutritionist">Nutritionist</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  )}

                  {assignmentData.role === 'member' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Active Protocol</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none font-bold text-sm appearance-none"
                          value={assignmentData.activePlanId}
                          onChange={e => setAssignmentData({...assignmentData, activePlanId: e.target.value})}
                        >
                          {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                       <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Assigned Coach</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none font-bold text-sm appearance-none"
                          value={assignmentData.assignedCoachId || ''}
                          onChange={e => {
                             const coach = admins.find(a => a.id === e.target.value);
                             setAssignmentData({
                               ...assignmentData, 
                               assignedCoachId: e.target.value,
                               assignedCoachName: coach?.name || 'Unassigned'
                             });
                          }}
                        >
                          <option value="">Select Coach...</option>
                          {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                
                {(assignmentData.role === 'admin' || assignmentData.role === 'nutritionist') && permissions.isSuper && (
                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4 text-fuchsia-500" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Privilege Escalation (Super Admin)</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                         {(Object.keys(PERMISSION_LABELS) as Array<keyof AdminPermissions>).map((key) => (
                           <label key={key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                assignmentData.permissions?.[key] ? 'bg-fuchsia-600 border-fuchsia-500 text-white' : 'border-zinc-700 bg-zinc-900'
                              }`}>
                                {assignmentData.permissions?.[key] && <Check className="w-4 h-4 stroke-2" />}
                              </div>
                              <input type="checkbox" className="absolute opacity-0 w-0 h-0" checked={!!assignmentData.permissions?.[key]} onChange={() => togglePermission(key)} />
                              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{PERMISSION_LABELS[key]}</span>
                           </label>
                         ))}
                      </div>
                   </div>
                )}

                <div className="pt-6 flex gap-4">
                   {permissions.isSuper && editingUser.id !== user.id && editingUser.role !== 'super_admin' && (
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

      {/* Other modals */}
    </div>
  );
};

export default AdminDashboard;