
import React, { useState, useEffect } from 'react';
import { FundRequest, AiSuprimentoAnalysis } from '../../types';
import { analyzeSuprimentoRequest } from '../../utils/ai';
import { CheckIcon, XMarkIcon } from '../../constants';

interface AnaliseInteligenteSuprimentoProps {
    request: FundRequest;
}

const RiskBadge: React.FC<{ level: 'Baixo' | 'Médio' | 'Alto' }> = ({ level }) => {
    const styles = {
        'Baixo': 'bg-green-100 text-green-800',
        'Médio': 'bg-yellow-100 text-yellow-800',
        'Alto': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[level]}`}>{level}</span>;
};


const AnaliseInteligenteSuprimento: React.FC<AnaliseInteligenteSuprimentoProps> = ({ request }) => {
    const [analysis, setAnalysis] = useState<AiSuprimentoAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await analyzeSuprimentoRequest(request);
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

    if (isLoading) {
        return <div className="text-center p-8 text-gray-500">Analisando com IA...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }
    
    if (!analysis) {
        return <div className="text-center p-8 text-gray-500">Nenhuma análise disponível.</div>;
    }

    return (
        <div className="pt-6 border-t">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Análise Inteligente (IA)</h3>
             <div className="space-y-4 text-sm">
                <p><strong className="font-semibold text-gray-700">Resumo:</strong> {analysis.summary}</p>
                <div>
                    <strong className="font-semibold text-gray-700">Conformidade:</strong>
                    <span className={`ml-2 inline-flex items-center font-medium ${analysis.compliance_check.is_compliant ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.compliance_check.is_compliant ? <CheckIcon className="w-4 h-4 mr-1"/> : <XMarkIcon className="w-4 h-4 mr-1"/>}
                        {analysis.compliance_check.is_compliant ? 'Em conformidade' : 'Não conforme'}.
                    </span>
                     <p className="text-xs text-gray-500 pl-4">{analysis.compliance_check.reason}</p>
                </div>
                 <div>
                    <strong className="font-semibold text-gray-700">Risco:</strong>
                    <span className="ml-2"><RiskBadge level={analysis.risk_assessment.level} /></span>
                    <p className="text-xs text-gray-500 pl-4">{analysis.risk_assessment.reason}</p>
                </div>
                 <p><strong className="font-semibold text-gray-700">Recomendação da IA:</strong> {analysis.recommendation}</p>

                {analysis.points_of_attention && analysis.points_of_attention.length > 0 && (
                     <div>
                        <strong className="font-semibold text-gray-700">Pontos de Atenção:</strong>
                        <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                            {analysis.points_of_attention.map((point, index) => <li key={index}>{point}</li>)}
                        </ul>
                    </div>
                )}
             </div>
        </div>
    );
};

export default AnaliseInteligenteSuprimento;
