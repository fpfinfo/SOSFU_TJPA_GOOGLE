import { PrestacaoContas } from "@/api/entities";
import { HistoricoStatusPrestacao } from "@/api/entities";
import { AuditoriaService } from "@/components/utils/AuditoriaService";

export const PRESTACAO_STATUS_DESCRIPTIONS = {
  rascunho: "O suprido está elaborando a prestação de contas.",
  pendente: "A prestação foi enviada para análise do administrador.",
  em_analise: "Prestação em análise pelo administrador.",
  aprovado: "Prestação aprovada pelo administrador.",
  glosa: "Prestação devolvida com glosa para correções.",
  rejeitado: "Prestação rejeitada.",
  concluido: "Processo concluído e arquivado."
};

// Paleta unificada
export const PRESTACAO_STATUS_COLORS = {
  rascunho: "bg-slate-100 text-slate-700",
  pendente: "bg-sky-100 text-sky-700",
  em_analise: "bg-amber-100 text-amber-700",
  aprovado: "bg-emerald-100 text-emerald-700",
  glosa: "bg-orange-100 text-orange-700",
  rejeitado: "bg-rose-100 text-rose-700",
  concluido: "bg-emerald-600 text-white font-semibold"
};

export const PRESTACAO_TRANSITIONS = {
  funcionario: { rascunho: ["pendente"], glosa: ["pendente"] },
  admin: { pendente: ["em_analise"], em_analise: ["aprovado", "glosa", "rejeitado"], aprovado: ["concluido"] }
};

export const getPrestacaoAvailableTransitions = (currentStatus, userRole) => {
  const role = userRole === "admin" ? "admin" : "funcionario";
  return PRESTACAO_TRANSITIONS[role][currentStatus] || [];
};

export const changePrestacaoStatus = async (
  prestacaoId,
  newStatus,
  observacao = "",
  userId,
  userRole,
  userEmail,
  user
) => {
  const prestacao = await PrestacaoContas.get(prestacaoId);
  if (!prestacao) throw new Error("Prestação não encontrada");

  const oldStatus = prestacao.status;
  if (!getPrestacaoAvailableTransitions(oldStatus, userRole).includes(newStatus)) {
    throw new Error("Transição de status não permitida");
  }
  const updatedPrestacao = await PrestacaoContas.update(prestacaoId, { status: newStatus });

  await HistoricoStatusPrestacao.create({
    prestacao_id: prestacaoId,
    de_status: oldStatus,
    para_status: newStatus,
    autor_id: userId,
    observacao: observacao || `Status alterado de ${oldStatus} para ${newStatus}`
  });

  await AuditoriaService.registrarMudancaStatus(
    "PrestacaoContas",
    prestacaoId,
    oldStatus,
    newStatus,
    observacao,
    { actorId: userId, actorNome: user?.full_name || user?.nome, actorEmail: userEmail }
  );

  return updatedPrestacao;
};