
import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, MemberProgress } from '../types';
import { api } from '../api';
import { FitnessAnalysisEngine } from '../aiService';
import { Activity, LogOut, TrendingUp, Calendar, Home, Salad, Award, Droplet, BrainCircuit, Loader2, Info } from 'lucide-react';

const MemberDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [history, setHistory] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'growth' | 'fuel' | 'billing'>('growth');
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

  const coachInsight = useMemo(() => FitnessAnalysisEngine.analyzeProgress(history), [history]);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans selection:bg-fuchsia-600 selection:text-white">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-fuchsia-600 to-yellow-500 p-1">
              <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center font-black text-2xl uppercase italic">{profile.name.charAt(0)}</div>
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">{profile.name}</h1>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Status: Operational // {profile.activePlanId?.replace('plan_', '').toUpperCase()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={onGoHome} className="p-4 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><Home className="w-5 h-5" /></button>
             <div className="flex bg-zinc-900/50 p-1 rounded-full border border-white/5">
                <button onClick={() => setActiveTab('growth')} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'growth' ? 'bg-white text-black' : 'text-zinc-500'}`}>Growth</button>
                <button onClick={() => setActiveTab('fuel')} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'fuel' ? 'bg-white text-black' : 'text-zinc-500'}`}>Fuel Lab</button>
             </div>
             <button onClick={onLogout} className="p-4 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-red-400 transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>

        {activeTab === 'growth' && (
          <div className="grid lg:grid-cols-3 gap-10 animate-fade-in">
             <div className="lg:col-span-2 space-y-8">
                <div className="bg-fuchsia-950/20 border border-fuchsia-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                   <BrainCircuit className="absolute -right-10 -top-10 w-48 h-48 opacity-[0.05]" />
                   <h2 className="text-fuchsia-500 font-black uppercase text-[10px] tracking-widest mb-4">Coach Insight</h2>
                   <p className="text-2xl font-black italic uppercase leading-relaxed">"{coachInsight}"</p>
                </div>
                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 text-center">
                      <p className="text-[9px] text-zinc-500 uppercase font-black mb-2">Weight</p>
                      <p className="text-4xl font-black">{history[0]?.weight || '--'} <span className="text-xs font-normal opacity-40">lbs</span></p>
                   </div>
                   <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 text-center">
                      <p className="text-[9px] text-zinc-500 uppercase font-black mb-2">BF %</p>
                      <p className="text-4xl font-black">{history[0]?.body_fat || '--'}%</p>
                   </div>
                   <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 text-center">
                      <p className="text-[9px] text-zinc-500 uppercase font-black mb-2">Score</p>
                      <p className="text-4xl font-black text-fuchsia-500 italic">{history[0]?.performance_score || '--'}</p>
                   </div>
                </div>
                <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
                   <h3 className="text-xl font-black italic uppercase mb-6">Matrix History</h3>
                   <div className="space-y-4">
                      {history.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5">
                           <div className="flex items-center gap-4">
                              <Calendar className="w-5 h-5 text-zinc-600" />
                              <span className="text-sm font-bold uppercase">{new Date(log.date).toLocaleDateString()}</span>
                           </div>
                           <div className="flex gap-6">
                              <span className="text-xs font-black uppercase tracking-widest">{log.weight}LBS</span>
                              <span className="text-xs font-black text-fuchsia-500 uppercase tracking-widest">{log.performance_score}PTS</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10 h-fit">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-8 text-zinc-500">Operative Specialist</h3>
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-[#020617] border border-white/5"></div>
                   <div>
                      <p className="font-black italic uppercase text-white">{profile.assignedCoachName}</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase">Assigned Strategy Specialist</p>
                   </div>
                </div>
                <button className="w-full bg-white text-black py-4 mt-12 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl">Contact Specialist</button>
             </div>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
             <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-12 shadow-2xl">
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-5 bg-fuchsia-600/10 border border-fuchsia-500/20 rounded-2xl">
                      <Salad className="w-10 h-10 text-fuchsia-500" />
                   </div>
                   <div>
                      <p className="text-fuchsia-500 font-black uppercase text-[10px] tracking-[0.4em] mb-1">Assigned Protocol</p>
                      <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Fuel Infrastructure</h2>
                   </div>
                </div>
                
                <div className="bg-black/40 border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden">
                   <div className="absolute top-4 right-6 flex items-center gap-2 text-[9px] font-black uppercase text-zinc-700 tracking-widest">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Verified Protocol
                   </div>
                   <pre className="text-zinc-200 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {profile.nutritionalProtocol || 'Metabolic analysis in progress. Please wait for specialist verification.'}
                   </pre>
                </div>
                
                <div className="mt-8 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                   <Info className="w-5 h-5 text-zinc-500" />
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                      THIS PROTOCOL IS SURGICALLY ENGINEERED BASED ON YOUR BIO-DATA. DEVIATION MAY VOID RESULTS.
                   </p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
