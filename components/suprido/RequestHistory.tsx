
import React from 'react';
import { FundRequest, RequestStatus } from '../../types';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { EyeIcon } from '../../constants';
import { useAppContext } from '../../hooks/useAppContext';

interface RequestHistoryProps {
    requests: FundRequest[];
}

const RequestHistory: React.FC<RequestHistoryProps> = ({ requests }) => {
    const { viewDetails, openPrestacaoModal } = useAppContext();
    
    const renderActions = (request: FundRequest) => {
        const canPrestarContas = [
            RequestStatus.EM_EXECUCAO,
            RequestStatus.AGUARDANDO_PRESTACAO,
            RequestStatus.PRESTACAO_DEVOLVIDA,
            RequestStatus.PRESTACAO_REPROVADA,
        ].includes(request.status);

        return (
             <div className="flex items-center space-x-2">
                 {canPrestarContas && (
                     <button 
                        onClick={() => openPrestacaoModal(request)}
                        className="px-2 py-1 text-xs font-semibold text-white bg-tribunal-primary rounded-md hover:bg-tribunal-primary/90"
                    >
                        {request.prestacaoContas ? 'Corrigir Prestação' : 'Prestar Contas'}
                    </button>
                 )}
                <button onClick={() => viewDetails(request)} title="Ver Detalhes" className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700">
                    <EyeIcon className="h-5 w-5" />
                </button>
            </div>
        );
    }
    
    return (
        <Card>
             <h2 className="text-xl font-semibold text-gray-800 mb-4">Minhas Solicitações</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despesa</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Ações</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Nenhuma solicitação encontrada.
                                </td>
                            </tr>
                        ) : (
                            requests.map((request) => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(request.submissionDate).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.expenseType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {request.amount.toFixed(2).replace('.', ',')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><Badge status={request.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {renderActions(request)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default RequestHistory;
