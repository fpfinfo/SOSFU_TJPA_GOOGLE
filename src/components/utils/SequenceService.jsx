import { SolicitacaoSuprimento } from "@/api/entities";
import { PrestacaoContas } from "@/api/entities";
import { Reembolso } from "@/api/entities";

// Formata: PREFIX-YYYY-000001
function formatSeq(prefix, year, seq) {
  const num = String(seq).padStart(6, "0");
  return `${prefix}-${year}-${num}`;
}

// Busca o próximo sequencial do ano para uma entidade
async function nextSequentialForYear(filterFn, year) {
  // Tenta obter o maior sequencial do ano
  // filter(query, sort, limit)
  const rows = await filterFn({ ano: year }, "-sequencial", 1);
  const last = rows && rows.length > 0 ? Number(rows[0].sequencial || 0) : 0;
  return last + 1;
}

export const SequenceService = {
  async generateSolicitacaoNumero() {
    const year = new Date().getFullYear();
    const next = await nextSequentialForYear(SolicitacaoSuprimento.filter.bind(SolicitacaoSuprimento), year);
    return {
      ano: year,
      sequencial: next,
      numero: formatSeq("SUP", year, next),
    };
  },

  async generatePrestacaoProtocolo() {
    const year = new Date().getFullYear();
    const next = await nextSequentialForYear(PrestacaoContas.filter.bind(PrestacaoContas), year);
    return {
      ano: year,
      sequencial: next,
      protocolo: formatSeq("PRE", year, next),
    };
  },

  async generateReembolsoProtocolo() {
    const year = new Date().getFullYear();
    const next = await nextSequentialForYear(Reembolso.filter.bind(Reembolso), year);
    return {
      ano: year,
      sequencial: next,
      protocolo: formatSeq("REB", year, next),
    };
  },
};