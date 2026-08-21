# Migração completa do Nautilus para outro VPS

Use um repositório GitHub privado. O backup contém dados do sistema. Faça o backup no computador local e envie código, banco e uploads ao GitHub antes de preparar o novo VPS.

## 1. Gerar e enviar o backup pelo Windows

Na pasta local do projeto, em PowerShell:

```powershell
New-Item -ItemType Directory -Force backups/deploy | Out-Null
cmd /c "docker compose exec -T postgres pg_dump -U nautilus_user -d nautilus_db > backups\deploy\database.sql"
tar -czf backups/deploy/uploads.tar.gz uploads
git add .
git add -f backups/deploy/database.sql backups/deploy/uploads.tar.gz
git commit -m "Backup completo para migracao"
git push origin main
```

O uso de `cmd /c` evita que o PowerShell grave o SQL em UTF-16. Não envie o arquivo `.env` ao GitHub.

## 2. Preparar o novo VPS

Abra o console SSH do Google Cloud e execute como usuário com `sudo`:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx ufw
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
cd ~
git clone https://github.com/ronokedas/osvaldo-naval.git osvaldo-naval
cd ~/osvaldo-naval
cp .env.docker.example .env
sudo sed -i 's|^APP_PORT=.*|APP_PORT=3000|' .env
sudo sed -i 's|^COOKIE_SECURE=.*|COOKIE_SECURE=true|' .env
sudo sed -i 's|^TRUST_PROXY=.*|TRUST_PROXY=true|' .env
sudo sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 32)|" .env
sudo sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$(openssl rand -hex 32)|" .env
sudo chmod 600 .env
sudo mkdir -p uploads
sudo docker compose up -d postgres
```

## 3. Restaurar banco e arquivos do GitHub

Ainda no console SSH:

```bash
cd ~/osvaldo-naval
sudo docker compose stop app 2>/dev/null || true
sudo docker exec osvaldo-naval-postgres-1 psql -U nautilus_user -d nautilus_db -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
sudo docker exec -i osvaldo-naval-postgres-1 psql -U nautilus_user -d nautilus_db < backups/deploy/database.sql
tar -xzf backups/deploy/uploads.tar.gz
sudo docker compose up -d --build
sudo docker compose ps
curl -fsS http://127.0.0.1:3000/healthz && echo ONLINE
```

Se aparecer erro no SQL, pare e não execute o `DROP SCHEMA` novamente. Verifique se o backup foi gerado pelo comando `cmd /c` da etapa 1.

## 4. Configurar o Nginx e o domínio

Troque `SEU_DOMINIO` pelo domínio real:

```bash
sudo tee /etc/nginx/sites-available/nautilus > /dev/null <<'NGINX'
server {
    listen 80;
    server_name SEU_DOMINIO;
    client_max_body_size 25M;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/nautilus /etc/nginx/sites-enabled/nautilus
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d SEU_DOMINIO --redirect
```

Depois, aponte o DNS para o IP novo e teste o domínio. Não use `docker compose down -v`, pois isso apaga o banco.
