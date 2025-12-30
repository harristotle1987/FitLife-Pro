
import React, { useState } from 'react';
import { X, Lock, Mail, Loader2, ArrowRight, ShieldCheck, UserPlus, User, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { UserProfile } from '../types';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState('');
  const [showRepair, setShowRepair] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowRepair(false);

    try {
      if (mode === 'login') {
        const response = await api.login(email, password);
        if (response.success && response.data) {
          onLoginSuccess(response.data);
          onClose();
        } else {
          setError(response.message || 'Vault credentials mismatch. Identity not verified.');
          // Show repair option if it looks like a database sync issue
          if (response.message?.toLowerCase().includes('sync') || response.message?.toLowerCase().includes('column')) {
            setShowRepair(true);
          }
        }
      } else {
        if (!name.trim()) {
          setError('Athlete name required for protocol initialization.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Security requirement: Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        
        const response = await api.register(name, email, password);
        if (response.success && response.data) {
          onLoginSuccess(response.data);
          onClose();
        } else {
          setError(response.message || 'Identity conflict or infrastructure offline. Entry rejected.');
        }
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      setError(err.message || 'System infrastructure timeout. Please retry.');
      if (err.message?.toLowerCase().includes('column') || err.message?.toLowerCase().includes('exist')) {
        setShowRepair(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    setRepairing(true);
    try {
      const ok = await api.bootstrapDatabase();
      if (ok) {
        alert("Vault Infrastructure Repaired. Try logging in again.");
        setShowRepair(false);
        setError('');
      } else {
        alert("Repair failed. Please check backend connection.");
      }
    } catch (err) {
      alert("Network error during repair.");
    } finally {
      setRepairing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-fade-in">
      <div className="bg-[#020617] border border-white/10 w-full max-w-md rounded-[3rem] p-10 relative shadow-[0_0_100px_rgba(192,38,211,0.2)]">
        <button onClick={onClose} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors">
          <X className="w-8 h-8" />
        </button>

        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-fuchsia-600/10 border border-fuchsia-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            {mode === 'login' ? <Lock className="w-8 h-8 text-fuchsia-500" /> : <UserPlus className="w-8 h-8 text-fuchsia-500" />}
          </div>
          <p className="text-fuchsia-500 font-black uppercase text-[10px] tracking-[0.4em] mb-2">Authenticated Access</p>
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">
            {mode === 'login' ? 'Vault Login' : 'Protocol Entry'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
              <input 
                type="text" 
                required 
                placeholder="Full Name"
                className="w-full bg-white/5 border border-white/5 text-white p-5 pl-14 rounded-2xl focus:border-fuchsia-500 outline-none font-bold text-sm transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input 
              type="email" 
              required 
              placeholder="Email Address"
              className="w-full bg-white/5 border border-white/5 text-white p-5 pl-14 rounded-2xl focus:border-fuchsia-500 outline-none font-bold text-sm transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input 
              type="password" 
              required 
              placeholder="Vault Password"
              className="w-full bg-white/5 border border-white/5 text-white p-5 pl-14 rounded-2xl focus:border-fuchsia-500 outline-none font-bold text-sm transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          {showRepair && (
            <button 
              type="button"
              onClick={handleRepair}
              disabled={repairing}
              className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-500/20 transition-all"
            >
              {repairing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Emergency Repair Vault Database
            </button>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black py-6 rounded-full font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {mode === 'login' ? 'Initiate Session' : 'Initialize Profile'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-6">
          <button 
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
              setShowRepair(false);
            }}
            className="text-fuchsia-500 hover:text-fuchsia-400 text-[11px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            {mode === 'login' ? "New Member? Register Strategy" : "Existing Member? Return to Vault"}
          </button>

          <div className="flex flex-col items-center gap-2">
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Encrypted by FP infrastructure
            </p>
            <div className="flex gap-4">
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[8px] text-zinc-700 hover:text-zinc-500 uppercase font-black transition-colors underline">System Status</a>
               <button 
                 onClick={() => setShowRepair(!showRepair)} 
                 className="text-[8px] text-zinc-800 hover:text-zinc-600 uppercase font-black transition-colors flex items-center gap-1"
               >
                 <AlertTriangle className="w-2 h-2" /> Sync Mode
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
