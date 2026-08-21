# Backup completo Local → GitHub → VPS

Use um repositório GitHub **privado**: o backup contém dados do sistema.

## 1. Gerar backup completo local
Na pasta local do projeto:
```bash
New-Item -ItemType Directory -Force backups/deploy | Out-Null
cmd /c "docker compose exec -T postgres pg_dump -U nautilus_user -d nautilus_db > backups\\deploy\\database.sql"
tar -czf backups/deploy/uploads.tar.gz uploads
```

## 2. Enviar código e backup ao GitHub
```bash
git add .
git add -f backups/deploy/database.sql backups/deploy/uploads.tar.gz
git commit -m "Backup completo e atualização"
git push origin main
```

## 3. Baixar e restaurar tudo no VPS
No console SSH do Google Cloud:
```bash
cd ~/osvaldo-naval
sudo docker compose exec -T postgres pg_dump -U nautilus_user -d nautilus_db > backup-antes.sql
git pull --ff-only origin main
sudo docker compose up -d --build
sudo docker compose stop app
sudo docker exec osvaldo-naval-postgres-1 psql -U nautilus_user -d nautilus_db -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
sudo docker exec -i osvaldo-naval-postgres-1 psql -U nautilus_user -d nautilus_db < backups/deploy/database.sql
tar -xzf backups/deploy/uploads.tar.gz
sudo docker compose start app
```




## 4. Validar o VPS
```bash
sudo docker compose ps
curl -fsS http://127.0.0.1:3000/healthz && echo ONLINE
```

Nunca use `docker compose down -v`: apaga o banco. O backup é substituído a cada novo commit. Use a restauração somente quando quiser substituir os dados online pelos dados locais.

