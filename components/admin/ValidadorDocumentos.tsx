
import React from 'react';
import { FundRequest, ValidationResult } from '../../types';
import { useAppContext } from '../../hooks/useAppContext';
import { DocumentCheckIcon, ExclamationTriangleIcon, ArrowPathIcon } from '../../constants';

interface ValidadorDocumentosProps {
    request: FundRequest;
}

const ValidadorDocumentos: React.FC<ValidadorDocumentosProps> = ({ request }) => {
    const { validationResults } = useAppContext();
    const results = validationResults[request.id] || [];
    const prestacao = request.prestacaoContas;

    if (!prestacao) return null;

    const getResultForItem = (itemId: string): ValidationResult | undefined => {
        return results.find(r => r.itemId === itemId);
    };

    const StatusIndicator: React.FC<{ result?: ValidationResult }> = ({ result }) => {
        if (!result || result.status === 'processing') {
            return <div className="flex items-center text-sm text-gray-500"><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> Processando...</div>;
        }
        if (result.status === 'error') {
            return <div className="flex items-center text-sm text-red-600"><ExclamationTriangleIcon className="w-4 h-4 mr-2" /> Erro na Extração</div>;
        }
        if (result.discrepancies.length > 0) {
            return <div className="flex items-center text-sm text-yellow-600"><ExclamationTriangleIcon className="w-4 h-4 mr-2" /> Divergência</div>;
        }
        return <div className="flex items-center text-sm text-green-600"><DocumentCheckIcon className="w-4 h-4 mr-2" /> Validado</div>;
    };

    const renderExtractedData = (result: ValidationResult | undefined, field: 'amount' | 'date') => {
        if (!result || result.status !== 'validated') return <span className="text-gray-400">-</span>;
        
        const value = result.extractedData?.[field];
        const hasDiscrepancy = result.discrepancies.includes(field);
        const discrepancyClass = hasDiscrepancy ? 'bg-yellow-100 text-yellow-800 font-bold p-1 rounded' : '';

        if (field === 'amount') {
            // FIX: Check if value is a number before calling toFixed to prevent runtime error.
            return <span className={discrepancyClass}>{typeof value === 'number' ? `R$ ${value.toFixed(2).replace('.', ',')}`: 'N/A'}</span>;
        }
        // Assuming date is a string
        // FIX: Check if value is a string before calling includes to prevent runtime error.
        const formattedDate = typeof value === 'string' && value ? (value.includes('/') ? value : new Date(value + 'T00:00:00Z').toLocaleDateString('pt-BR')) : 'N/A';
        return <span className={discrepancyClass}>{formattedDate}</span>;
    };


    return (
        <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Análise Inteligente de Documentos</h3>
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3" colSpan={4}>Dados Informados pelo Suprido</th>
                            <th className="px-4 py-3 border-l" colSpan={2}>Dados Extraídos (IA)</th>
                            <th className="px-4 py-3 border-l">Status</th>
                        </tr>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                            <th className="px-4 py-2">Data</th>
                            <th className="px-4 py-2">Descrição</th>
                            <th className="px-4 py-2 text-right">Valor</th>
                            <th className="px-4 py-2">Comprovante</th>
                            <th className="px-4 py-2 border-l">Data Extraída</th>
                            <th className="px-4 py-2 text-right">Valor Extraído</th>
                            <th className="px-4 py-2 border-l"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {prestacao.items.map(item => {
                            const result = getResultForItem(item.id);
                            const hasAmountDiscrepancy = result?.discrepancies.includes('amount');
                            const hasDateDiscrepancy = result?.discrepancies.includes('date');
                            return (
                                <tr key={item.id}>
                                    <td className={`px-4 py-2 text-sm ${hasDateDiscrepancy ? 'bg-yellow-50' : ''}`}>{new Date(item.date + 'T00:00:00Z').toLocaleDateString('pt-BR')}</td>
                                    <td className="px-4 py-2 text-sm">{item.description}</td>
                                    <td className={`px-4 py-2 text-sm text-right ${hasAmountDiscrepancy ? 'bg-yellow-50' : ''}`}>R$ {item.amount.toFixed(2).replace('.', ',')}</td>
                                    <td className="px-4 py-2 text-sm"><a href="#" className="text-tribunal-primary hover:underline">{item.receipt.name}</a></td>
                                    <td className="px-4 py-2 text-sm border-l">{renderExtractedData(result, 'date')}</td>
                                    <td className="px-4 py-2 text-sm text-right">{renderExtractedData(result, 'amount')}</td>
                                    <td className="px-4 py-2 text-sm border-l"><StatusIndicator result={result} /></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ValidadorDocumentos;
