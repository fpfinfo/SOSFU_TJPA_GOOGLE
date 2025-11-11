import React from 'react';
import { RequestStatus } from '../../types';

interface BadgeProps {
    status: RequestStatus;
}

const statusStyles: Record<RequestStatus, string> = {
    // Solicitação
    [RequestStatus.RASCUNHO]: 'bg-status-rascunho/20 text-status-rascunho border border-status-rascunho/50',
    [RequestStatus.ENVIADA_PARA_ANALISE]: 'bg-status-enviada/20 text-status-enviada border border-status-enviada/50',
    [RequestStatus.EM_ANALISE]: 'bg-status-em-analise/20 text-status-em-analise border border-status-em-analise/50',
    [RequestStatus.DEVOLVIDA_PARA_AJUSTES]: 'bg-status-ajustes/20 text-status-ajustes border border-status-ajustes/50',
    [RequestStatus.APROVADA_PARA_CONCESSAO]: 'bg-status-aprovada-concessao/20 text-status-aprovada-concessao border border-status-aprovada-concessao/50',
    [RequestStatus.REJEITADO]: 'bg-status-rejected/20 text-status-rejected border border-status-rejected/50',

    // Execução
    [RequestStatus.RECURSO_LIBERADO]: 'bg-status-recurso-liberado/20 text-status-recurso-liberado border border-status-recurso-liberado/50',
    [RequestStatus.EM_EXECUCAO]: 'bg-status-em-execucao/20 text-status-em-execucao border border-status-em-execucao/50',
    [RequestStatus.AGUARDANDO_PRESTACAO]: 'bg-status-aguardando-prestacao/20 text-status-aguardando-prestacao border border-status-aguardando-prestacao/50',
    
    // Prestação de Contas
    [RequestStatus.PRESTACAO_ENVIADA]: 'bg-status-prestacao-enviada/20 text-status-prestacao-enviada border border-status-prestacao-enviada/50',
    [RequestStatus.PRESTACAO_EM_ANALISE]: 'bg-status-em-analise/20 text-status-em-analise border border-status-em-analise/50',
    [RequestStatus.PRESTACAO_DEVOLVIDA]: 'bg-status-prestacao-devolvida/20 text-status-prestacao-devolvida border border-status-prestacao-devolvida/50',
    [RequestStatus.PRESTACAO_CORRIGIDA]: 'bg-status-prestacao-corrigida/20 text-status-prestacao-corrigida border border-status-prestacao-corrigida/50',
    [RequestStatus.PRESTACAO_APROVADA]: 'bg-status-prestacao-aprovada/20 text-status-prestacao-aprovada border border-status-prestacao-aprovada/50',
    [RequestStatus.PRESTACAO_REPROVADA]: 'bg-status-prestacao-reprovada/20 text-status-prestacao-reprovada border border-status-prestacao-reprovada/50',

    // Alcance
    [RequestStatus.EM_ALCANCE]: 'bg-status-em-alcance/20 text-status-em-alcance border border-status-em-alcance/50',
    [RequestStatus.ALCANCE_REGULARIZADO]: 'bg-status-alcance-regularizado/20 text-status-alcance-regularizado border border-status-alcance-regularizado/50',

    // Finalização
    [RequestStatus.ARQUIVADO]: 'bg-status-arquivado/20 text-status-arquivado border border-status-arquivado/50',
};


const Badge: React.FC<BadgeProps> = ({ status }) => {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-200 text-gray-800'}`}
        >
            {status}
        </span>
    );
};

export default Badge;