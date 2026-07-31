import React, { useState, useRef } from 'react';
import { User } from '../types';
import { X, Upload, Camera } from 'lucide-react';

interface UserProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateProfile: (avatarUrl: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onClose,
  onUpdateProfile,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateProfile(avatarUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">Meu Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-slate-400">
                  {currentUser.nome.charAt(0)}
                </span>
              )}
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
              title="Alterar foto"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center">
            <h3 className="font-bold text-slate-800 text-lg">{currentUser.nome}</h3>
            <p className="text-sm text-slate-500">{currentUser.cargo}</p>
            <span className="mt-2 inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-600">
              {currentUser.role}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
