import React, { useState } from 'react';
import { Anchor, ArrowRight, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro de autenticação');
      }

      const user = await res.json();
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef4f8] px-4 py-8 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(0,99,178,0.14),transparent_30%),radial-gradient(circle_at_95%_92%,rgba(223,45,45,0.12),transparent_28%)]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(#123251_1px,transparent_1px),linear-gradient(90deg,#123251_1px,transparent_1px)] [background-size:36px_36px]" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,38,63,0.18)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden bg-[#0a1c33] px-7 py-9 text-white sm:px-12 sm:py-12 lg:min-h-[590px] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-blue-300/15" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-[linear-gradient(160deg,transparent_5%,rgba(25,116,189,0.27)_6%,transparent_7%,transparent_28%,rgba(25,116,189,0.18)_29%,transparent_30%)] bg-[length:100%_42px] opacity-70" />

          <div className="relative">
            <div className="inline-flex rounded-2xl bg-white px-5 py-3 shadow-lg shadow-black/20">
              <img src="/logo.svg" alt="Nautilus Engenharia Naval" className="h-14 w-auto sm:h-16" />
            </div>
            <div className="mt-10 max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-300">Portal operacional</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Gestão naval, com cada etapa sob controle.</h1>
              <p className="mt-5 text-base leading-relaxed text-slate-300">Acompanhe propostas, vistorias, documentos e entregas em um único ambiente seguro.</p>
            </div>
          </div>

          <div className="relative mt-10 flex items-center gap-3 text-sm text-slate-300 lg:mt-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10"><Anchor className="h-5 w-5 text-blue-300" /></span>
            <span>Engenharia naval com rastreabilidade.</span>
          </div>
        </div>

        <div className="flex items-center px-7 py-9 sm:px-12 sm:py-12">
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><ShieldCheck className="h-4 w-4 text-blue-600" /> Acesso protegido</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Bem-vindo de volta</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">Entre com suas credenciais para acessar a plataforma Nautilus.</p>
            </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Entrando...' : <>Entrar no sistema <ArrowRight className="h-5 w-5" /></>}
          </button>
            <p className="text-center text-xs leading-relaxed text-slate-400">Acesso exclusivo para usuários autorizados da Nautilus Engenharia Naval.</p>
          </form>
        </div>
      </section>
    </main>
  );
};
