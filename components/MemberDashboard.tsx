
import React, { useEffect, useState, useRef } from 'react';
import { UserProfile, MemberProgress } from '../types.ts';
import { api } from '../api.ts';
import { createChatSession } from '../aiService.ts';
import * as assets from '../assets.ts';
import { Home, LogOut, Calendar, Loader2, Sparkles, BrainCircuit, Salad, Info, Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';

// PCM Audio Helper Functions (per Gemini SDK Guidelines)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const MemberDashboard = ({ user, onLogout, onGoHome }: { user: UserProfile, onLogout: () => void, onGoHome: () => void }) => {
  const [history, setHistory] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'growth' | 'fuel'>('growth');
  const [profile, setProfile] = useState<UserProfile>(user);
  const [aiInsight, setAiInsight] = useState<string>("INITIALIZING STRATEGIC BRIEFING...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Live Voice State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [h, p] = await Promise.all([
        api.getMemberProgress(user.id),
        api.getProfile(user.id)
      ]);
      setHistory(h);
      if (p) setProfile(p);
      setLoading(false);
      
      setIsAnalyzing(true);
      const coach = createChatSession();
      const insight = await coach.analyzeProgress(h);
      setAiInsight(insight);
      setIsAnalyzing(false);
    };
    fetchAll();
  }, [user.id]);

  const toggleLiveCall = async () => {
    if (isLiveActive) {
      if (liveSessionRef.current) liveSessionRef.current.close();
      setIsLiveActive(false);
      return;
    }

    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const coach = createChatSession();
      const sessionPromise = coach.connectLive({
        onopen: () => {
          setIsConnecting(false);
          setIsLiveActive(true);
          
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
            
            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            
            sessionPromise.then((session: any) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (message: any) => {
          const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioBase64 && outputCtx) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            const audioBuffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputCtx.destination);
            source.addEventListener('ended', () => sourcesRef.current.delete(source));
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onclose: () => {
          setIsLiveActive(false);
          setIsConnecting(false);
        },
        onerror: (e: any) => console.error("Live Audio Error:", e)
      });

      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start live session:", err);
      setIsConnecting(false);
    }
  };

  const renderSkeleton = () => (
    <div className="grid lg:grid-cols-3 gap-10 animate-pulse">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[3rem] h-48">
                <div className="h-4 w-1/3 bg-zinc-800 rounded mb-6"></div>
                <div className="space-y-3">
                    <div className="h-6 bg-zinc-800 rounded"></div>
                    <div className="h-6 w-5/6 bg-zinc-800 rounded"></div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 h-28"></div>
                <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 h-28"></div>
                <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 h-28"></div>
            </div>
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
                <div className="h-5 w-1/4 bg-zinc-800 rounded mb-6"></div>
                <div className="space-y-4">
                    <div className="h-20 bg-zinc-900 rounded-2xl"></div>
                    <div className="h-20 bg-zinc-900 rounded-2xl"></div>
                    <div className="h-20 bg-zinc-900 rounded-2xl"></div>
                </div>
            </div>
        </div>
        <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10 h-72"></div>
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 h-24"></div>
        </div>
    </div>
  );

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
             <button onClick={onGoHome} className="flex items-center gap-3 px-6 py-4 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all">
                <Home className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Go Home</span>
             </button>
             <div className="flex bg-zinc-900/50 p-1 rounded-full border border-white/5">
                <button onClick={() => setActiveTab('growth')} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'growth' ? 'bg-white text-black' : 'text-zinc-500'}`}>Growth</button>
                <button onClick={() => setActiveTab('fuel')} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'fuel' ? 'bg-white text-black' : 'text-zinc-500'}`}>Fuel Lab</button>
             </div>
             <button onClick={onLogout} className="p-4 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-red-400 transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>

        {loading ? renderSkeleton() : (
          <div className="grid lg:grid-cols-3 gap-10 animate-fade-in">
            <div className="lg:col-span-2 space-y-8">
              {activeTab === 'growth' && (
                <>
                  <div className="bg-fuchsia-950/20 border border-fuchsia-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                     <div className="absolute top-8 right-8">
                        {isAnalyzing ? <Loader2 className="w-5 h-5 text-fuchsia-500 animate-spin" /> : <Sparkles className="w-5 h-5 text-fuchsia-500 animate-pulse" />}
                     </div>
                     <BrainCircuit className="absolute -right-10 -top-10 w-48 h-48 opacity-[0.05]" />
                     <h2 className="text-fuchsia-500 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                       Coach Bolt Briefing {isAnalyzing && <span className="text-[8px] animate-pulse">(Analyzing Matrix...)</span>}
                     </h2>
                     <p className={`text-2xl font-black italic uppercase leading-relaxed transition-opacity duration-500 ${isAnalyzing ? 'opacity-30' : 'opacity-100'}`}>
                       "{aiInsight}"
                     </p>
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
                        {history.length === 0 ? (
                          <p className="text-center py-12 text-zinc-600 font-black uppercase text-[10px] tracking-widest">No Biometric Logs Detected</p>
                        ) : history.map(log => (
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
                </>
              )}

              {activeTab === 'fuel' && (
                <div className="animate-fade-in space-y-8">
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
                         <pre className="text-zinc-200 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                            {profile.nutritionalProtocol || 'Metabolic analysis in progress.'}
                         </pre>
                      </div>
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10 h-fit">
                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-8 text-zinc-500">Operative Specialist</h3>
                  <div className="flex items-center gap-4 mb-10">
                     <div className="w-16 h-16 rounded-2xl bg-[#020617] border border-white/5 flex items-center justify-center">
                        <img src={assets.ai_avatar} className="w-full h-full object-cover rounded-2xl opacity-50" />
                     </div>
                     <div>
                        <p className="font-black italic uppercase text-white">{profile.assignedCoachName}</p>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase">Strategy Specialist</p>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={toggleLiveCall}
                      disabled={isConnecting}
                      className={`w-full py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                        isLiveActive 
                          ? 'bg-red-600 text-white hover:bg-red-500' 
                          : 'bg-fuchsia-600 text-white hover:bg-fuchsia-500'
                      }`}
                    >
                      {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        isLiveActive ? <><PhoneOff className="w-4 h-4" /> End Briefing</> : <><Mic className="w-4 h-4" /> Start Live Briefing</>
                      )}
                    </button>
                    <button className="w-full bg-white text-black py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-zinc-200 transition-all">Send Message</button>
                  </div>

                  {isLiveActive && (
                    <div className="mt-8 p-6 bg-fuchsia-600/10 border border-fuchsia-500/30 rounded-3xl animate-pulse">
                      <div className="flex items-center justify-center gap-4 mb-2">
                        <div className="h-1 w-8 bg-fuchsia-500 rounded-full"></div>
                        <Volume2 className="w-5 h-5 text-fuchsia-500" />
                        <div className="h-1 w-8 bg-fuchsia-500 rounded-full"></div>
                      </div>
                      <p className="text-[8px] font-black uppercase text-center text-fuchsia-500 tracking-[0.3em]">Specialist Online // Listening</p>
                    </div>
                  )}
              </div>
              
              <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
                 <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">Protocol Vitality</h4>
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-bold uppercase">Consistency Matrix</span>
                   <span className="text-[10px] font-bold text-fuchsia-500 italic">94%</span>
                 </div>
                 <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-fuchsia-600 h-full w-[94%] shadow-[0_0_10px_#c026d3]"></div>
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