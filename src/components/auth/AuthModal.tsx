import React, { useState } from 'react';
import {
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from '../../db/supabaseClient';
import {
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<'magic_link' | 'password'>('magic_link');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setMessage(null);

    const { error } = await signInWithMagicLink(email.trim());
    setIsLoading(false);

    if (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send magic link. Please check your email.',
      });
    } else {
      setMessage({
        type: 'success',
        text: `Magic sign-in link sent to ${email}! Please check your email inbox to sign in.`,
      });
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setMessage(null);

    if (isSignUp) {
      const { data, error } = await signUpWithPassword(email.trim(), password.trim());
      setIsLoading(false);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: 'Account created! Please check your email to confirm or sign in.',
        });
        if (data?.session && onSuccess) onSuccess();
      }
    } else {
      const { data, error } = await signInWithPassword(email.trim(), password.trim());
      setIsLoading(false);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        if (data?.session && onSuccess) onSuccess();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200/80 relative">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-lg">MoveTrack SG Security</h2>
            <p className="text-xs text-slate-500">
              Sign in to access your Bukit Batok 4-Room Relocation Catalog
            </p>
          </div>
        </div>

        {/* Tab Switcher: Magic Link vs Password */}
        <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setAuthMode('magic_link');
              setMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              authMode === 'magic_link'
                ? 'bg-white text-slate-900 font-bold shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Email Magic Link
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              authMode === 'password'
                ? 'bg-white text-slate-900 font-bold shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Password Sign In
          </button>
        </div>

        {/* Magic Link Form */}
        {authMode === 'magic_link' && (
          <form onSubmit={handleMagicLink} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                Your Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jason@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              We'll email you a secure 1-tap sign-in link. No password required!
            </p>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-md shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} />}
              <span>Send Magic Link</span>
            </button>
          </form>
        )}

        {/* Password Form */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordAuth} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jason@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-teal-700 font-bold hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-md shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={15} />}
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {/* Messages */}
        {message && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
