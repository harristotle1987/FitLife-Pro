import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, MemberProgress } from '../types';
import { api } from '../api';
import { FitnessAnalysisEngine } from '../aiService';
import { Activity, LogOut, TrendingUp, Calendar, User, MapPin, Smartphone, Mail, Edit3, Shield, Award, Droplet, Salad, BrainCircuit, ChevronRight, CreditCard, ExternalLink, Home } from 'lucide-react';

const MemberDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [history, setHistory] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'growth' | 'profile' | 'billing'>('growth');
  const [profile, setProfile] = useState<UserProfile>(user);

  useEffect(() => {
    const fetchAll = async () => {
      const [h, p] = await Promise.all([
        api.getMemberProgress(user.id),
        api.getProfile(user.id)
      ]);
      setHistory(h);
      if (p) setProfile(p);
      setLoading(false);
    };
    fetchAll();
  }, [user.id]);

  const latest = history[0];
  
  const coachInsight = useMemo(() => {
    return FitnessAnalysisEngine.analyzeProgress(history);
  }, [history]);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans overflow-x-hidden selection:bg-fuchsia-600 selection:text-white">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-fuchsia-600 to-yellow-500 shadow-2xl">
                 <img src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} className="w-full h-full rounded-full object-cover border-4 border-[#020617]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-[#020617] shadow-lg"></div>
            </div>
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">{profile.name}</h1>
              <div className="flex items-center gap-4 mt-3">
                 <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20">Active Athlete</span>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Biological Records Verified</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             {/* Home Button added here */}
             <button onClick={onGoHome} className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:border-fuchsia-500 transition-all">
                <Home className="w-4 h-4" /> Home
             </button>

             <div className="flex bg-zinc-900/80 p-1 rounded-full border border-white/5 backdrop-blur-xl">
                <button onClick={() => setActiveTab('growth')} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'growth' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Growth Logs</button>
                <button onClick={() => setActiveTab('billing')} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'billing' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Vault Status</button>
                <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Bio</button>
             </div>
             
             <button onClick={onLogout} className="p-4 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-red-400 transition-all active:scale-95 shadow-xl">
               <LogOut className="w-6 h-6" />
             </button>
          </div>
        </header>

        {activeTab === 'growth' && (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10 animate-fade-in">
              <div className="bg-gradient-to-br from-fuchsia-950/40 to-slate-900 border border-fuchsia-500/30 rounded-[3rem] p-10 shadow-[0_0_60px_rgba(192,38,211,0.1)] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                 <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div className="w-20 h-20 bg-fuchsia-600/10 rounded-2xl border border-fuchsia-500/20 flex items-center justify-center shrink-0">
                       <BrainCircuit className="w-10 h-10 text-fuchsia-500" />
                    </div>
                    <div>
                       <div className="flex items-center gap-3 mb-4">
                          <p className="text-fuchsia-500 font-black uppercase text-[10px] tracking-[0.4em]">Strategic Analysis</p>
                          <div className="h-px w-12 bg-fuchsia-500/30"></div>
                       </div>
                       <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">Coach Bolt's Insight</h2>
                       <p className="text-xl text-zinc-200 font-black italic uppercase tracking-tight leading-relaxed max-w-3xl">
                          "{coachInsight}"
                       </p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Current Weight", val: latest?.weight || '--', unit: "lbs", icon: Activity, color: "text-white" },
                  { label: "Body Fat", val: latest?.body_fat || '--', unit: "%", icon: Droplet, color: "text-white" },
                  { label: "Performance Score", val: latest?.performance_score || '--', unit: "Pts", icon: Award, color: "text-fuchsia-500" }
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group hover:border-fuchsia-500/30 transition-all">
                    <stat.icon className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-[0.03] group-hover:opacity-10 transition-opacity" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                    <p className={`text-6xl font-black italic tracking-tighter ${stat.color}`}>
                      {stat.val} <span className="text-sm font-normal text-zinc-600 not-italic uppercase tracking-widest">{stat.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                   <h2 className="text-3xl font-black italic uppercase tracking-tighter">Growth Matrix</h2>
                   <div className="flex items-center gap-2 text-fuchsia-500">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Optimizing Matrix</span>
                   </div>
                </div>
                
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-zinc-700 animate-pulse uppercase font-black text-xs">Syncing Trends...</div>
                ) : (
                  <div className="space-y-6">
                     {history.length === 0 ? (
                        <div className="p-20 text-center text-zinc-600 italic">No records found. Complete your initial briefing.</div>
                     ) : (
                        history.map((log) => (
                          <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-zinc-950/50 rounded-3xl border border-white/5 group hover:border-fuchsia-500/20 transition-all shadow-inner">
                             <div className="flex items-center gap-6">
                                <div className="p-4 bg-[#020617] rounded-2xl border border-white/5">
                                   <Calendar className="w-6 h-6 text-zinc-600 group-hover:text-fuchsia-500 transition-colors" />
                                </div>
                                <div>
                                   <p className="text-xl font-black italic text-white uppercase tracking-tighter">{new Date(log.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Verified by Coach</p>
                                </div>
                             </div>
                             <div className="flex gap-8 mt-4 md:mt-0">
                                <div className="text-right">
                                   <p className="text-[9px] text-zinc-600 font-black uppercase">Weight</p>
                                   <p className="text-2xl font-black">{log.weight}lbs</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[9px] text-zinc-600 font-black uppercase">Efficiency</p>
                                   <p className="text-2xl font-black text-fuchsia-500 italic">{log.performance_score}</p>
                                </div>
                             </div>
                          </div>
                        ))
                     )}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-8 animate-fade-in delay-200">
               <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-600/10 blur-3xl -mr-16 -mt-16"></div>
                  <h3 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.2em] mb-8">Specialist Support</h3>
                  
                  <div className="space-y-10">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 rounded-2xl bg-[#020617] border border-white/5 p-1">
                          <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200" className="w-full h-full rounded-xl object-cover grayscale" />
                       </div>
                       <div>
                          <p className="text-lg font-black text-white italic uppercase tracking-tighter">{profile.assignedCoachName || 'Unassigned'}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Strategy Specialist</p>
                       </div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-white text-black py-5 mt-12 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-2xl">
                     Request Briefing
                  </button>
               </div>
            </aside>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="max-w-4xl mx-auto animate-fade-in space-y-10">
             <div className="bg-zinc-900/30 border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/5 blur-[120px] -mr-48 -mt-48"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                   <div className="flex-1">
                      <div className="flex items-center gap-4 mb-8">
                         <div className="p-4 bg-fuchsia-600/10 border border-fuchsia-500/20 rounded-2xl">
                            <CreditCard className="w-8 h-8 text-fuchsia-500" />
                         </div>
                         <div>
                            <p className="text-fuchsia-500 font-black uppercase text-[10px] tracking-[0.4em] mb-1">Financial Infrastructure</p>
                            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Vault Status</h2>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Active Protocol</p>
                            <h3 className="text-2xl font-black text-white uppercase italic">{profile.activePlanId?.replace('plan_', '').toUpperCase() || 'NO ACTIVE PROTOCOL'}</h3>
                            <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-black uppercase">
                               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                               Payment Status: Verified
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-6">
                            <button className="bg-white text-black py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                               Manage Sub <ExternalLink className="w-3 h-3" />
                            </button>
                            <button className="bg-zinc-950 border border-white/5 text-white py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:border-fuchsia-500 transition-all">
                               View Invoices
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="w-full md:w-80 space-y-4">
                      <div className="p-6 bg-zinc-950/50 border border-white/5 rounded-3xl">
                         <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Security Notice</p>
                         <p className="text-[11px] font-medium text-zinc-400 leading-relaxed">
                            All transactions are encrypted and processed through Stripe's global secure infrastructure. Your biological records are isolated from financial logs.
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
             <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-12 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-12 items-start">
                   <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                      <img src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                   </div>

                   <div className="flex-1 space-y-8">
                      <div>
                         <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter mb-4">Athlete Identity</h2>
                         <p className="text-zinc-400 leading-relaxed font-medium">
                            {profile.bio || "Optimizing biological performance through surgical precision."}
                         </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3" /> Digital Access</p>
                            <p className="text-lg font-bold text-white">{profile.email}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Operative Location</p>
                            <p className="text-lg font-bold text-white">{profile.address || "Miami, FL"}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;