import { SolicitacaoSuprimento } from "@/api/entities";
import { HistoricoStatusSolicitacao } from "@/api/entities";
import { SolicitanteService } from "../utils/SolicitanteService";
import { AuditoriaService } from "../utils/AuditoriaService";

export const STATUS_DESCRIPTIONS = {
  rascunho: "O suprido está elaborando o pedido",
  pendente: "Quando o suprido já elaborou a sua solicitação, mas ainda não enviou para análise",
  em_analise: "O administrador recebeu e alterou o status para analisar o pedido",
  aprovado: "O administrador diz que está tudo certo e vai processar o pagamento",
  rejeitado: "O administrador encontrou alguma inconsistência no pedido e vai devolver ao suprido para ajuste",
  cancelado: "Após o envio, análise e pagamento, o suprido desistiu do suprimento e devolveu os recursos",
  pago: "O administrador informa que o pedido foi pago",
  confirmado: "O suprido confirma que recebeu o pagamento"
};

export const STATUS_COLORS = {
  rascunho: "bg-gray-100 text-gray-800",
  pendente: "bg-blue-100 text-blue-800",
  em_analise: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  cancelado: "bg-purple-100 text-purple-800",
  pago: "bg-emerald-100 text-emerald-800",
  confirmado: "bg-emerald-200 text-emerald-900 font-semibold"
};

export const TRANSITIONS = {
  funcionario: {
    rascunho: ['pendente'],
    rejeitado: ['pendente'],
    pago: ['confirmado']
  },
  
  admin: {
    pendente: ['em_analise'],
    em_analise: ['aprovado', 'rejeitado'],
    aprovado: ['pago']
  }
};

export const STATUS_MESSAGES = {
  em_analise: "Sua solicitação entrou em análise.",
  rejeitado: "Sua solicitação foi rejeitada.",
  aprovado: "Sua solicitação foi aprovada e seguirá para pagamento.",
  pago: "Seu pagamento foi realizado. Aguarde a confirmação.",
  confirmado: "O recebimento do pagamento foi confirmado.",
  cancelado: "A solicitação foi cancelada."
};

export const getAvailableTransitions = (currentStatus, userRole) => {
  const role = userRole === 'admin' ? 'admin' : 'funcionario';
  return TRANSITIONS[role][currentStatus] || [];
};

export const canTransitionTo = (currentStatus, newStatus, userRole) => {
  const availableTransitions = getAvailableTransitions(currentStatus, userRole);
  return availableTransitions.includes(newStatus);
};

export const changeStatus = async (
  solicitacaoId,
  newStatus,
  observacao = '',
  userId,
  userRole,
  userEmail,
  user
) => {
  try {
    const solicitacao = await SolicitacaoSuprimento.get(solicitacaoId);
    if (!solicitacao) {
      throw new Error("Solicitação não encontrada");
    }

    const oldStatus = solicitacao.status;

    if (!getAvailableTransitions(oldStatus, userRole).includes(newStatus)) {
      throw new Error("Transição de status não permitida");
    }

    const updateData = { status: newStatus };

    if (newStatus === 'em_analise') {
      updateData.data_analise = new Date().toISOString().split('T')[0];
      updateData.analista_responsavel = userEmail;
    }

    if (newStatus === 'pendente' && oldStatus === 'rascunho') {
      if (user) {
        const snapshot = await SolicitanteService.criarSnapshot(user, 'solicitacao_enviada');
        updateData.solicitante_snapshot = snapshot;
      }
    }

    const updatedSolicitacao = await SolicitacaoSuprimento.update(solicitacaoId, updateData);

    await HistoricoStatusSolicitacao.create({
      solicitacao_id: solicitacaoId,
      de_status: oldStatus,
      para_status: newStatus,
      autor_id: userId,
      observacao: observacao || `Status alterado de ${oldStatus} para ${newStatus}`
    });

    await AuditoriaService.registrarMudancaStatus(
      'SolicitacaoSuprimento',
      solicitacaoId,
      oldStatus,
      newStatus,
      observacao,
      {
        actorId: userId,
        actorNome: user?.full_name || user?.nome,
        actorEmail: userEmail
      }
    );

    return updatedSolicitacao;

  } catch (error) {
    console.error("Erro ao alterar status:", error);
    throw error;
  }
};