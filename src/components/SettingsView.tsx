import React, { useState, useRef } from 'react';
import { User, EmailConfig, SignatureConfig, LogoConfig, UserRole } from '../types';
import { isValidEmail } from '../utils/input-formatters';
import { NautilusLogo } from './NautilusLogo';
import {
  Settings,
  Users,
  Mail,
  FileSignature,
  Plus,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Save,
  Send,
  Upload,
  Check,
  Building,
  Key,
  ShieldCheck,
  UserCheck,
  UserX,
  FileText,
  SendHorizontal,
  PenTool,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  users: User[];
  emailConfig: EmailConfig;
  signatureConfig: SignatureConfig;
  logoConfig?: LogoConfig;
  onCreateUser: (userData: Partial<User>) => void;
  onUpdateUser: (userId: string, updatedFields: Partial<User>) => void;
  onUpdateEmailConfig: (config: EmailConfig) => void;
  onUpdateSignatureConfig: (config: SignatureConfig) => void;
  onUpdateLogoConfig?: (config: LogoConfig) => void;
  onTestEmailDispatch: (targetEmail: string) => Promise<{ success: boolean; message: string }>;
  onOpenProfile?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  users,
  emailConfig,
  signatureConfig,
  logoConfig,
  onCreateUser,
  onUpdateUser,
  onUpdateEmailConfig,
  onUpdateSignatureConfig,
  onUpdateLogoConfig,
  onTestEmailDispatch,
  onOpenProfile,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Active Tab inside Settings
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'logo' | 'email' | 'signature'>('employees');

  // Employee Modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    cargo: '',
    senha: '',
    role: 'tecnico' as UserRole,
    acessoAtivo: true,
  });

  const CARGOS_INTERNOS = [
    'Técnico',
    'Analista de Qualidade',
    'Administrador / Responsável Técnico',
    'Comercial / Financeiro',
    'Editor / Entrega',
    'Administrador'
  ];

  // Local state for Email Form
  const [localEmailConfig, setLocalEmailConfig] = useState<EmailConfig>({ ...emailConfig });
  const [testEmailAddress, setTestEmailAddress] = useState(currentUser.email || '');
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailSavedToast, setEmailSavedToast] = useState(false);

  // Local state for Signature Form
  const [localSigConfig, setLocalSigConfig] = useState<SignatureConfig>({ ...signatureConfig });
  const [sigSavedToast, setSigSavedToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Local state for Logo Form
  const [localLogoConfig, setLocalLogoConfig] = useState<LogoConfig>({
    imagemUrl: logoConfig?.imagemUrl || '/logo.svg',
    nomeEmpresa: logoConfig?.nomeEmpresa || 'NAUTILUS',
    subtitulo: logoConfig?.subtitulo || 'ENGENHARIA NAVAL',
    ativo: logoConfig?.ativo !== false,
  });
  const [logoSavedToast, setLogoSavedToast] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle User Create submit
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nome.trim() || !newUser.email.trim()) return;
    if (!editingUserId && newUser.senha.length < 6) return;
    
    if (!isValidEmail(newUser.email)) {
      alert('Informe um e-mail válido, como nome@empresa.com.');
      return;
    }

    try {
      if (editingUserId) {
        const updateData: Partial<User> = {
          nome: newUser.nome,
          email: newUser.email,
          cargo: newUser.cargo,
          role: newUser.role,
          acessoAtivo: newUser.acessoAtivo,
        };
        if (newUser.senha && newUser.senha.trim().length >= 6) {
          updateData.senha = newUser.senha;
        }
        await onUpdateUser(editingUserId, updateData);
      } else {
        await onCreateUser({
          nome: newUser.nome,
          email: newUser.email,
          cargo: newUser.cargo || (newUser.role === 'admin' ? 'Administrador' : newUser.role === 'financeiro' ? 'Financeiro' : 'Técnico Naval'),
          role: newUser.role,
          ativo: true,
          acessoAtivo: newUser.acessoAtivo,
          tarefasAtivas: 0,
          senha: newUser.senha,
        });
      }

      setNewUser({ nome: '', email: '', cargo: '', senha: '', role: 'tecnico', acessoAtivo: true });
      setShowAddUserModal(false);
      setEditingUserId(null);
    } catch (error: any) {
      alert(error?.message || 'Não foi possível salvar o usuário.');
    }
  };

  const openEditUserModal = (user: User) => {
    setEditingUserId(user.id);
    setNewUser({
      nome: user.nome,
      email: user.email,
      cargo: user.cargo || '',
      senha: '',
      role: user.role,
      acessoAtivo: user.acessoAtivo !== false,
    });
    setShowAddUserModal(true);
  };

  const openAddUserModal = () => {
    setEditingUserId(null);
    setNewUser({ nome: '', email: '', cargo: '', senha: '', role: 'tecnico', acessoAtivo: true });
    setShowAddUserModal(true);
  };

  // Handle Save Email Config
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(localEmailConfig.emailRemetente)) {
      alert('Informe um e-mail remetente válido.');
      return;
    }
    onUpdateEmailConfig(localEmailConfig);
    setEmailSavedToast(true);
    setTimeout(() => setEmailSavedToast(false), 3000);
  };

  // Handle Test Email
  const handleTestEmail = async () => {
    if (!isValidEmail(testEmailAddress)) {
      setTestResult({ success: false, message: 'Informe um e-mail de teste válido.' });
      return;
    }
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await onTestEmailDispatch(testEmailAddress);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Falha ao conectar com servidor SMTP' });
    } finally {
      setTestingEmail(false);
    }
  };

  // Handle Save Signature
  const handleSaveSignature = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSignatureConfig(localSigConfig);
    setSigSavedToast(true);
    setTimeout(() => setSigSavedToast(false), 3000);
  };

  // Handle Signature Upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLocalSigConfig((prev) => ({ ...prev, imagemUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Logo
  const handleSaveLogo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateLogoConfig) {
      onUpdateLogoConfig(localLogoConfig);
    }
    setLogoSavedToast(true);
    setTimeout(() => setLogoSavedToast(false), 3000);
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLocalLogoConfig((prev) => ({ ...prev, imagemUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Reset Logo
  const handleResetLogo = () => {
    const defaultVal: LogoConfig = {
      imagemUrl: '/logo.svg',
      nomeEmpresa: 'NAUTILUS',
      subtitulo: 'ENGENHARIA NAVAL',
      ativo: true,
    };
    setLocalLogoConfig(defaultVal);
    if (onUpdateLogoConfig) {
      onUpdateLogoConfig(defaultVal);
    }
    setLogoSavedToast(true);
    setTimeout(() => setLogoSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0B192C]">Módulo de Configurações do Sistema</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gerencie funcionários e acessos, logomarca do sistema, gateway de notificações por e-mail e chancela de assinatura digital.
          </p>
        </div>

        {/* User Profile Quick Access Button */}
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-3 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] hover:from-slate-900 hover:to-slate-800 text-white p-2.5 pr-4 rounded-2xl shadow-sm border border-slate-700 transition cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600/40 border border-blue-400/50 flex items-center justify-center font-bold text-sm text-white overflow-hidden group-hover:scale-105 transition">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                currentUser.nome.charAt(0)
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition">Meu Perfil: {currentUser.nome}</p>
              <p className="text-[10px] text-slate-300">Alterar foto, e-mail e senha</p>
            </div>
          </button>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSubTab === 'employees'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Funcionários & Acessos</span>
          <span className="ml-1 bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('logo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSubTab === 'logo'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          <span>Logomarca do Sistema & Documentos</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        <button
          onClick={() => setActiveSubTab('email')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSubTab === 'email'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Mail className="w-4 h-4 text-amber-400" />
          <span>Configuração de E-mails (SMTP)</span>
          <span
            className={`w-2 h-2 rounded-full ${
              localEmailConfig.ativo ? 'bg-emerald-400' : 'bg-slate-400'
            }`}
          />
        </button>

        <button
          onClick={() => setActiveSubTab('signature')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSubTab === 'signature'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSignature className="w-4 h-4 text-emerald-400" />
          <span>Assinatura Digital & PDF</span>
          <span
            className={`w-2 h-2 rounded-full ${
              localSigConfig.ativo ? 'bg-emerald-400' : 'bg-slate-400'
            }`}
          />
        </button>
      </div>

      {/* TAB 1: GESTÃO DE FUNCIONÁRIOS */}
      {activeSubTab === 'employees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0B192C] flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Quadro de Funcionários e Níveis de Permissão
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controle quem possui credenciais ativas para entrar no sistema e defina o perfil de atuação.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={openAddUserModal}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Novo Funcionário
                </button>
              )}
            </div>

            {/* Employee Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3">Funcionário</th>
                    <th className="p-3">E-mail de Login</th>
                    <th className="p-3">Cargo Interno</th>
                    <th className="p-3">Perfil do Sistema</th>
                    <th className="p-3 text-center">Status de Acesso</th>
                    <th className="p-3 text-right">Ação / Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {users.map((u) => {
                    const isUserActive = u.acessoAtivo !== false;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#0B192C] text-white flex items-center justify-center font-bold text-xs">
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold">{u.nome}</p>
                            {u.id === currentUser.id && (
                              <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                                Seu usuário atual
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-slate-600 font-mono">{u.email}</td>

                        <td className="p-3 text-slate-700 font-medium">{u.cargo}</td>

                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : u.role === 'financeiro'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {u.role === 'admin' ? 'Administrador' : u.role === 'financeiro' ? 'Financeiro' : 'Técnico'}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          {isUserActive ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-md border border-emerald-200">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Acesso Permitido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-bold text-[10px] px-2.5 py-1 rounded-md border border-rose-200">
                              <UserX className="w-3.5 h-3.5 text-rose-600" />
                              Bloqueado
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          {isAdmin ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditUserModal(u)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                                Editar
                              </button>
                              <button
                                onClick={() => onUpdateUser(u.id, { acessoAtivo: !isUserActive })}
                                disabled={u.id === currentUser.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  u.id === currentUser.id
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : isUserActive
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                }`}
                              >
                                {isUserActive ? 'Bloquear Acesso' : 'Liberar Acesso'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Sem permissão</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB LOGO: CONFIGURAÇÃO DE LOGOMARCA DO SISTEMA & DOCUMENTOS */}
      {activeSubTab === 'logo' && (
        <form onSubmit={handleSaveLogo} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0B192C] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-cyan-600" />
                  Logomarca Institucional do Sistema & Documentos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  A imagem ou branding configurada aqui será atualizada automaticamente em todo o sistema (cabeçalho, propostas comerciais, recibos e relatórios de protocolo).
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetLogo}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Logo Padrão
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Controls */}
              <div className="space-y-4">
                <label className="block text-slate-800 font-bold text-xs">
                  Upload ou URL da Nova Logomarca:
                </label>

                {/* Upload Box */}
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/30 transition rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-cyan-600" />
                  <p className="text-xs font-bold text-slate-800">
                    Clique para selecionar um arquivo de imagem da logo
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Formatos suportados: SVG, PNG (fundo transparente), JPG ou WEBP
                  </p>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>

                {/* URL input fallback */}
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Caminho da Imagem ou URL (opcional)</label>
                    <input
                      type="text"
                      value={localLogoConfig.imagemUrl || ''}
                      onChange={(e) => setLocalLogoConfig({ ...localLogoConfig, imagemUrl: e.target.value })}
                      placeholder="/logo.svg ou https://site.com/minha-logo.png"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nome Principal da Empresa</label>
                    <input
                      type="text"
                      value={localLogoConfig.nomeEmpresa}
                      onChange={(e) => setLocalLogoConfig({ ...localLogoConfig, nomeEmpresa: e.target.value })}
                      placeholder="NAUTILUS"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Subtítulo / Ramo de Atuação</label>
                    <input
                      type="text"
                      value={localLogoConfig.subtitulo}
                      onChange={(e) => setLocalLogoConfig({ ...localLogoConfig, subtitulo: e.target.value })}
                      placeholder="ENGENHARIA NAVAL"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Panel */}
              <div className="space-y-4">
                <label className="block text-slate-800 font-bold text-xs">
                  Pré-visualização em Tempo Real nos Ambientes do Sistema:
                </label>

                {/* Header Preview */}
                <div className="p-4 bg-[#061224] rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    1. Aplicação no Cabeçalho Superior do Sistema (Modo Escuro)
                  </span>
                  <div className="p-3 bg-[#0B192C]/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <NautilusLogo variant="light" size="md" logoConfig={localLogoConfig} />
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded font-mono">
                      Menu Ativo
                    </span>
                  </div>
                </div>

                {/* PDF Document Preview */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-300 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    2. Aplicação em Documentos PDF (Propostas, Protocolos, Recibos)
                  </span>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <NautilusLogo variant="dark" size="lg" logoConfig={localLogoConfig} />
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                      CNPJ: 20.671.499/0001-76 | Engenharia & Vistorias Náuticas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t pt-4">
              {logoSavedToast ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Logomarca atualizada em todo o sistema com sucesso!
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Ao salvar, a nova logo será aplicada imediatamente ao sistema e relatórios PDF.
                </span>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                Salvar Nova Logomarca
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: CONFIGURAÇÃO DE E-MAILS (SMTP) */}
      {activeSubTab === 'email' && (
        <form onSubmit={handleSaveEmail} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0B192C] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-500" />
                  Servidor SMTP e Gateway de Notificações
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure a conta de e-mail institucional utilizada pelo sistema para enviar propostas, protocolos e recibos aos clientes.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Status do Gateway:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localEmailConfig.ativo}
                    onChange={(e) => setLocalEmailConfig({ ...localEmailConfig, ativo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className={`text-xs font-bold ${localEmailConfig.ativo ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {localEmailConfig.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            {/* SMTP Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Servidor SMTP (Host)</label>
                <input
                  type="text"
                  value={localEmailConfig.smtpHost}
                  onChange={(e) => setLocalEmailConfig({ ...localEmailConfig, smtpHost: e.target.value })}
                  placeholder="ex: smtp.nautilus.eng.br"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Porta SMTP</label>
                <input
                  type="number"
                  value={localEmailConfig.smtpPort}
                  onChange={(e) => setLocalEmailConfig({ ...localEmailConfig, smtpPort: Number(e.target.value) })}
                  placeholder="587 ou 465"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Usuário / Autenticação</label>
                <input
                  type="text"
                  value={localEmailConfig.usuario}
                  onChange={(e) => setLocalEmailConfig({ ...localEmailConfig, usuario: e.target.value })}
                  placeholder="notificacoes@nautilus.eng.br"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Senha de App / SMTP</label>
                <input
                  type="password"
                  value={localEmailConfig.senha || ''}
                  onChange={(e) => setLocalEmailConfig({ ...localEmailConfig, senha: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome Exibido no Remetente</label>
                <input
                  type="text"
                  value={localEmailConfig.nomeRemetente}
                  onChange={(e) => setLocalEmailConfig({ ...localEmailConfig, nomeRemetente: e.target.value })}
                  placeholder="Nautilus Projetos Navais"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">E-mail Remetente (From)</label>
                <input
                  type="email"
                  value={localEmailConfig.emailRemetente}
                  onChange={(e) => setLocalEmailConfig({ ...localEmailConfig, emailRemetente: e.target.value })}
                  placeholder="contato@nautilus.eng.br"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* TLS Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="usarTlsSsl"
                checked={localEmailConfig.usarTlsSsl}
                onChange={(e) => setLocalEmailConfig({ ...localEmailConfig, usarTlsSsl: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="usarTlsSsl" className="text-xs font-bold text-slate-700 cursor-pointer">
                Exigir conexão de segurança criptografada TLS/SSL (Recomendado)
              </label>
            </div>

            {/* Automatic Triggers Toggles */}
            <div className="border-t pt-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Gatilhos de Envio Automático aos Clientes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 bg-slate-50 border rounded-xl hover:bg-slate-100/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localEmailConfig.envioAutomaticoPropostas}
                    onChange={(e) =>
                      setLocalEmailConfig({ ...localEmailConfig, envioAutomaticoPropostas: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Enviar e-mail ao aprovar Proposta</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 border rounded-xl hover:bg-slate-100/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localEmailConfig.envioAutomaticoProtocolos}
                    onChange={(e) =>
                      setLocalEmailConfig({ ...localEmailConfig, envioAutomaticoProtocolos: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Enviar e-mail ao criar Protocolo</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 border rounded-xl hover:bg-slate-100/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localEmailConfig.envioAutomaticoRecibos}
                    onChange={(e) =>
                      setLocalEmailConfig({ ...localEmailConfig, envioAutomaticoRecibos: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Enviar e-mail ao gerar Recibo</span>
                </label>
              </div>
            </div>

            {/* Dispatch Test Section */}
            <div className="border-t pt-5 space-y-3 bg-slate-50/70 p-4 rounded-xl border">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Testar Disparo de E-mail
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Digite o e-mail de destino para o teste"
                  className="w-full sm:flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail || !localEmailConfig.ativo}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer transition ${
                    localEmailConfig.ativo
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                  {testingEmail ? 'Disparando...' : 'Enviar E-mail de Teste'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-between border-t pt-4">
              {emailSavedToast ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Configurações de SMTP salvas com sucesso!
                </span>
              ) : (
                <span className="text-xs text-slate-400">Clique para aplicar as alterações do gateway.</span>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                Salvar Parâmetros SMTP
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: ASSINATURA DIGITAL & MANUSCRITA PARA PDF */}
      {activeSubTab === 'signature' && (
        <form onSubmit={handleSaveSignature} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0B192C] flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-emerald-600" />
                  Assinatura Digital Manuscrita para Documentos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Faça upload da imagem da assinatura escrita à mão no papel para que ela apareça automaticamente nos PDFs do sistema.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Chancela de Assinatura:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSigConfig.ativo}
                    onChange={(e) => setLocalSigConfig({ ...localSigConfig, ativo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className={`text-xs font-bold ${localSigConfig.ativo ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {localSigConfig.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>

            {/* Upload Area & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Box */}
              <div className="space-y-4">
                <label className="block text-slate-800 font-bold text-xs">
                  Upload da Imagem da Assinatura (Papel / Escaneada / Digital):
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 transition rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-blue-600" />
                  <p className="text-xs font-bold text-slate-800">
                    Clique aqui ou arraste a imagem da assinatura
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Formatos suportados: PNG, JPG, JPEG ou SVG (fundo transparente ou branco recomendado)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </div>

                {/* Fields for Signer */}
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nome Completo do Signatário</label>
                    <input
                      type="text"
                      value={localSigConfig.nomeSignatario}
                      onChange={(e) => setLocalSigConfig({ ...localSigConfig, nomeSignatario: e.target.value })}
                      placeholder="Eng. Osvaldo M. Saldanha"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Cargo / Função Técnica</label>
                    <input
                      type="text"
                      value={localSigConfig.cargoSignatario}
                      onChange={(e) => setLocalSigConfig({ ...localSigConfig, cargoSignatario: e.target.value })}
                      placeholder="Engenheiro Naval Responsável Técnico"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nº Registro Profissional (CREA / DPC)</label>
                    <input
                      type="text"
                      value={localSigConfig.creaOrRegistro || ''}
                      onChange={(e) => setLocalSigConfig({ ...localSigConfig, creaOrRegistro: e.target.value })}
                      placeholder="CREA/PA 15.892-D • DPC/AM 041"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Document Toggles & Live Stamp Preview */}
              <div className="space-y-4">
                <label className="block text-slate-800 font-bold text-xs">
                  Aplicar Assinatura nos Seguintes Documentos do Sistema:
                </label>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSigConfig.aplicarPropostas}
                      onChange={(e) => setLocalSigConfig({ ...localSigConfig, aplicarPropostas: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-slate-900">1. Propostas Comerciais (PDF)</p>
                      <p className="text-[11px] text-slate-500">Imprime a assinatura no rodapé do aceite formal da proposta</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSigConfig.aplicarProtocolos}
                      onChange={(e) => setLocalSigConfig({ ...localSigConfig, aplicarProtocolos: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-slate-900">2. Termos de Protocolo & Entregas (PDF)</p>
                      <p className="text-[11px] text-slate-500">Chancela o envio oficial na Capitania, Certificadora ou Cliente</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSigConfig.aplicarRecibos}
                      onChange={(e) => setLocalSigConfig({ ...localSigConfig, aplicarRecibos: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-slate-900">3. Recibos Oficiais de Pagamento (PDF)</p>
                      <p className="text-[11px] text-slate-500">Insere o visto financeiro e assinatura do emissor do comprovante</p>
                    </div>
                  </label>
                </div>

                {/* Signature Preview Card */}
                <div className="mt-4 p-5 bg-white border-2 border-slate-300 rounded-2xl shadow-inner text-center space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                    Pré-visualização do Carimbo e Assinatura no PDF
                  </span>

                  <div className="h-24 flex items-center justify-center border-b border-slate-200 pb-2">
                    {localSigConfig.imagemUrl ? (
                      <img
                        src={localSigConfig.imagemUrl}
                        alt="Assinatura Manuscrita"
                        className="max-h-20 max-w-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 text-xs">
                        <PenTool className="w-6 h-6 mb-1 opacity-50" />
                        <span className="italic">Nenhuma imagem carregada ainda</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 text-xs">{localSigConfig.nomeSignatario}</p>
                    <p className="text-[11px] text-slate-600 font-medium">{localSigConfig.cargoSignatario}</p>
                    {localSigConfig.creaOrRegistro && (
                      <p className="text-[10px] text-slate-500 font-mono">{localSigConfig.creaOrRegistro}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t pt-4">
              {sigSavedToast ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Configurações de Assinatura salvas!
                </span>
              ) : (
                <span className="text-xs text-slate-400">Salva e aplica imediatamente nos relatórios.</span>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                Salvar Assinatura Digital
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MODAL: CADASTRAR NOVO FUNCIONÁRIO */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {editingUserId ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                  placeholder="ex: Engº Lucas Monteiro"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">E-mail Institucional (Login)</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="lucas@nautilus.eng.br"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Cargo Interno</label>
                <select
                  value={CARGOS_INTERNOS.includes(newUser.cargo) ? newUser.cargo : (newUser.cargo ? 'Outro' : '')}
                  onChange={(e) => setNewUser({ ...newUser, cargo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 mb-2"
                >
                  <option value="" disabled>Selecione um Cargo</option>
                  {CARGOS_INTERNOS.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Outro">Outro (digitar)</option>
                </select>
                {(!CARGOS_INTERNOS.includes(newUser.cargo) && newUser.cargo !== '') && (
                  <input
                    type="text"
                    value={newUser.cargo}
                    onChange={(e) => setNewUser({ ...newUser, cargo: e.target.value })}
                    placeholder="Digite o cargo customizado"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {editingUserId ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha inicial'}
                </label>
                <input
                  type="password"
                  value={newUser.senha}
                  onChange={(e) => setNewUser({ ...newUser, senha: e.target.value })}
                  placeholder="Mínimo de 6 caracteres"
                  minLength={6}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                  required={!editingUserId}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Perfil do Sistema</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                  >
                    <option value="tecnico">Técnico Naval</option>
                    <option value="financeiro">Financeiro / Adm</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Permitir Acesso?</label>
                  <select
                    value={newUser.acessoAtivo ? 'sim' : 'nao'}
                    onChange={(e) => setNewUser({ ...newUser, acessoAtivo: e.target.value === 'sim' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                  >
                    <option value="sim">Sim (Ativo)</option>
                    <option value="nao">Não (Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  {editingUserId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
