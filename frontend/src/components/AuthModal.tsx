import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Mail, Lock, User, LogIn, UserPlus, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic_link'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!password) {
          setErrorMsg('Please enter your password.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        if (data.user) {
          setSuccessMsg('Successfully signed in!');
          setTimeout(() => {
            onAuthSuccess(data.user);
            onClose();
          }, 800);
        }
      } else if (mode === 'signup') {
        if (!password || password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        if (data.user) {
          if (data.session) {
            setSuccessMsg('Account created and signed in successfully!');
            setTimeout(() => {
              onAuthSuccess(data.user);
              onClose();
            }, 800);
          } else {
            setSuccessMsg('Account created! Please check your email for the confirmation link, or log in if confirmation is disabled.');
          }
        }
      } else if (mode === 'magic_link') {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
        });

        if (error) throw error;
        setSuccessMsg('Magic link sent! Check your email inbox to log in instantly.');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#18151e] border border-brand-gold/30 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800 bg-[#211c2a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-maroon/60 border border-brand-gold/40 flex items-center justify-center">
              <User size={16} className="text-brand-gold" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-brand-gold-light">
                {mode === 'signin' ? 'Sign In to Account' : mode === 'signup' ? 'Create Team Account' : 'Passwordless Login'}
              </h3>
              <p className="text-[11px] text-stone-400">KALAKAR EVENTS Cloud Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-800 bg-[#14111a] text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'border-brand-gold text-brand-gold-light bg-stone-800/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'border-brand-gold text-brand-gold-light bg-stone-800/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <UserPlus size={13} />
            <span>Register New</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('magic_link'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'magic_link'
                ? 'border-brand-gold text-brand-gold-light bg-stone-800/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles size={13} />
            <span>Magic Link</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAuth} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                <Mail size={15} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@kalakarevents.com"
                className="w-full bg-[#100d14] border border-stone-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-brand-gold transition"
              />
            </div>
          </div>

          {/* Password input (hidden in magic link mode) */}
          {mode !== 'magic_link' && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#100d14] border border-stone-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-brand-gold transition"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-[11px] text-stone-500 mt-1">Must be at least 6 characters</p>
              )}
            </div>
          )}

          {/* Multi-device cloud sync note */}
          <div className="p-3 bg-stone-900/60 border border-stone-800 rounded-xl text-[11px] text-stone-400 flex items-center gap-2">
            <Sparkles size={14} className="text-brand-gold shrink-0" />
            <span>
              Log in from your phone, laptop, or other devices to sync all quotations and invoices automatically.
            </span>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark hover:from-brand-maroon-light hover:to-brand-maroon text-brand-gold-light border border-brand-gold/40 rounded-xl text-xs font-bold tracking-wide shadow-lg hover:shadow-brand-maroon/40 transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : mode === 'signin' ? (
              <>
                <LogIn size={14} />
                <span>Sign In to Device</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus size={14} />
                <span>Create New Account</span>
              </>
            ) : (
              <>
                <Mail size={14} />
                <span>Send Magic Link</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
