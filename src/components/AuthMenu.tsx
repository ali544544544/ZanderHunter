import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../services/supabase';

type AuthMode = 'login' | 'signup' | 'reset' | 'password';

const getRedirectUrl = () => window.location.href.split('#')[0];

const AuthMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setUser(data.user ?? null);
        setEmail(data.user?.email ?? '');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setEmail(session?.user?.email ?? '');
      if (session?.user) {
        setMode('password');
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const runAuthAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setMessage('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessage('Eingeloggt.');
        setOpen(false);
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: getRedirectUrl(),
          },
        });
        if (error) throw error;
        setMessage('Account erstellt. Falls E-Mail-Bestätigung aktiv ist: Postfach prüfen.');
      }

      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getRedirectUrl(),
        });
        if (error) throw error;
        setMessage('Link zum Zurücksetzen wurde gesendet.');
      }

      if (mode === 'password') {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword('');
        setMessage('Passwort geändert.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setPassword('');
    setNewPassword('');
    setMessage('');
    setMode('login');
    setOpen(false);
  };

  const title = user
    ? 'Account'
    : mode === 'signup'
      ? 'Account erstellen'
      : mode === 'reset'
        ? 'Passwort zurücksetzen'
        : 'Einloggen';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-11 items-center justify-center rounded-lg border text-lg font-black transition-colors ${
          user
            ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
            : 'border-slate-700 bg-slate-900 text-slate-200'
        }`}
        aria-label={user ? 'Account öffnen' : 'Einloggen'}
        aria-expanded={open}
        title={user ? 'Account' : 'Einloggen'}
      >
        {user ? '✓' : '👤'}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(88vw,22rem)] rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-slate-950/70">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">ZanderHunter</p>
              <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-lg font-black text-slate-200"
              aria-label="Account-Menü schließen"
            >
              ×
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <p className="text-xs font-semibold text-red-300">Supabase ENV fehlt. Prüfe `.env.local`.</p>
          ) : (
            <form onSubmit={runAuthAction} className="space-y-3">
              {user ? (
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Eingeloggt</p>
                  <p className="mt-1 break-all text-sm font-bold text-slate-100">{user.email}</p>
                </div>
              ) : (
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-Mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-1 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
                    placeholder="deine@email.de"
                  />
                </label>
              )}

              {(mode === 'login' || mode === 'signup') && !user && (
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Passwort</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="mt-1 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
                    placeholder="mind. 6 Zeichen"
                  />
                </label>
              )}

              {(mode === 'password' || user) && (
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neues Passwort</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required={mode === 'password'}
                    minLength={6}
                    className="mt-1 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
                    placeholder="neues Passwort"
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="min-h-[48px] w-full rounded-lg bg-emerald-400 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-950 disabled:opacity-60"
              >
                {loading
                  ? 'Bitte warten...'
                  : user || mode === 'password'
                    ? 'Passwort ändern'
                    : mode === 'signup'
                      ? 'Account erstellen'
                      : mode === 'reset'
                        ? 'Reset-Link senden'
                        : 'Einloggen'}
              </button>

              {message && (
                <p className={`text-xs font-semibold ${message.includes('fehl') || message.includes('Invalid') ? 'text-red-300' : 'text-slate-300'}`}>
                  {message}
                </p>
              )}
            </form>
          )}

          {isSupabaseConfigured && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {!user && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signup' ? 'login' : 'signup');
                      setMessage('');
                    }}
                    className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-100"
                  >
                    {mode === 'signup' ? 'Login' : 'Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'reset' ? 'login' : 'reset');
                      setMessage('');
                    }}
                    className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-100"
                  >
                    {mode === 'reset' ? 'Login' : 'Passwort'}
                  </button>
                </>
              )}
              {user && (
                <button
                  type="button"
                  onClick={signOut}
                  className="col-span-2 min-h-[40px] rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-red-200"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthMenu;
