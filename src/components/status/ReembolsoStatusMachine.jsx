import { Reembolso } from "@/api/entities";
import { HistoricoStatusReembolso } from "@/api/entities";
import { AuditoriaService } from "@/components/utils/AuditoriaService";

export const REEMBOLSO_STATUS_DESCRIPTIONS = {
  rascunho: "O suprido está elaborando o pedido de reembolso.",
  pendente: "O reembolso foi enviado para análise do administrador.",
  em_analise: "Reembolso em análise pelo administrador.",
  aprovado: "Reembolso aprovado pelo administrador.",
  glosa: "Reembolso devolvido com glosa para correções.",
  rejeitado: "Reembolso rejeitado.",
  concluido: "Processo de reembolso concluído e arquivado."
};

// Paleta unificada
export const REEMBOLSO_STATUS_COLORS = {
  rascunho: "bg-slate-100 text-slate-700",
  pendente: "bg-sky-100 text-sky-700",
  em_analise: "bg-amber-100 text-amber-700",
  aprovado: "bg-emerald-100 text-emerald-700",
  glosa: "bg-orange-100 text-orange-700",
  rejeitado: "bg-rose-100 text-rose-700",
  concluido: "bg-emerald-600 text-white font-semibold"
};

export const REEMBOLSO_TRANSITIONS = {
  funcionario: { rascunho: ["pendente"], glosa: ["pendente"] },
  admin: { pendente: ["em_analise"], em_analise: ["aprovado", "glosa", "rejeitado"], aprovado: ["concluido"] }
};

export const getReembolsoAvailableTransitions = (currentStatus, userRole) => {
  const role = userRole === "admin" ? "admin" : "funcionario";
  return REEMBOLSO_TRANSITIONS[role][currentStatus] || [];
};

export const changeReembolsoStatus = async (
  reembolsoId,
  newStatus,
  observacao = "",
  userId,
  userRole,
  userEmail,
  user
) => {
  const reembolso = await Reembolso.get(reembolsoId);
  if (!reembolso) throw new Error("Reembolso não encontrado");

  const oldStatus = reembolso.status;
  const allowed = getReembolsoAvailableTransitions(oldStatus, userRole);
  if (!allowed.includes(newStatus)) throw new Error("Transição de status não permitida");

  const updated = await Reembolso.update(reembolsoId, { status: newStatus });

  await HistoricoStatusReembolso.create({
    reembolso_id: reembolsoId,
    de_status: oldStatus,
    para_status: newStatus,
    autor_id: userId,
    observacao: observacao || `Status alterado de ${oldStatus} para ${newStatus}`
  });

  await AuditoriaService.registrarMudancaStatus(
    "Reembolso",
    reembolsoId,
    oldStatus,
    newStatus,
    observacao,
    { actorId: userId, actorNome: user?.full_name || user?.nome, actorEmail: userEmail }
  );

  return updated;
};