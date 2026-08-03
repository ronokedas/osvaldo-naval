# 🚀 Manual Rápido de Migração e Instalação (Novo VPS)

Este guia prático foi criado para facilitar a migração completa do sistema **Nautilus** para um novo VPS Linux (Ubuntu), **mantendo todos os dados, documentos gerados, uploads e o banco de dados** intactos. 

Como as pastas `data/` (banco de dados) e `uploads/` (arquivos) estão versionadas no GitHub, basta clonar o repositório no novo servidor e rodar os comandos abaixo.

---

## 🛠️ PASSO 1: Preparar o Servidor Novo

Acesse o seu novo servidor VPS via SSH e execute os comandos abaixo para instalar o Node.js, Git e o gerenciador de processos PM2.

```bash
# 1. Atualizar a lista de pacotes do servidor
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js (v20) e Git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# 3. Instalar o PM2 (para manter o sistema rodando 24/7)
sudo npm install -g pm2
```

---

## 📥 PASSO 2: Clonar o Sistema e Restaurar os Dados

Baixe o projeto do GitHub. Todos os arquivos de dados e uploads virão junto com ele.

```bash
# 1. Criar um diretório para o sistema (substitua pelo caminho que preferir)
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

# 2. Clonar o repositório (Substitua a URL abaixo pela URL do seu GitHub)
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git nautilus
cd nautilus
```

---

## ⚙️ PASSO 3: Configurar Variáveis e Permissões

O único arquivo que NÃO vai para o GitHub é o `.env`. Vamos criá-lo e garantir que o servidor tenha permissão para ler/gravar os arquivos de banco de dados e uploads.

```bash
# 1. Criar o .env a partir do arquivo de exemplo
cp .env.example .env

# (Opcional) Edite o .env se precisar alterar alguma porta ou chave
# nano .env

# 2. GARANTIA DE PERMISSÕES (CRÍTICO PARA NÃO DAR ERRO)
# Garante que as pastas de banco de dados e uploads existam e possam ser editadas pelo sistema
mkdir -p data uploads
sudo chown -R $USER:$USER data uploads
chmod -R 775 data uploads
chmod 664 data/nautilus_db.json
```

---

## 🏗️ PASSO 4: Instalar e Construir (Build)

Instale as dependências e faça o build de produção do sistema.

```bash
# 1. Instalar as bibliotecas (Node_modules)
npm install

# 2. Gerar a versão otimizada de produção
npm run build
```

---

## 🚀 PASSO 5: Iniciar o Sistema (Produção)

Vamos iniciar a aplicação para que fique rodando em segundo plano.

```bash
# 1. Iniciar o servidor com o PM2
pm2 start dist/server.cjs --name "nautilus"

# 2. Salvar a lista de processos para reiniciar automaticamente caso o VPS reinicie
pm2 save
pm2 startup
# ⚠️ IMPORTANTE: O comando `pm2 startup` vai gerar um novo comando na tela. 
# Copie esse comando gerado, cole no terminal e aperte Enter.
```

---

## 🌐 BÔNUS: Configurar Nginx (Para acessar sem porta 3000 e usar Domínio)

Se você quiser acessar o sistema direto pelo IP ou Domínio (sem ter que digitar `:3000` no final):

```bash
# 1. Instalar Nginx
sudo apt install -y nginx

# 2. Criar o arquivo de configuração
sudo nano /etc/nginx/sites-available/nautilus
```

Dentro do editor, cole o código abaixo (se tiver um domínio, troque `_` pelo seu domínio):
```nginx
server {
    listen 80;
    server_name _; # Pode colocar seu domínio aqui (ex: nautilus.com.br)

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Salve e ative a configuração:
```bash
# Ativar o site e reiniciar o Nginx
sudo ln -s /etc/nginx/sites-available/nautilus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

✅ **Pronto! Seu sistema Nautilus está rodando no novo VPS com todos os bancos de dados e documentos perfeitamente restaurados.**
