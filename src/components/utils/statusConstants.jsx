export const PRESTACAO_STATUS = {
  RASCUNHO:  'rascunho',
  PENDENTE:  'pendente',
  EM_ANALISE:'em_analise',
  APROVADO:  'aprovado',
  GLOSA:     'glosa',
  REJEITADO: 'rejeitado',
  REANALISE: 'reanalise',
  AJSEFIN:   'ajsefin',
  SIAFE:     'siafe',
  CONCLUIDO: 'concluido',
};

export const STATUS_LABEL_TO_CODE = {
  'rascunho': PRESTACAO_STATUS.RASCUNHO,
  'pendente': PRESTACAO_STATUS.PENDENTE,
  'em análise': PRESTACAO_STATUS.EM_ANALISE,
  'aprovado': PRESTACAO_STATUS.APROVADO,
  'glosa': PRESTACAO_STATUS.GLOSA,
  'rejeitado': PRESTACAO_STATUS.REJEITADO,
  'reanálise': PRESTACAO_STATUS.REANALISE,
  'ajsefin': PRESTACAO_STATUS.AJSEFIN,
  'siafe': PRESTACAO_STATUS.SIAFE,
  'concluído': PRESTACAO_STATUS.CONCLUIDO,
};

export function toCanonicalStatus(labelOrCode) {
  const key = (labelOrCode || '').toLowerCase();
  return STATUS_LABEL_TO_CODE[key] || key;
}

export const PRESTACAO_STATUS_DESCRIPTIONS = {
  [PRESTACAO_STATUS.RASCUNHO]: 'O suprido está elaborando a prestação de contas.',
  [PRESTACAO_STATUS.PENDENTE]: 'A prestação de contas foi elaborada, mas ainda não foi enviada para análise.',
  [PRESTACAO_STATUS.EM_ANALISE]: 'A prestação foi recebida pelo administrador e está sendo analisada.',
  [PRESTACAO_STATUS.APROVADO]: 'A prestação foi aprovada e considerada regular.',
  [PRESTACAO_STATUS.GLOSA]: 'Foram encontradas inconsistências. A prestação foi devolvida para ajuste.',
  [PRESTACAO_STATUS.REJEITADO]: 'A prestação de contas foi reprovada e não pode ser reaberta.',
  [PRESTACAO_STATUS.REANALISE]: 'A prestação ajustada foi reenviada e está em reanálise pelo administrador.',
  [PRESTACAO_STATUS.AJSEFIN]: 'A prestação foi encaminhada para a Assessoria Jurídica da SEPLAN/SEFIN.',
  [PRESTACAO_STATUS.SIAFE]: 'A prestação foi encaminhada para baixa no sistema SIAFE.',
  [PRESTACAO_STATUS.CONCLUIDO]: 'O processo foi finalizado e arquivado com sucesso.',
};