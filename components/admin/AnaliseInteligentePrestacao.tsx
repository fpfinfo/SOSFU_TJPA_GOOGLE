
import React, { useState, useEffect } from 'react';
import { FundRequest } from '../../types';
import { analyzePrestacaoContas } from '../../utils/ai';
import ReactMarkdown from 'react-markdown';


interface AnaliseInteligentePrestacaoProps {
    request: FundRequest;
}

const AnaliseInteligentePrestacao: React.FC<AnaliseInteligentePrestacaoProps> = ({ request }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!request.prestacaoContas) {
            setIsLoading(false);
            return;
        }

        const fetchAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await analyzePrestacaoContas(request, request.prestacaoContas!);
                setAnalysis(result);
            } catch (err) {
                setError('Falha ao obter análise da IA.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [request]);

    if (!request.prestacaoContas) return null;

    if (isLoading) {
        return <div className="text-center p-8 text-gray-500">Analisando Prestação de Contas com IA...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }
    
    if (!analysis) {
        return <div className="text-center p-8 text-gray-500">Nenhuma análise de prestação de contas disponível.</div>;
    }

    return (
        <div className="pt-6 border-t">
             <h3 className="text-lg font-semibold text-gray-800 mb-2">Análise Inteligente da Prestação de Contas (IA)</h3>
             <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{analysis}</ReactMarkdown>
             </div>
        </div>
    );
};

export default AnaliseInteligentePrestacao;
