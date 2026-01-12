
import React, { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GET_PLANS, USER_PROFILE, DEFAULT_CONFIG } from './constants';
import { SubscriptionPlan, AppConfig } from './types';
import VideoCallModal from './components/VideoCallModal';

const App: React.FC = () => {
  // State Management
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [activeCallPlan, setActiveCallPlan] = useState<string | null>(null);
  
  // Supabase connection state
  const defaultUrl = `https://sybezgliqtwkcsmsfhlg.supabase.co`;
  // We use the provided public API key as a fallback
  const defaultKey = 'sb_publishable_D5wDGZ6CevFPrCmskT2twg_99F2Vrey';
  
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('sb_url') || defaultUrl);
  const [sbKey, setSbKey] = useState(localStorage.getItem('sb_key') || (process.env as any).SUPABASE_ANON_KEY || '');
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // Login Form State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Initialize Supabase Client
  const initSupabase = useCallback((url: string, key: string) => {
    if (url && key) {
      try {
        const client = createClient(url, key);
        setSupabase(client);
        return client;
      } catch (e) {
        console.error("Supabase Init Error:", e);
      }
    }
    return null;
  }, []);

  // Fetch data from Supabase
  const fetchFromDb = useCallback(async (client: SupabaseClient) => {
    try {
      const { data, error } = await client
        .from('site_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        setConfig({
          userName: data.user_name || DEFAULT_CONFIG.userName,
          images: (data.images && data.images.length === 10) ? data.images : DEFAULT_CONFIG.images,
          trialPrice: data.trial_price || DEFAULT_CONFIG.trialPrice,
          weeklyPrice: data.weekly_price || DEFAULT_CONFIG.weeklyPrice,
          bestValuePrice: data.best_value_price || DEFAULT_CONFIG.bestValuePrice,
          trialRedirectUrl: data.trial_redirect_url || DEFAULT_CONFIG.trialRedirectUrl,
          premiumRedirectUrl: data.premium_redirect_url || DEFAULT_CONFIG.premiumRedirectUrl,
        });
        return true;
      }
    } catch (err) {
      console.warn('DB Fetch Error (Ensure table exists and RLS is off or configured):', err);
    }
    return false;
  }, []);

  // Initial load logic
  useEffect(() => {
    const start = async () => {
      if (sbUrl && sbKey) {
        const client = initSupabase(sbUrl, sbKey);
        if (client) {
          await fetchFromDb(client);
        }
      }
      setLoading(false);
    };
    start();
  }, [sbUrl, sbKey, initSupabase, fetchFromDb]);

  const saveToSupabase = async (newConfig: AppConfig) => {
    setConfig(newConfig);

    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('site_config')
        .upsert({
          id: 1,
          user_name: newConfig.userName,
          images: newConfig.images,
          trial_price: newConfig.trialPrice,
          weekly_price: newConfig.weeklyPrice,
          best_value_price: newConfig.bestValuePrice,
          trial_redirect_url: newConfig.trialRedirectUrl,
          premium_redirect_url: newConfig.premiumRedirectUrl,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Supabase update error:', err);
    }
  };

  const handleConnectSupabase = async () => {
    const client = initSupabase(sbUrl, sbKey);
    if (client) {
      const success = await fetchFromDb(client);
      localStorage.setItem('sb_url', sbUrl);
      localStorage.setItem('sb_key', sbKey);
      if (success) {
        alert("Connected successfully to Amazon project database!");
      } else {
        alert("Connected to Supabase, but could not find data. Did you run the SQL script?");
      }
    }
  };

  const handleSubscribe = (planId: SubscriptionPlan, planName: string) => {
    if (planId === SubscriptionPlan.TRIAL) {
        setActiveCallPlan(planName);
    } else {
        const targetUrl = config.premiumRedirectUrl;
        window.open(targetUrl, '_blank');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'Cardbig' && loginPass === 'Cardbig123##') {
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setShowAdminPanel(true);
    } else {
      alert('Invalid username or password');
    }
  };

  const plans = GET_PLANS(config);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showAdminPanel && isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 text-white animate-fadeIn pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">
                {supabase ? "✅ Connected to Amazon Project" : "❌ Not Connected"}
              </p>
            </div>
            <button 
              onClick={() => setShowAdminPanel(false)}
              className="px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/5"
            >
              Close & View Site
            </button>
          </div>

          <div className="space-y-12">
            {/* Supabase Config Section */}
            <section className={`glass-card p-8 rounded-3xl border ${supabase ? 'border-green-500/20' : 'border-pink-500/30'}`}>
              <h2 className="text-xl font-bold mb-4">Database Connection</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Supabase URL</label>
                  <input type="text" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Public API Key (Anon Key)</label>
                  <input type="password" value={sbKey} onChange={(e) => setSbKey(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none" />
                </div>
                <button onClick={handleConnectSupabase} className="px-6 py-3 bg-pink-600 rounded-xl font-bold">Save & Connect</button>
              </div>
            </section>

            {/* Profile Settings */}
            <section className="glass-card p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
              <label className="block text-sm text-slate-400 mb-2">Display Name</label>
              <input type="text" value={config.userName} onChange={(e) => saveToSupabase({...config, userName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none" />
            </section>

            {/* Pricing Config */}
            <section className="glass-card p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold mb-6">Pricing Settings</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <input type="text" value={config.trialPrice} onChange={(e) => saveToSupabase({...config, trialPrice: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 outline-none" placeholder="Trial Price" />
                <input type="text" value={config.weeklyPrice} onChange={(e) => saveToSupabase({...config, weeklyPrice: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 outline-none" placeholder="Weekly Price" />
                <input type="text" value={config.bestValuePrice} onChange={(e) => saveToSupabase({...config, bestValuePrice: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 outline-none" placeholder="Monthly Price" />
              </div>
            </section>

            {/* Images Config */}
            <section className="glass-card p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold mb-6">Gallery Images (10)</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {config.images.map((img, idx) => (
                  <input key={idx} type="text" value={img} onChange={(e) => {
                    const newImages = [...config.images];
                    newImages[idx] = e.target.value;
                    saveToSupabase({...config, images: newImages});
                  }} className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none" />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-heart"></i>
            </div>
            <span className="text-2xl font-bold">Talk to me</span>
          </div>
          <div className="hidden md:flex gap-8 text-slate-400">
            <a href="#gallery">Gallery</a>
            <a href="#pricing">Plans</a>
          </div>
          <button onClick={() => setShowLoginModal(true)} className="px-6 py-2 bg-white text-black rounded-full font-bold">Admin</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-6xl font-extrabold mb-6 leading-tight">
          Connect with <span className="gradient-text">{config.userName}</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10">Experience the most intimate video calling platform.</p>
        <div className="flex justify-center gap-4">
          <a href="#pricing" className="px-8 py-4 bg-pink-600 rounded-2xl font-bold">Start Video Call</a>
          <a href="#gallery" className="px-8 py-4 bg-white/5 rounded-2xl font-bold border border-white/10">Gallery</a>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="glass-card rounded-[32px] p-8 border border-white/10 text-center">
            <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
            <div className="text-5xl font-extrabold mb-8">{plan.price}</div>
            <ul className="text-slate-400 mb-10 space-y-2">
              {plan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <button onClick={() => handleSubscribe(plan.id, plan.name)} className="w-full py-4 bg-pink-600 rounded-2xl font-bold">Select Plan</button>
          </div>
        ))}
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-12">Photo Gallery</h2>
        <div className="columns-2 md:columns-4 gap-4 space-y-4">
          {config.images.map((img, idx) => (
            <img key={idx} src={img} className="rounded-3xl cursor-pointer hover:scale-105 transition-transform" onClick={() => setViewingImage(img)} />
          ))}
        </div>
      </section>

      {activeCallPlan && <VideoCallModal planName={activeCallPlan} onClose={() => setActiveCallPlan(null)} />}
      
      {viewingImage && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
          <img src={viewingImage} className="max-h-full rounded-xl" />
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-[32px] p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-8 text-center">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" placeholder="Username" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none" />
              <input type="password" placeholder="Password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none" />
              <button type="submit" className="w-full py-4 bg-pink-600 rounded-2xl font-bold">Login</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-slate-500">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
