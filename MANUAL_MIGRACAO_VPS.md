# Instalação do Nautilus no VPS

```bash
ssh root@IP_DO_VPS
apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw nginx
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
mkdir -p /var/www
cd /var/www
git clone https://github.com/ronokedas/osvaldo-naval.git nautilus
cd /var/www/nautilus
cp .env.docker.example .env
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 32)
SESSION_SECRET=$(openssl rand -hex 32)
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
sed -i 's|^APP_PORT=.*|APP_PORT=3000|' .env
sed -i 's|^COOKIE_SECURE=.*|COOKIE_SECURE=true|' .env
sed -i 's|^TRUST_PROXY=.*|TRUST_PROXY=true|' .env
chmod 600 .env
mkdir -p uploads
docker compose up -d --build
docker compose ps
docker compose logs app --tail=100
curl -fsS http://127.0.0.1:3000/healthz
```

```bash
cat > /etc/nginx/sites-available/nautilus <<'NGINX'
server {
    listen 80;
    server_name SEU_DOMINIO_OU_IP;

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
ln -s /etc/nginx/sites-available/nautilus /etc/nginx/sites-enabled/nautilus
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d SEU_DOMINIO --redirect
systemctl enable --now certbot.timer
```

## Atualizar uma instalação existente

```bash
cd /var/www/nautilus
git pull --ff-only origin main
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:3000/healthz
```

## Backup e restauração

```bash
cd /var/www/nautilus
mkdir -p backups/$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=$(find backups -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1)
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$BACKUP_DIR/database.sql"
tar -czf "$BACKUP_DIR/uploads.tar.gz" uploads
```

```bash
cd /var/www/nautilus
docker compose down
docker compose up -d
docker compose ps
```
