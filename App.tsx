
import React, { useState, useEffect } from 'react';
import HomePage from './HomePage';
import AdminDashboard from './components/AdminDashboard';
import MemberDashboard from './components/MemberDashboard';
import LoginModal from './components/LoginModal';
import { UserProfile } from './types';
import { api } from './api';
import { Loader2 } from 'lucide-react';

const App = () => {
  const [view, setView] = useState<'home' | 'admin' | 'member'>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('fitlife_vault_key_2024');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Auth check encountered a non-fatal interruption:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    setShowLogin(false);
    if (profile.role === 'member') {
      setView('member');
    } else {
      setView('admin');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setView('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-fuchsia-600 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">INITIALIZING VAULT INTERFACE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {view === 'home' && (
        <HomePage 
          onLoginMember={() => user ? (user.role === 'member' ? setView('member') : setView('admin')) : setShowLogin(true)} 
          user={user} 
        />
      )}
      
      {view === 'admin' && user && (
        <AdminDashboard 
          user={user} 
          onLogout={handleLogout} 
          onGoHome={() => setView('home')} 
        />
      )}
      
      {view === 'member' && user && (
        <MemberDashboard 
          user={user} 
          onLogout={handleLogout} 
          onGoHome={() => setView('home')} 
        />
      )}

      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}
    </div>
  );
};

export default App;