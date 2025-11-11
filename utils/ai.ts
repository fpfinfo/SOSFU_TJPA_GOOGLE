
import { GoogleGenAI, Type } from "@google/genai";
import { AiSuprimentoAnalysis, FundRequest, PrestacaoContas } from "../types";

// Do not instantiate here, get it from context or pass as argument if key changes
// For this app, we can assume the key is stable after login
const getAiClient = () => {
    // API key MUST be obtained exclusively from the environment variable process.env.API_KEY
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set for Gemini API.");
        // Return a mock client or throw an error to prevent app crash
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "Um resumo conciso da solicitação de suprimento de fundos."
        },
        compliance_check: {
            type: Type.OBJECT,
            properties: {
                is_compliant: { type: Type.BOOLEAN, description: "Indica se a solicitação parece estar em conformidade com as regras gerais." },
                reason: { type: Type.STRING, description: "Breve explicação sobre a conformidade ou não conformidade." }
            },
            required: ["is_compliant", "reason"]
        },
        risk_assessment: {
            type: Type.OBJECT,
            properties: {
                level: { type: Type.STRING, description: "Nível de risco (Baixo, Médio, Alto) associado à solicitação." },
                reason: { type: Type.STRING, description: "Justificativa para o nível de risco atribuído." }
            },
            required: ["level", "reason"]
        },
        recommendation: {
            type: Type.STRING,
            description: "Recomendação final para o gestor (Aprovar, Devolver para Ajustes, Rejeitar)."
        },
        points_of_attention: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de pontos que merecem atenção especial do analista."
        }
    },
    required: ["summary", "compliance_check", "risk_assessment", "recommendation", "points_of_attention"]
};


export const analyzeSuprimentoRequest = async (request: FundRequest): Promise<AiSuprimentoAnalysis | null> => {
    const ai = getAiClient();
    if (!ai) return null;

    const prompt = `
        Você é um assistente especialista em análise de conformidade e risco para solicitações de suprimento de fundos no setor público brasileiro, especificamente para um Tribunal de Justiça.
        Analise a seguinte solicitação e forneça uma avaliação estruturada em JSON.

        **Dados da Solicitação:**
        - **ID:** ${request.id}
        - **Solicitante:** ${request.requester}
        - **Tipo de Suprimento:** ${request.requestType}
        - **Elemento de Despesa:** ${request.expenseType}
        - **Centro de Custo:** ${request.costCenter}
        - **Valor Solicitado:** R$ ${request.amount.toFixed(2)}
        - **Período de Aplicação:** ${request.applicationPeriod.start} a ${request.applicationPeriod.end}
        - **Justificativa:** ${request.description}

        **Regras a Considerar:**
        1. A justificativa deve ser clara, detalhada e compatível com o valor e o tipo de despesa.
        2. Despesas com "Diárias" e "Passagens" devem ser para viagens a serviço.
        3. Valores elevados para "Material de Consumo" podem indicar fracionamento de despesa e devem ser sinalizados.
        4. O período de aplicação deve ser futuro e razoável.
        5. A combinação de tipo de despesa, valor e justificativa deve ser coerente.

        **Tarefa:**
        Retorne um JSON com a análise, seguindo o schema fornecido. Seja objetivo e direto em suas avaliações.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Basic Text Task
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AiSuprimentoAnalysis;

    } catch (error) {
        console.error("Error analyzing suprimento request with Gemini:", error);
        return null;
    }
};

export const analyzePrestacaoContas = async (request: FundRequest, prestacao: PrestacaoContas): Promise<string | null> => {
     const ai = getAiClient();
    if (!ai) return null;

    const prompt = `
        Você é um assistente especialista em análise de prestação de contas de suprimento de fundos para um Tribunal de Justiça.
        Analise a seguinte prestação de contas e forneça um resumo e pontos de atenção.

        **Dados da Solicitação Original:**
        - **ID da Solicitação:** ${request.id}
        - **Elemento de Despesa:** ${request.expenseType}
        - **Valor Aprovado:** R$ ${request.amount.toFixed(2)}
        - **Justificativa Original:** ${request.description}

        **Dados da Prestação de Contas:**
        - **Valor Total Gasto:** R$ ${prestacao.totalAmount.toFixed(2)}
        - **Observações do Suprido:** ${prestacao.notes}
        - **Itens de Despesa:**
        ${prestacao.items.map(item => `  - Data: ${item.date}, Descrição: ${item.description}, Valor: R$ ${item.amount.toFixed(2)}`).join('\n')}

        **Regras a Considerar:**
        1. As despesas listadas devem ser compatíveis com o Elemento de Despesa e a justificativa original.
        2. As datas das despesas devem estar dentro do período de aplicação da solicitação.
        3. O valor total gasto não deve exceder o valor aprovado.
        4. Verifique se há despesas incomuns ou que necessitem de maior escrutínio.

        **Tarefa:**
        Escreva um parágrafo de resumo da análise e, se houver, uma lista de "Pontos de Atenção" para o gestor. Se estiver tudo em ordem, afirme isso. A resposta deve ser em texto simples (markdown).
    `;

    try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Basic Text Task
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error("Error analyzing prestação de contas with Gemini:", error);
        return null;
    }
};
