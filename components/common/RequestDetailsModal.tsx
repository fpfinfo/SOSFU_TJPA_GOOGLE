
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { FundRequest, RequestStatus, UserRole } from '../../types';
import { XMarkIcon } from '../../constants';
import Badge from './Badge';
import ValidadorDocumentos from '../admin/ValidadorDocumentos';
import AnaliseInteligenteSuprimento from '../admin/AnaliseInteligenteSuprimento';
import AnaliseInteligentePrestacao from '../admin/AnaliseInteligentePrestacao';


const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
);

const RequestDetailsModal: React.FC = () => {
    const { selectedRequest, closeDetails, updateRequestStatus, openReasonModal, currentUser } = useAppContext();

    if (!selectedRequest) return null;

    const request: FundRequest = selectedRequest;
    const isPrestacao = request.prestacaoContas !== undefined;
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const handleAction = (status: RequestStatus, withReason: boolean = false) => {
        if (withReason) {
             let modalTitle = "Justificar Ação";
            if(status === RequestStatus.PRESTACAO_DEVOLVIDA) modalTitle = "Justificar Devolução da Prestação";
            if(status === RequestStatus.PRESTACAO_REPROVADA) modalTitle = "Justificar Reprovação da Prestação";
            
            openReasonModal({
                title: modalTitle,
                label: 'Por favor, informe o motivo para esta ação:',
                onConfirm: (reason: string) => {
                    updateRequestStatus(request.id, status, reason);
                    closeDetails();
                },
                onClose: () => { openReasonModal({isOpen: false}); }
            });
        } else {
            updateRequestStatus(request.id, status);
            closeDetails();
        }
    };

    const renderAdminActions = () => {
        if (!isAdmin) return null;

        if (isPrestacao) {
             switch(request.status) {
                case RequestStatus.PRESTACAO_ENVIADA:
                case RequestStatus.PRESTACAO_EM_ANALISE:
                case RequestStatus.PRESTACAO_CORRIGIDA:
                     return (
                        <div className="flex justify-end gap-2">
                             <button onClick={() => handleAction(RequestStatus.PRESTACAO_DEVOLVIDA, true)} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Devolver</button>
                             <button onClick={() => handleAction(RequestStatus.PRESTACAO_REPROVADA, true)} className="px-4 py-2 text-sm font-medium rounded-md bg-status-rejected text-white hover:bg-status-rejected/90">Reprovar</button>
                             <button onClick={() => handleAction(RequestStatus.PRESTACAO_APROVADA)} className="px-4 py-2 text-sm font-medium rounded-md bg-status-approved text-white hover:bg-status-approved/90">Aprovar</button>
                        </div>
                    );
                default: return null;
             }
        }
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={closeDetails}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl transform transition-all max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-tribunal-primary">Detalhes da Solicitação #{request.id}</h2>
                    <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Basic Info */}
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                        <InfoItem label="Solicitante" value={request.requester} />
                        <InfoItem label="Data" value={new Date(request.submissionDate).toLocaleString('pt-BR')} />
                        <InfoItem label="Status" value={<Badge status={request.status} />} />
                        <InfoItem label="Tipo de Suprimento" value={request.requestType} />
                        <InfoItem label="Elemento de Despesa" value={request.expenseType} />
                        <InfoItem label="Centro de Custo" value={request.costCenter} />
                        <InfoItem label="Polo / Comarca / Região" value={`${request.polo} / ${request.comarca} / ${request.regiaoJudiciaria}`} />
                        <InfoItem label="Período de Aplicação" value={`${new Date(request.applicationPeriod.start + 'T00:00:00Z').toLocaleDateString('pt-BR')} a ${new Date(request.applicationPeriod.end + 'T00:00:00Z').toLocaleDateString('pt-BR')}`} />
                        <InfoItem label="Valor Solicitado" value={`R$ ${request.amount.toFixed(2).replace('.', ',')}`} />
                        <div className="sm:col-span-3">
                             <InfoItem label="Descrição / Justificativa" value={<p className="whitespace-pre-wrap">{request.description}</p>} />
                        </div>
                        {request.attachment && <InfoItem label="Anexo" value={<a href="#" className="text-tribunal-primary hover:underline">{request.attachment.name} ({request.attachment.size.toFixed(1)} KB)</a>} />}
                    </dl>

                    {isAdmin && !isPrestacao && <AnaliseInteligenteSuprimento request={request} />}

                    {/* Prestacao de Contas */}
                    {request.prestacaoContas && (
                         <div className="pt-6 border-t">
                             <h3 className="text-lg font-semibold text-gray-800 mb-4">Prestação de Contas</h3>
                             <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3 mb-4">
                                <InfoItem label="Data de Envio" value={new Date(request.prestacaoContas.submittedDate).toLocaleString('pt-BR')} />
                                <InfoItem label="Valor Total Declarado" value={`R$ ${request.prestacaoContas.totalAmount.toFixed(2).replace('.', ',')}`} />
                             </dl>
                             <div className="sm:col-span-3">
                                 <InfoItem label="Observações do Suprido" value={request.prestacaoContas.notes || 'Nenhuma.'} />
                             </div>
                             
                             {isAdmin ? <ValidadorDocumentos request={request} /> : (
                                 <div className="overflow-x-auto border rounded-lg mt-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                         <thead className="bg-gray-50">
                                             <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <th className="px-4 py-2">Data</th>
                                                <th className="px-4 py-2">Descrição</th>
                                                <th className="px-4 py-2">Valor</th>
                                                <th className="px-4 py-2">Comprovante</th>
                                             </tr>
                                         </thead>
                                         <tbody className="bg-white divide-y divide-gray-200">
                                             {request.prestacaoContas.items.map(item => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-2 text-sm">{new Date(item.date + 'T00:00:00Z').toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-4 py-2 text-sm">{item.description}</td>
                                                    <td className="px-4 py-2 text-sm">R$ {item.amount.toFixed(2).replace('.', ',')}</td>
                                                    <td className="px-4 py-2 text-sm"><a href="#" className="text-tribunal-primary hover:underline">{item.receipt.name}</a></td>
                                                </tr>
                                             ))}
                                         </tbody>
                                    </table>
                                 </div>
                             )}

                             {isAdmin && <AnaliseInteligentePrestacao request={request} />}
                        </div>
                    )}
                    
                    {/* History */}
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Status</h3>
                        <ul className="space-y-2">
                            {request.history.map((h, i) => (
                                <li key={i} className="flex items-start text-sm">
                                    <div className="w-24 text-gray-500">{new Date(h.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}</div>
                                    <div className="flex-1 ml-4">
                                        <Badge status={h.status} />
                                        <span className="ml-2 text-gray-600">por {h.user}</span>
                                        {h.reason && <p className="text-xs text-gray-500 italic mt-1">Motivo: {h.reason}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    {renderAdminActions()}
                    <button type="button" onClick={closeDetails} className={`mt-3 sm:mt-0 ${isAdmin && isPrestacao ? 'sm:mr-3' : ''} w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50`}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestDetailsModal;
