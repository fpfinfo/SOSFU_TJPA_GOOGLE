
import React from 'react';
import { RequestStatus } from '../../types';
import Card from '../common/Card';
import { ChartBarIcon, ScaleIcon } from '../../constants';
import { useAppContext } from '../../hooks/useAppContext';

const KPICard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
    </Card>
);

const Dashboard: React.FC = () => {
    const { requests } = useAppContext();

    const totalValue = requests.reduce((sum, req) => sum + req.amount, 0);
    const pendingCount = requests.filter(r => r.status === RequestStatus.ENVIADA_PARA_ANALISE).length;
    const prestacaoCount = requests.filter(r => r.status === RequestStatus.PRESTACAO_ENVIADA || r.status === RequestStatus.PRESTACAO_CORRIGIDA).length;
    const totalCount = requests.length;

    const expenseDistribution = requests.reduce((acc, req) => {
        acc[req.expenseType] = (acc[req.expenseType] || 0) + req.amount;
        return acc;
    }, {} as Record<string, number>);

    const maxExpense = Math.max(...(Object.values(expenseDistribution) as number[]), 1);

    const statusDistribution = requests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
    }, {} as Record<RequestStatus, number>);
    
    const statusColors: Record<RequestStatus, string> = {
        [RequestStatus.RASCUNHO]: 'bg-status-rascunho',
        [RequestStatus.ENVIADA_PARA_ANALISE]: 'bg-status-enviada',
        [RequestStatus.EM_ANALISE]: 'bg-status-em-analise',
        [RequestStatus.DEVOLVIDA_PARA_AJUSTES]: 'bg-status-ajustes',
        [RequestStatus.APROVADA_PARA_CONCESSAO]: 'bg-status-aprovada-concessao',
        [RequestStatus.REJEITADO]: 'bg-status-rejected',
        [RequestStatus.RECURSO_LIBERADO]: 'bg-status-recurso-liberado',
        [RequestStatus.EM_EXECUCAO]: 'bg-status-em-execucao',
        [RequestStatus.AGUARDANDO_PRESTACAO]: 'bg-status-aguardando-prestacao',
        [RequestStatus.PRESTACAO_ENVIADA]: 'bg-status-prestacao-enviada',
        [RequestStatus.PRESTACAO_EM_ANALISE]: 'bg-status-em-analise',
        [RequestStatus.PRESTACAO_DEVOLVIDA]: 'bg-status-prestacao-devolvida',
        [RequestStatus.PRESTACAO_CORRIGIDA]: 'bg-status-prestacao-corrigida',
        [RequestStatus.PRESTACAO_APROVADA]: 'bg-status-prestacao-aprovada',
        [RequestStatus.PRESTACAO_REPROVADA]: 'bg-status-prestacao-reprovada',
        [RequestStatus.EM_ALCANCE]: 'bg-status-em-alcance',
        [RequestStatus.ALCANCE_REGULARIZADO]: 'bg-status-alcance-regularizado',
        [RequestStatus.ARQUIVADO]: 'bg-status-arquivado',
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Valor Total Solicitado" value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<ScaleIcon className="w-8 h-8 text-tribunal-primary"/>} />
                <KPICard title="Total de Solicitações" value={totalCount} icon={<ChartBarIcon className="w-8 h-8 text-tribunal-primary"/>} />
                <KPICard title="Pendentes de Análise" value={pendingCount} icon={<div className="w-8 h-8 rounded-full bg-status-enviada/20 flex items-center justify-center"><span className="text-status-enviada font-bold">!</span></div>} />
                <KPICard title="Aguardando Análise (PC)" value={prestacaoCount} icon={<div className="w-8 h-8 rounded-full bg-status-prestacao-enviada/20 flex items-center justify-center"><span className="text-status-prestacao-enviada font-bold">?</span></div>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Distribuição por Elemento de Despesa" className="lg:col-span-2">
                    <div className="space-y-4">
                        {Object.entries(expenseDistribution).sort(([,a],[,b]) => b - a).map(([type, amount]) => (
                            <div key={type}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{type}</span>
                                    <span className="text-gray-500">R$ {amount.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-tribunal-primary h-2.5 rounded-full" style={{ width: `${(amount / maxExpense) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card title="Solicitações por Status">
                    <div className="space-y-3">
                         {Object.entries(statusDistribution).sort(([statusA], [statusB]) => statusA.localeCompare(statusB)).map(([status, count]) => (
                            <div key={status} className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-3 ${statusColors[status as RequestStatus]}`}></div>
                                <div className="flex-1 flex justify-between text-sm">
                                    <span>{status}</span>
                                    <span className="font-semibold">{count}</span>
                                </div>
                            </div>
                         ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
