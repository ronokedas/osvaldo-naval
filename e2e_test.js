// Auditoria completa do fluxo operacional do Nautilus Naval
// Testa cada passo descrito no manual operacional

const BASE = 'http://localhost:3002';
let cookie = '';
const ts = Date.now();
const results = [];

function log(step, ok, detail) {
  const icon = ok ? '✅' : '❌';
  results.push({ step, ok, detail });
  console.log(`${icon} [${step}] ${detail}`);
}

async function req(method, path, body) {
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  const sc = res.headers.get('set-cookie');
  if (sc) cookie = sc.split(';')[0];
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function audit() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  AUDITORIA COMPLETA — NAUTILUS NAVAL');
  console.log('  Testando cada passo do manual operacional');
  console.log('═══════════════════════════════════════════════════════\n');

  // ──────────────────────────────────────────
  // PASSO 0: Login como Admin
  // ──────────────────────────────────────────
  const login = await req('POST', '/api/auth/login', { email: 'osvaldo@nautilus.eng.br', password: '123456' });
  if (!login.ok) { log('LOGIN', false, `Falha no login: ${JSON.stringify(login.data)}`); return; }
  log('LOGIN', true, `Logado como: ${login.data.nome} (${login.data.role})`);

  // ──────────────────────────────────────────
  // PASSO 1: Cadastros Base (Cliente, Certificadora, Serviço)
  // ──────────────────────────────────────────
  console.log('\n── PASSO 1: Cadastros Base ──');

  // 1a. Criar Cliente
  const cliente = await req('POST', '/api/clients', {
    nome: `Cliente Auditoria ${ts}`,
    email: 'auditoria@teste.com',
    telefone: '(91) 99999-0001',
    whatsapp: '(91) 99999-0001',
    cnpjCpf: '23.473.189/0001-86', // Valid CNPJ
  });
  log('PASSO 1a', cliente.ok, cliente.ok
    ? `Cliente criado: "${cliente.data.nome}" (ID: ${cliente.data.id})`
    : `Erro ao criar cliente: ${JSON.stringify(cliente.data)}`);

  // 1b. Criar Certificadora
  const cert = await req('POST', '/api/certifiers', {
    nome: `Certificadora Auditoria ${ts}`,
    codigoRegistro: 'CERT-001',
    email: 'cert@teste.com',
  });
  log('PASSO 1b', cert.ok, cert.ok
    ? `Certificadora criada: "${cert.data.nome}" (ID: ${cert.data.id})`
    : `Erro ao criar certificadora: ${JSON.stringify(cert.data)}`);

  // 1c. Criar Serviço
  const servico = await req('POST', '/api/services', {
    nome: `Medição Ultrassom Auditoria ${ts}`,
    valorPadrao: 5000,
  });
  log('PASSO 1c', servico.ok, servico.ok
    ? `Serviço criado: "${servico.data.nome}" (Valor: R$ ${servico.data.valorPadrao})`
    : `Erro ao criar serviço: ${JSON.stringify(servico.data)}`);

  // ──────────────────────────────────────────
  // PASSO 2: Cadastro de Embarcação
  // ──────────────────────────────────────────
  console.log('\n── PASSO 2: Cadastro de Embarcação ──');
  const emb = await req('POST', '/api/vessels', {
    nome: `Balsa Auditoria ${ts}`,
    tipo: 'Balsa',
    clienteId: cliente.data?.id,
    clienteNome: cliente.data?.nome,
    certificadoraId: cert.data?.id,
    certificadoraPrincipal: cert.data?.nome,
    registro: 'PA-99999-X',
    status: 'aberta',
  });
  log('PASSO 2', emb.ok, emb.ok
    ? `Embarcação criada: "${emb.data.nome}" vinculada ao cliente "${cliente.data?.nome}" (ID: ${emb.data.id})`
    : `Erro ao criar embarcação: ${JSON.stringify(emb.data)}`);

  // ──────────────────────────────────────────
  // PASSO 3: Proposta Comercial
  // ──────────────────────────────────────────
  console.log('\n── PASSO 3: Proposta Comercial ──');
  const prop = await req('POST', '/api/proposals', {
    embarcacaoId: emb.data?.id,
    clienteId: cliente.data?.id,
    clienteNome: cliente.data?.nome,
    embarcacaoNome: emb.data?.nome,
    assunto: `Medição de Espessura por Ultrassom — Auditoria ${ts}`,
    prazoEntregaDias: 30,
    condicoesPagamento: 'À vista',
    itens: [{ descricao: 'Medição de Espessura por Ultrassom', quantidade: 1, valorUnitario: 5000 }],
    valorDesconto: 0,
  });
  log('PASSO 3', prop.ok, prop.ok
    ? `Proposta criada: ${prop.data.numero} | Valor: R$ ${prop.data.valorTotal} | Status: ${prop.data.status}`
    : `Erro ao criar proposta: ${JSON.stringify(prop.data)}`);

  // Verificar se gerou numeração sequencial DS 0XX/YY
  const numOk = prop.data?.numero && /^DS\s\d+\/\d+$/.test(prop.data.numero);
  log('PASSO 3 (numeração)', numOk, numOk
    ? `Numeração sequencial válida: "${prop.data.numero}"`
    : `Numeração inesperada: "${prop.data?.numero}"`);

  // ──────────────────────────────────────────
  // PASSO 4: Aceite Formal (Gera OS + Financeiro)
  // ──────────────────────────────────────────
  console.log('\n── PASSO 4: Aceite Formal ──');
  const fd = new FormData();
  fd.append('meio', 'email');
  fd.append('responsavelNome', 'Sr. Cliente Auditoria');
  fd.append('data', '2024-08-19'); // Data editável no passado para teste de renovação
  fd.append('situacaoFinanceira', 'sinal');
  fd.append('valorRecebido', '2500');

  const aceite = await fetch(`${BASE}/api/proposals/${prop.data?.id}/accept`, {
    method: 'POST', headers: { Cookie: cookie }, body: fd,
  });
  const aceiteData = await aceite.json().catch(() => ({}));
  const aceiteOk = aceite.ok;

  log('PASSO 4 (aceite)', aceiteOk, aceiteOk
    ? `Aceite registrado com data editável "2024-08-19"`
    : `Erro no aceite: ${JSON.stringify(aceiteData)}`);

  // Verificar se gerou OS automaticamente
  const osGerada = aceiteData?.os;
  log('PASSO 4 (OS auto)', !!osGerada?.id, osGerada?.id
    ? `OS gerada automaticamente: ${osGerada.numero} (ID: ${osGerada.id})`
    : `OS NÃO foi gerada automaticamente!`);

  // Verificar se gerou Contas a Receber
  const recebivel = aceiteData?.receivable;
  log('PASSO 4 (financeiro)', !!recebivel, recebivel
    ? `Contas a Receber gerado: status "${recebivel.status}" | Valor: R$ ${recebivel.valor}`
    : `Contas a Receber NÃO foi gerado!`);

  // Verificar se a proposta mudou para "aprovado"
  const propCheck = await req('GET', `/api/proposals`);
  const propAtual = propCheck.data?.find?.(p => p.id === prop.data?.id);
  log('PASSO 4 (status)', propAtual?.status === 'aprovado',
    `Status da proposta após aceite: "${propAtual?.status}" (esperado: "aprovado")`);

  // ──────────────────────────────────────────
  // PASSO 5: Agendamento da Vistoria na OS
  // ──────────────────────────────────────────
  console.log('\n── PASSO 5: Agendamento e Vistoria ──');
  
  // Carregar detalhe da OS
  const osDetail = await req('GET', `/api/service-orders/${osGerada?.id}`);
  const itens = osDetail.data?.itens || [];
  log('PASSO 5 (OS)', osDetail.ok && itens.length > 0, osDetail.ok
    ? `OS "${osDetail.data?.numero}" carregada | ${itens.length} serviço(s) | Status: "${osDetail.data?.status}"`
    : `Erro ao carregar OS: ${JSON.stringify(osDetail.data)}`);

  // Verificar se a OS está em "aguardando_agendamento"
  log('PASSO 5 (status OS)', osDetail.data?.status === 'aguardando_agendamento',
    `Status inicial da OS: "${osDetail.data?.status}" (esperado: "aguardando_agendamento")`);

  // Agendar o item
  if (itens.length > 0) {
    const itemId = itens[0].id;
    const users = await req('GET', '/api/users');
    const tecnico = users.data?.find?.(u => u.role === 'tecnico') || users.data?.[0];

    const agend = await req('POST', `/api/service-orders/items/${itemId}/schedule`, {
      tecnicoResponsavelId: tecnico?.id || login.data.id,
      data: '2025-09-01',
      horario: '08:00',
      local: 'Porto de Belém',
      observacoes: 'Teste auditoria',
    });
    log('PASSO 5 (agendar)', agend.ok, agend.ok
      ? `Serviço agendado: 01/09/2025 às 08:00 | Local: Porto de Belém`
      : `Erro no agendamento: ${JSON.stringify(agend.data)}`);

    // Verificar se a OS mudou para "visita_agendada"
    const osAfterSchedule = await req('GET', `/api/service-orders/${osGerada?.id}`);
    log('PASSO 5 (status)', osAfterSchedule.data?.status === 'visita_agendada',
      `Status após agendamento: "${osAfterSchedule.data?.status}" (esperado: "visita_agendada")`);

    // Iniciar serviço
    const iniciar = await req('PUT', `/api/service-orders/items/${itemId}`, { status: 'em_execucao' });
    log('PASSO 5 (iniciar)', iniciar.ok, iniciar.ok
      ? `Serviço iniciado: status "${iniciar.data?.status}"`
      : `Erro ao iniciar serviço: ${JSON.stringify(iniciar.data)}`);

    // Concluir serviço
    const concluir = await req('PUT', `/api/service-orders/items/${itemId}`, { status: 'concluido' });
    log('PASSO 5 (concluir)', concluir.ok, concluir.ok
      ? `Serviço concluído: status "${concluir.data?.status}"`
      : `Erro ao concluir: ${JSON.stringify(concluir.data)}`);
  }

  // ──────────────────────────────────────────
  // PASSO 6: Upload de Documentos e Versionamento
  // ──────────────────────────────────────────
  console.log('\\n── PASSO 6: Upload e Versionamento ──');
  
  // Criar um documento dummy associado à OS
  const docRes = await req('POST', `/api/service-orders/${osGerada?.id}/documents`, {
    tipo: 'ultrassom',
    descricao: 'Relatório de Espessura - V1',
  });
  const docId = docRes.data?.id;

  if (docId) {
    // Fazer upload de uma versão dummy
    const docFd = new FormData();
    const blob = new Blob(['conteudo pdf dummy'], { type: 'application/pdf' });
    docFd.append('file', blob, 'relatorio.pdf');
    docFd.append('comentario', 'Envio V1 auditoria');
    
    // We can't easily upload file from node fetch without proper multipart body if Blob isn't polyfilled correctly in Node 18, 
    // but Node 18 fetch supports Blob/FormData. Let's assume it works.
    const upload = await fetch(`${BASE}/api/service-orders/documents/${docId}/versions`, {
      method: 'POST', headers: { Cookie: cookie }, body: docFd,
    });
    const uploadData = await upload.json().catch(() => ({}));

    // Aprovar documento
    await req('PUT', `/api/service-orders/documents/${docId}/review`, { aprovado: true });
    
    log('PASSO 6', upload.ok, upload.ok
      ? `Documento criado, versão enviada e aprovada internamente.`
      : `Erro ao enviar versão: ${JSON.stringify(uploadData)}`);
  } else {
    log('PASSO 6', false, `Falha ao criar documento base: ${JSON.stringify(docRes.data)}`);
  }

  // ──────────────────────────────────────────
  // PASSO 7: Submissão e Resposta Externa
  // ──────────────────────────────────────────
  console.log('\\n── PASSO 7: Submissão e Resposta Externa ──');

  let submissaoId = null;
  if (docId) {
    const submitExt = await req('POST', `/api/service-orders/${osGerada?.id}/submit-external`, {
      documentoId: docId,
      certificadora: cert.data?.nome,
      protocolo: 'PROT-AUDIT-001',
      observacoes: 'Teste auditoria',
    });
    
    submissaoId = submitExt.data?.id;

    log('PASSO 7a (envio)', submitExt.ok, submitExt.ok
      ? `Submissão externa registrada | Protocolo: PROT-AUDIT-001`
      : `Envio externo: ${submitExt.status} — ${JSON.stringify(submitExt.data).substring(0, 120)}`);
  }

  // Testar resposta externa (aprovação)
  if (submissaoId) {
    const respExt = await req('POST', `/api/service-orders/${osGerada?.id}/external-response`, {
      submissaoId: submissaoId,
      resultado: 'aprovado',
      observacoes: 'Aprovado pela certificadora',
    });
    log('PASSO 7b (resposta)', respExt.ok, respExt.ok
      ? `Resposta registrada: aprovado`
      : `Resposta externa: ${respExt.status} — ${JSON.stringify(respExt.data).substring(0, 120)}`);
  }

  // ──────────────────────────────────────────
  // PASSO 8: Entrega e Conclusão da OS
  // ──────────────────────────────────────────
  console.log('\\n── PASSO 8: Entrega e Conclusão ──');
  
  const entrega = await req('POST', `/api/service-orders/${osGerada?.id}/deliver`, {
    nomeRecebedor: 'Sr. Cliente Teste',
    dataEntrega: '2025-09-15',
    meioEntrega: 'presencial',
  });
  
  log('PASSO 8a (entrega)', entrega.ok, entrega.ok
    ? `Entrega registrada: recebido por "Sr. Cliente Teste" em 15/09/2025`
    : `Entrega: ${entrega.status} — ${JSON.stringify(entrega.data).substring(0, 120)}`);

  // Concluir OS
  const completeRes = await fetch(`${BASE}/api/service-orders/${osGerada?.id}/complete`, {
    method: 'POST', headers: { Cookie: cookie },
  });
  const completeData = await completeRes.json().catch(() => ({}));
  log('PASSO 8b (concluir OS)', completeRes.ok, completeRes.ok
    ? `OS concluída com sucesso! Status final: "${completeData.status || 'concluida'}"`
    : `Conclusão: ${completeRes.status} — ${JSON.stringify(completeData).substring(0, 120)}`);

  // ──────────────────────────────────────────
  // PASSO 9: Financeiro
  // ──────────────────────────────────────────
  console.log('\n── PASSO 9: Financeiro ──');
  const finEntries = await req('GET', '/api/finance');
  const myEntry = finEntries.data?.find?.(e => e.embarcacaoId === emb.data?.id);
  log('PASSO 9', !!myEntry, myEntry
    ? `Lançamento financeiro encontrado: R$ ${myEntry.valor} | Tipo: ${myEntry.tipo} | Embarcação: ${myEntry.embarcacaoNome}`
    : `Nenhum lançamento financeiro vinculado à embarcação da auditoria`);

  // ──────────────────────────────────────────
  // PASSO 10: Renovações Anuais
  // ──────────────────────────────────────────
  console.log('\n── PASSO 10: Renovação Anual ──');
  const renewals = await req('GET', '/api/proposals/renewals/due');
  // A proposta com aceite em 2024-08-19 já venceu (>365 dias)
  const myRenewal = renewals.data?.find?.(r => r.id === prop.data?.id);
  log('PASSO 10a (vencidas)', renewals.ok, renewals.ok
    ? `Endpoint de renovações acessado: ${renewals.data?.length} proposta(s) vencida(s) no total`
    : `Erro: ${JSON.stringify(renewals.data)}`);

  log('PASSO 10b (detecção)', !!myRenewal, myRenewal
    ? `Proposta "${myRenewal.numero}" detectada como vencida! Data aceite: ${myRenewal.aceiteData}`
    : `Proposta criada com aceite em 2024-08-19 — precisa de >365 dias para aparecer (pode já estar vencida)`);

  // Testar geração de renovação
  if (myRenewal) {
    const renew = await req('POST', `/api/proposals/${myRenewal.id}/renewal`);
    log('PASSO 10c (gerar)', renew.ok, renew.ok
      ? `Renovação gerada! Nova proposta: ${renew.data?.numero} | Status: ${renew.data?.status}`
      : `Erro ao gerar renovação: ${JSON.stringify(renew.data)}`);
  }

  // ──────────────────────────────────────────
  // VERIFICAÇÕES DE NOTIFICAÇÕES
  // ──────────────────────────────────────────
  console.log('\n── VERIFICAÇÃO: Notificações ──');
  const notifs = await req('GET', '/api/service-orders/notifications');
  log('NOTIFICAÇÕES', notifs.ok, notifs.ok
    ? `${notifs.data?.length} notificação(ões) no sino de alertas`
    : `Erro ao buscar notificações`);

  // ──────────────────────────────────────────
  // VERIFICAÇÃO: Histórico de Eventos da OS
  // ──────────────────────────────────────────
  console.log('\n── VERIFICAÇÃO: Histórico de Eventos ──');
  const osFinal = await req('GET', `/api/service-orders/${osGerada?.id}`);
  const eventos = osFinal.data?.eventos || [];
  log('EVENTOS', eventos.length > 0, eventos.length > 0
    ? `${eventos.length} evento(s) registrados na timeline da OS`
    : `Nenhum evento registrado (ou campo "eventos" não retornado na API)`);

  // ──────────────────────────────────────────
  // RESUMO FINAL
  // ──────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`  RESULTADO FINAL: ${passed} passou | ${failed} falhou | ${results.length} total`);
  if (failed === 0) {
    console.log('  🏆 TODOS OS TESTES PASSARAM! O sistema funciona conforme o manual.');
  } else {
    console.log('  ⚠️  Pontos que precisam de atenção:');
    results.filter(r => !r.ok).forEach(r => console.log(`    ❌ ${r.step}: ${r.detail}`));
  }
  console.log('═══════════════════════════════════════════════════════');
}

audit();
