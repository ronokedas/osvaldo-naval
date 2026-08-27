import React, { useState, useRef } from 'react';
import { ThemePreference, User } from '../types';
import { THEME_PREFERENCES, applyThemePreference } from '../theme';
import { isValidEmail } from '../utils/input-formatters';
import {
  User as UserIcon,
  Mail,
  Key,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  Save,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

interface UserProfileModalProps {
  currentUser: User;
  onSaveProfile: (updatedFields: Partial<User>) => Promise<void>;
  onClose: () => void;
  onPreviewTheme?: (theme: ThemePreference) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onSaveProfile,
  onClose,
  onPreviewTheme,
}) => {
  const [nome, setNome] = useState(currentUser.nome);
  const [email, setEmail] = useState(currentUser.email);
  const [cargo, setCargo] = useState(currentUser.cargo);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser.avatarUrl);
  const [themePreference, setThemePreference] = useState<ThemePreference>(currentUser.themePreference || 'classic');
  const initialThemePreference = currentUser.themePreference || 'classic';
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  // Handle Remove Photo
  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nome.trim()) {
      setErrorMessage('O nome não pode ficar em branco.');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Por favor, informe um e-mail válido.');
      return;
    }

    if (novaSenha && novaSenha !== confirmarSenha) {
      setErrorMessage('A confirmação de senha não confere com a nova senha.');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveProfile({
        nome: nome.trim(),
        email: email.trim(),
        cargo: cargo.trim(),
        avatarUrl,
        themePreference,
        ...(novaSenha ? { senha: novaSenha } : {}),
      });
      setIsSavedToast(true);
      setTimeout(onClose, 900);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Não foi possível salvar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    applyThemePreference(initialThemePreference);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-8">
        
        {/* Header Modal Banner */}
        <div className="bg-gradient-to-r from-[#061224] via-[#0B192C] to-[#1E3E62] text-white p-6 relative flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/30 border border-blue-400/40 rounded-2xl">
              <UserIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Meu Perfil do Sistema</h2>
              <p className="text-xs text-slate-300">Atualize seus dados pessoais, senha de acesso e foto de perfil</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Avatar Photo Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 border-4 border-white shadow-md flex items-center justify-center text-white text-3xl font-black overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nome} className="w-full h-full object-cover" />
                ) : (
                  <span>{nome ? nome.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white transition cursor-pointer"
                title="Alterar Foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h3 className="text-sm font-bold text-[#0B192C]">Foto do Perfil</h3>
              <p className="text-xs text-slate-500">
                Sua foto será exibida no cabeçalho, barra lateral, históricos e atribuições de tarefas do sistema.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/10 hover:bg-blue-900/20 text-blue-900 font-bold text-xs rounded-xl transition cursor-pointer border border-blue-200"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-700" />
                  Carregar Foto
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover Foto
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          <section className="theme-preference-section" aria-labelledby="theme-preference-title">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 id="theme-preference-title" className="text-sm font-bold text-[#0B192C]">Aparência</h3>
                <p className="text-xs text-slate-500 mt-1">Escolha o visual da sua conta. A alteração será aplicada ao sistema inteiro.</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-cyan-600 shrink-0" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_PREFERENCES.map((option) => {
                const selected = themePreference === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setThemePreference(option.id);
                      onPreviewTheme?.(option.id);
                    }}
                    className={`theme-option ${selected ? 'theme-option-selected' : ''}`}
                  >
                    <span className={`theme-option-preview theme-option-preview-${option.id}`} aria-hidden="true">
                      <span className="theme-preview-line" />
                      <span className="theme-preview-panel" />
                      <span className="theme-preview-panel theme-preview-panel-small" />
                    </span>
                    <span className="flex items-start gap-2 text-left">
                      <span className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${selected ? 'border-cyan-500' : 'border-slate-300'}`}>
                        {selected && <span className="h-2 w-2 rounded-full bg-cyan-500" />}
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-slate-800">{option.label}</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">{option.description}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Form Fields Grid */}
          <div className="space-y-4">
            
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                Nome Completo / Exibição:
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none transition"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                E-mail Corporativo / Login:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@nautilus.eng.br"
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-sm font-medium text-slate-800 focus:outline-none transition"
                required
              />
            </div>

            {/* Cargo / Função */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                Cargo / Função Técnica:
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Engenheiro Naval / Inspetor NDT"
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-sm font-medium text-slate-800 focus:outline-none transition"
              />
            </div>

            {/* Seção de Troca de Senha */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B192C] uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-600" />
                  Trocar Senha de Acesso
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                  Opicional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nova Senha */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nova Senha:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Sua nova senha"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 pr-10 text-xs font-medium text-slate-800 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirmar Senha:</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0B192C] hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              {isSavedToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Perfil Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Salvando…' : 'Salvar Alterações'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
