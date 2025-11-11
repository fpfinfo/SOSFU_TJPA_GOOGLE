import React from 'react';
import { FundRequest, RequestStatus } from '../../types';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { CheckIcon, XMarkIcon, EyeIcon, ChatBubbleLeftEllipsisIcon } from '../../constants';
import { useAppContext } from '../../hooks/useAppContext';

interface RequestListProps {
    title: string;
    requests: FundRequest[];
    listType: 'solicitacoes' | 'prestacoes' | 'alcance' | 'readonly';
}

const RequestList: React.FC<RequestListProps> = ({ title, requests, listType }) => {
    const { updateRequestStatus, viewDetails, openReasonModal, startChat } = useAppContext();
    
    const handleActionWithReason = (id: string, status: RequestStatus) => {
        let modalTitle = "Justificar Ação";
        if(status === RequestStatus.DEVOLVIDA_PARA_AJUSTES) modalTitle = "Justificar Devolução";
        if(status === RequestStatus.REJEITADO) modalTitle = "Justificar Rejeição";
        
        openReasonModal({
            title: modalTitle,
            label: 'Por favor, informe o motivo para esta ação:',
            onConfirm: (reason) => {
                updateRequestStatus(id, status, reason);
            }
        });
    }

    const renderActions = (request: FundRequest) => {
        switch(listType) {
            case 'solicitacoes':
                return (
                    <>
                        <button onClick={() => handleActionWithReason(request.id, RequestStatus.DEVOLVIDA_PARA_AJUSTES)} title="Devolver para Ajuste" className="p-1 rounded-full text-yellow-500 hover:bg-yellow-100">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                        </button>
                        <button onClick={() => handleActionWithReason(request.id, RequestStatus.REJEITADO)} title="Rejeitar" className="p-1 rounded-full text-red-500 hover:bg-red-100">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => updateRequestStatus(request.id, RequestStatus.APROVADA_PARA_CONCESSAO)} title="Aprovar" className="p-1 rounded-full text-green-500 hover:bg-green-100">
                            <CheckIcon className="h-5 w-5" />
                        </button>
                    </>
                );
            case 'prestacoes':
                if (request.status === RequestStatus.EM_ALCANCE) {
                     return (
                         <button onClick={() => startChat(request.requester)} className="px-2 py-1 text-xs font-semibold text-white bg-status-em-alcance rounded-md hover:bg-status-em-alcance/90 flex items-center space-x-1">
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4"/>
                            <span>Contactar Suprido</span>
                         </button>
                    );
                }
                return (
                     <button onClick={() => viewDetails(request)} className="px-2 py-1 text-xs font-semibold text-white bg-tribunal-primary rounded-md hover:bg-tribunal-primary/90">
                        Analisar Prestação
                     </button>
                );
            default:
                return null;
        }
    }
    
    return (
        <Card>
             <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
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
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Nenhuma solicitação nesta categoria.
                                </td>
                            </tr>
                        ) : (
                            requests.map((request) => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(request.submissionDate).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.requester}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.expenseType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {request.amount.toFixed(2).replace('.', ',')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><Badge status={request.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => viewDetails(request)} title="Ver Detalhes" className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700">
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
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

export default RequestList;
