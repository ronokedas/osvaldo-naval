-- Materialize unambiguous legacy external submissions in the canonical protocol history.
INSERT INTO protocol_dispatches (
  protocolo_id, ciclo, tipo, data_envio, referencia_externa, canal,
  destinatario, observacao, enviado_por_id, enviado_por_nome, created_at
)
SELECT p.id, 0, 'inicial', COALESCE(es.data_envio, p.data_envio, CURRENT_DATE::text),
       COALESCE(es.protocolo, p.codigo_rastreio), COALESCE(p.canal, 'outro'),
       p.destinatario, es.observacao, es.responsavel_envio_id, p.responsavel_envio_nome,
       COALESCE(es.created_at, p.created_at)
FROM protocols p
JOIN LATERAL (
  SELECT candidate.* FROM external_submissions candidate
  WHERE candidate.os_id = p.os_id
    AND COALESCE(candidate.data_envio, '') = COALESCE(p.data_envio, '')
  ORDER BY candidate.created_at
  LIMIT 1
) es ON true
WHERE p.os_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM protocol_dispatches pd WHERE pd.protocolo_id = p.id);

INSERT INTO protocol_dispatch_documents (
  remessa_id, documento_id, versao_id, versao, titulo_documento, resultado, created_at, updated_at
)
SELECT pd.id, es.documento_id, dv.id, dv.versao, d.titulo,
       CASE WHEN EXISTS (
         SELECT 1 FROM external_responses er
         WHERE er.submissao_id = es.id AND er.tipo = 'aprovacao'
       ) THEN 'aprovado'
       WHEN EXISTS (
         SELECT 1 FROM external_responses er
         WHERE er.submissao_id = es.id AND er.tipo = 'exigencia'
       ) THEN 'exigencia'
       ELSE 'aguardando_analise' END,
       es.created_at, COALESCE(es.updated_at, es.created_at)
FROM protocols p
JOIN protocol_dispatches pd ON pd.protocolo_id = p.id AND pd.ciclo = 0
JOIN external_submissions es ON es.os_id = p.os_id
  AND COALESCE(es.data_envio, '') = COALESCE(pd.data_envio, '')
JOIN documents d ON d.id = es.documento_id
JOIN document_versions dv ON dv.documento_id = es.documento_id AND dv.versao = es.versao_enviada
WHERE NOT EXISTS (
  SELECT 1 FROM protocol_dispatch_documents pdd
  WHERE pdd.remessa_id = pd.id AND pdd.documento_id = es.documento_id
);

INSERT INTO protocol_responses (
  protocolo_id, remessa_id, tipo, data, motivo, registrado_por_nome, created_at
)
SELECT p.id, pd.id,
       CASE WHEN er.tipo = 'aprovacao' THEN 'aprovado' ELSE 'exigencia' END,
       COALESCE(er.data, CURRENT_DATE::text), er.motivo, 'Migração do histórico', er.created_at
FROM protocols p
JOIN protocol_dispatches pd ON pd.protocolo_id = p.id AND pd.ciclo = 0
JOIN external_submissions es ON es.os_id = p.os_id
  AND COALESCE(es.data_envio, '') = COALESCE(pd.data_envio, '')
JOIN external_responses er ON er.submissao_id = es.id
WHERE NOT EXISTS (
  SELECT 1 FROM protocol_responses pr
  WHERE pr.protocolo_id = p.id AND pr.remessa_id = pd.id AND pr.created_at = er.created_at
);

INSERT INTO protocol_response_documents (resposta_id, documento_id, resultado, observacao, created_at)
SELECT pr.id, es.documento_id, pr.tipo, pr.motivo, pr.created_at
FROM protocol_responses pr
JOIN protocol_dispatches pd ON pd.id = pr.remessa_id
JOIN protocols p ON p.id = pd.protocolo_id
JOIN external_submissions es ON es.os_id = p.os_id
  AND COALESCE(es.data_envio, '') = COALESCE(pd.data_envio, '')
WHERE es.documento_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM protocol_response_documents prd
    WHERE prd.resposta_id = pr.id AND prd.documento_id = es.documento_id
  );

INSERT INTO protocol_attachments (
  protocolo_id, resposta_id, tipo, arquivo_url, arquivo_nome, enviado_por_nome, created_at
)
SELECT pr.protocolo_id, pr.id, 'resposta_externa', er.anexo_url, er.anexo_nome,
       'Migração do histórico', er.created_at
FROM protocol_responses pr
JOIN protocol_dispatches pd ON pd.id = pr.remessa_id
JOIN protocols p ON p.id = pr.protocolo_id
JOIN external_submissions es ON es.os_id = p.os_id
  AND COALESCE(es.data_envio, '') = COALESCE(pd.data_envio, '')
JOIN external_responses er ON er.submissao_id = es.id AND er.created_at = pr.created_at
WHERE er.anexo_url IS NOT NULL AND er.anexo_nome IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM protocol_attachments pa WHERE pa.resposta_id = pr.id);

UPDATE documents d SET aplicavel_analise_externa = true
WHERE EXISTS (SELECT 1 FROM protocol_dispatch_documents pdd WHERE pdd.documento_id = d.id);

UPDATE protocols p SET
  status = CASE
    WHEN EXISTS (SELECT 1 FROM protocol_dispatch_documents pdd JOIN protocol_dispatches pd ON pd.id = pdd.remessa_id WHERE pd.protocolo_id = p.id AND pdd.resultado = 'exigencia') THEN 'exigencia_recebida'
    WHEN EXISTS (SELECT 1 FROM protocol_dispatch_documents pdd JOIN protocol_dispatches pd ON pd.id = pdd.remessa_id WHERE pd.protocolo_id = p.id)
      AND NOT EXISTS (SELECT 1 FROM protocol_dispatch_documents pdd JOIN protocol_dispatches pd ON pd.id = pdd.remessa_id WHERE pd.protocolo_id = p.id AND pdd.resultado NOT IN ('aprovado', 'aprovado_com_observacoes')) THEN 'aprovado'
    ELSE 'aguardando_analise' END,
  requer_conciliacao = false,
  updated_at = now()
WHERE p.os_id IS NOT NULL AND EXISTS (SELECT 1 FROM protocol_dispatches pd WHERE pd.protocolo_id = p.id);

INSERT INTO protocol_events (protocolo_id, tipo, descricao, autor_nome, created_at)
SELECT p.id, 'migracao', 'Histórico legado conciliado com a Ordem de Serviço.', 'Sistema', now()
FROM protocols p
WHERE p.os_id IS NOT NULL AND EXISTS (SELECT 1 FROM protocol_dispatches pd WHERE pd.protocolo_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM protocol_events pe WHERE pe.protocolo_id = p.id AND pe.tipo = 'migracao');

UPDATE service_orders so SET status = 'aguardando_entrega', updated_at = now()
WHERE EXISTS (SELECT 1 FROM protocols p WHERE p.os_id = so.id AND p.status = 'aprovado')
  AND NOT EXISTS (
    SELECT 1 FROM documents d
    WHERE d.os_id = so.id AND d.aplicavel_analise_externa = true AND d.status <> 'aprovado'
  );

INSERT INTO deliveries (os_id, status)
SELECT so.id, 'pendente' FROM service_orders so
WHERE so.status = 'aguardando_entrega'
  AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.os_id = so.id);
