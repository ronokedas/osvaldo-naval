#!/usr/bin/env bash
# ==============================================================================
# Script de Atualização Segura do Nautilus na VPS (Produção)
#
# O que este script faz:
# 1. Cria um backup automático com data/hora do banco de dados e uploads atuais.
# 2. Atualiza o código-fonte a partir do GitHub (git pull origin main).
# 3. Reconstrói a imagem da aplicação (docker compose build app).
# 4. Reinicia a aplicação (docker compose up -d app), preservando todos os dados.
# 5. Valida a integridade do sistema (healthcheck 200 OK).
# ==============================================================================

set -e

# Cores para exibição
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
AZUL='\033[0;34m'
VERMELHO='\033[0;31m'
SEM_COR='\033[0m'

echo -e "${AZUL}======================================================${SEM_COR}"
echo -e "${AZUL}    NAUTILUS - ATUALIZAÇÃO SEGURA EM PRODUÇÃO        ${SEM_COR}"
echo -e "${AZUL}======================================================${SEM_COR}"

# Garante que o script roda na pasta onde ele está localizado
PROJ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJ_DIR"

# Verificar se o docker está rodando
if ! command -v docker &> /dev/null; then
    echo -e "${VERMELHO}[ERRO] O comando docker não foi encontrado neste servidor.${SEM_COR}"
    exit 1
fi

DATA_HORA=$(date +"%Y%m%d_%H%M%S")
PASTA_BACKUP="backups/automaticos"
mkdir -p "$PASTA_BACKUP"

# ------------------------------------------------------------------------------
# 1. BACKUP AUTOMÁTICO DE SEGURANÇA (Antes de qualquer modificação)
# ------------------------------------------------------------------------------
echo -e "\n${AMARELO}[1/5] Gerando backup preventivo do banco de dados...${SEM_COR}"

ARQUIVO_DB="$PASTA_BACKUP/backup_db_${DATA_HORA}.sql.gz"

if docker compose ps postgres | grep -q "Up"; then
    docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$ARQUIVO_DB"
    
    # Validar se o arquivo de backup foi criado e não está vazio
    if [ -s "$ARQUIVO_DB" ]; then
        TAMANHO_DB=$(du -h "$ARQUIVO_DB" | cut -f1)
        echo -e "${VERDE}  ✓ Banco de dados salvo com sucesso ($TAMANHO_DB):${SEM_COR}"
        echo -e "    -> $ARQUIVO_DB"
    else
        echo -e "${VERMELHO}[ERRO] O arquivo de backup do banco foi gerado vazio. Abortando atualização por segurança!${SEM_COR}"
        rm -f "$ARQUIVO_DB"
        exit 1
    fi
else
    echo -e "${VERMELHO}[AVISO] O container do PostgreSQL não está rodando. Iniciando postgres primeiro...${SEM_COR}"
    docker compose up -d postgres
    sleep 5
    docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$ARQUIVO_DB"
fi

# Backup dos uploads se a pasta existir e não estiver vazia
if [ -d "uploads" ] && [ "$(ls -A uploads 2>/dev/null)" ]; then
    echo -e "${AMARELO}[2/5] Gerando backup dos arquivos de upload...${SEM_COR}"
    ARQUIVO_UPLOADS="$PASTA_BACKUP/backup_uploads_${DATA_HORA}.tar.gz"
    tar -czf "$ARQUIVO_UPLOADS" uploads/
    TAMANHO_UP=$(du -h "$ARQUIVO_UPLOADS" | cut -f1)
    echo -e "${VERDE}  ✓ Uploads salvos com sucesso ($TAMANHO_UP):${SEM_COR}"
    echo -e "    -> $ARQUIVO_UPLOADS"
else
    echo -e "${AMARELO}[2/5] Pasta de uploads vazia ou não criada. Pulando cópia de uploads.${SEM_COR}"
fi

# ------------------------------------------------------------------------------
# 2. ATUALIZAR CÓDIGO DO GITHUB
# ------------------------------------------------------------------------------
echo -e "\n${AMARELO}[3/5] Puxando últimas atualizações do GitHub...${SEM_COR}"
git pull origin main

# ------------------------------------------------------------------------------
# 3. RECONSTRUIR E REINICIAR APENAS A APLICAÇÃO (Banco fica intacto)
# ------------------------------------------------------------------------------
echo -e "\n${AMARELO}[4/5] Reconstruindo imagem Docker da aplicação...${SEM_COR}"
docker compose build app

echo -e "\n${AMARELO}Reiniciando o container da aplicação (aplicando migrações automáticas)...${SEM_COR}"
docker compose up -d app

# ------------------------------------------------------------------------------
# 4. VALIDAÇÃO DE SAÚDE DO SISTEMA
# ------------------------------------------------------------------------------
echo -e "\n${AMARELO}[5/5] Aguardando inicialização e validando integridade...${SEM_COR}"

SUCESSO=false
for i in {1..30}; do
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/healthz || true)
    if [ "$STATUS_CODE" = "200" ]; then
        SUCESSO=true
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

if [ "$SUCESSO" = true ]; then
    echo -e "\n${VERDE}======================================================${SEM_COR}"
    echo -e "${VERDE}    ✓ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!            ${SEM_COR}"
    echo -e "${VERDE}======================================================${SEM_COR}"
    echo -e "Status da API: ${VERDE}HTTP 200 OK (Online)${SEM_COR}"
    echo -e "Backup de segurança preservado em: ${AMARELO}$ARQUIVO_DB${SEM_COR}"
    echo ""
    docker compose ps
else
    echo -e "\n${VERMELHO}======================================================${SEM_COR}"
    echo -e "${VERMELHO}    [ATENÇÃO] A aplicação demorou para responder.    ${SEM_COR}"
    echo -e "${VERMELHO}======================================================${SEM_COR}"
    echo -e "Verifique os logs com: ${AMARELO}docker compose logs --tail=50 app${SEM_COR}"
    echo -e "Seu backup preventivo está seguro em: ${AMARELO}$ARQUIVO_DB${SEM_COR}"
fi
