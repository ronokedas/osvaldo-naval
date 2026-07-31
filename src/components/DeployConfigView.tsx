import React, { useState } from 'react';
import { Server, Database, Shield, Terminal, Copy, Check, HardDrive } from 'lucide-react';

export const DeployConfigView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const dockerComposeYaml = `version: '3.8'

services:
  # Database PostgreSQL
  postgres:
    image: postgres:16-alpine
    container_name: nautilus_db
    restart: always
    environment:
      POSTGRES_DB: nautilus_db
      POSTGRES_USER: nautilus_user
      POSTGRES_PASSWORD: NautilusSecurePass2026!
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Backend Node.js / Express
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nautilus_backend
    restart: always
    environment:
      PORT: 3000
      DATABASE_URL: postgres://nautilus_user:NautilusSecurePass2026!@postgres:5432/nautilus_db
      JWT_SECRET: nautilus_super_secret_jwt_key_2026
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    depends_on:
      - postgres

volumes:
  pgdata:
    driver: local`;

  const backupCronScript = `#!/bin/bash
# Script de Backup Automático do Banco PostgreSQL e Anexos - Nautilus
BACKUP_DIR="/var/backups/nautilus"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco via pg_dump
docker exec -t nautilus_db pg_dump -U nautilus_user nautilus_db > $BACKUP_DIR/nautilus_db_$DATE.sql

# Backup compactado da pasta de anexos/documentos
tar -czf $BACKUP_DIR/nautilus_uploads_$DATE.tar.gz ./uploads

# Manter apenas os últimos 30 dias de backup
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup Nautilus concluído em $DATE"`;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Instruções de Deploy no VPS & Docker</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Guia completo para hospedagem em VPS Linux próprio com Docker Compose, SSL HTTPS e Backup.
        </p>
      </div>

      {/* Grid Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Docker Compose Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              docker-compose.yml
            </h3>
            <button
              onClick={() => copyToClipboard(dockerComposeYaml, 'docker')}
              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedSection === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSection === 'docker' ? 'Copiado!' : 'Copiar YAML'}
            </button>
          </div>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
            {dockerComposeYaml}
          </pre>
        </div>

        {/* Rotina de Backup Script */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Script de Backup Agendado (cron)
            </h3>
            <button
              onClick={() => copyToClipboard(backupCronScript, 'cron')}
              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedSection === 'cron' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSection === 'cron' ? 'Copiado!' : 'Copiar Shell Script'}
            </button>
          </div>

          <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
            {backupCronScript}
          </pre>
        </div>
      </div>

      {/* Step by Step VPS Commands */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-base border-b pb-3 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-600" />
          Passo a Passo para Subir no VPS Linux
        </h3>

        <div className="space-y-4 text-slate-700 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">1. Instalar Docker e Docker Compose no VPS:</p>
            <p className="font-mono text-slate-600 bg-white p-2 rounded border">
              curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">2. Clonar o projeto e subir os containers:</p>
            <p className="font-mono text-slate-600 bg-white p-2 rounded border">
              docker-compose up -d --build
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">3. Configurar HTTPS Grátis via Nginx & Certbot:</p>
            <p className="font-mono text-slate-600 bg-white p-2 rounded border">
              sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d sistema.nautilusengenharianaval.com.br
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">4. Agendar Backup Diário às 03:00 da manhã no Crontab:</p>
            <p className="font-mono text-slate-600 bg-white p-2 rounded border">
              0 3 * * * /bin/bash /root/backup_nautilus.sh &gt;&gt; /var/log/nautilus_backup.log 2&gt;&amp;1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
