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

Nunca use `docker compose down -v`: apaga o banco. O backup é substituído a cada commit. Restaure só quando quiser substituir os dados online.





====================================
antigo:
=====================================



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




Nunca use `docker compose down -v`: apaga o banco. O backup é substituído a cada novo commit.



ver se tá ok:


sudo docker compose ps
curl -fsS http://127.0.0.1:3000/healthz && echo ONLINE


erro 503 use:

cd ~/osvaldo-naval
git pull --ff-only origin main
sudo docker compose stop app
sudo docker exec osvaldo-naval-postgres-1 psql -U nautilus_user -d nautilus_db -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
sudo docker exec -i osvaldo-naval-postgres-1 psql -U nautilus_user -d nautilus_db < backups/deploy/database.sql
tar -xzf backups/deploy/uploads.tar.gz
sudo docker compose start app


---

# 🛡️ NOVO: ATUALIZAÇÃO SEGURA EM PRODUÇÃO (USO NO DIA A DIA)

> ⚠️ **IMPORTANTE:** Use este método quando o sistema já estiver em operação real no VPS.  
> Ele **NÃO apaga** nem zera os dados cadastrados pelos clientes e equipe no VPS!  
> Antes de qualquer alteração, ele cria um **backup automático com data e hora** para garantir 100% de segurança.

### 1. Comando Único Recomendado (Script Automático)

No console SSH do VPS, basta rodar em uma única linha:

```bash
cd ~/osvaldo-naval && git pull origin main && chmod +x atualizar_vps.sh && ./atualizar_vps.sh
```

---

### 2. O que o script `atualizar_vps.sh` faz automaticamente:
1. **Backup Preventivo:** Salva o banco de dados atual do VPS em `backups/automaticos/backup_db_AAAAMMDD_HHMMSS.sql.gz` e os uploads em `backups/automaticos/backup_uploads_AAAAMMDD_HHMMSS.tar.gz`.
2. **Atualização do Código:** Puxa os arquivos mais recentes do GitHub (`git pull origin main`).
3. **Reconstrução da Aplicação:** Reconstrói a imagem da aplicação (`docker compose build app`).
4. **Preservação Total dos Dados:** Reinicia o app (`docker compose up -d app`) mantendo o banco de dados PostgreSQL intacto.
5. **Migrações Automáticas:** O container aplica migrações de novas tabelas e colunas necessárias (`npm run db:migrate`) sem apagar dados preexistentes.
6. **Teste de Saúde:** Testa a resposta da API (`/healthz` 200 OK) e exibe o status final dos containers.

---

### 3. Como Restaurar um Backup Automático (Caso Necessário)

Se algum dia precisar reverter o banco para um backup anterior gerado pelo script:

```bash
cd ~/osvaldo-naval

# 1. Listar os backups automáticos disponíveis
ls -lh backups/automaticos/

# 2. Restaurar um backup específico (substitua pelo nome real do arquivo gerado):
gunzip -c backups/automaticos/backup_db_YYYYMMDD_HHMMSS.sql.gz | sudo docker exec -i osvaldo-naval-postgres-1 psql -U nautilus_user -d nautilus_db
```

---

### 4. Diferença Prática entre os Métodos:
* **`atualizar_vps.sh` (Padrão para Produção):** Atualiza telas, regras e melhorias do sistema, preservando todo o banco de produção e criando backup automático.
* **Passos 1 a 3 (Carga Forçada Local → VPS):** Usado apenas em instalação inicial ou quando você desejar explicitamente substituir toda a base da VPS pela cópia da sua máquina local.
