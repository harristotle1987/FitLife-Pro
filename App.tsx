
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
      // Check for token existence to avoid unnecessary loading states for new visitors
      const token = localStorage.getItem('fitlife_vault_key_2024');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // We land on 'home' by default to ensure the landing page is accessible.
          // Users can navigate to their dashboard via the 'Vault'/'Dashboard' button in the Navbar.
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    setShowLogin(false);
    // After a fresh login, take them directly to their operational dashboard
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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-fuchsia-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617]">
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
