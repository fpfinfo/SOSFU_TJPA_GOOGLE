export enum UserRole {
    SUPRIDO = 'Suprido',
    ADMIN = 'Admin do Sistema',
}

export interface UserProfile {
    fullName: string;
    cpf: string;
    cargo: string;
    lotacao: string;
    telefone: string;
    setor: string;
    municipio: string;
    gestorResponsavel: string;
    comarcaLotacao: string;
    bancoNome: string;
    bancoCodigo: string;
    agencia: string;
    conta: string;
    tipoConta: 'Corrente' | 'Poupança';
}

export interface User {
    id: string;
    name: string; // Profile Name (e.g., fabio.freitas)
    role: UserRole;
    email: string;
    profileData: UserProfile;
}

export enum RequestStatus {
    // Solicitação
    RASCUNHO = 'Rascunho',
    ENVIADA_PARA_ANALISE = 'Enviada para Análise',
    EM_ANALISE = 'Em Análise',
    DEVOLVIDA_PARA_AJUSTES = 'Devolvida para Ajustes',
    APROVADA_PARA_CONCESSAO = 'Aprovada para Concessão',
    REJEITADO = 'Rejeitado',

    // Execução
    RECURSO_LIBERADO = 'Recurso Liberado',
    EM_EXECUCAO = 'Em Execução',
    AGUARDANDO_PRESTACAO = 'Aguardando Prestação de Contas',
    
    // Prestação de Contas
    PRESTACAO_ENVIADA = 'Prestação Enviada',
    PRESTACAO_EM_ANALISE = 'PC em Análise',
    PRESTACAO_DEVOLVIDA = 'PC Devolvida',
    PRESTACAO_CORRIGIDA = 'PC Corrigida',
    PRESTACAO_APROVADA = 'PC Aprovada',
    PRESTACAO_REPROVADA = 'PC Reprovada',

    // Alcance
    EM_ALCANCE = 'Em Alcance',
    ALCANCE_REGULARIZADO = 'Alcance Regularizado',

    // Finalização
    ARQUIVADO = 'Arquivado',
}

export interface RequestHistoryItem {
    status: RequestStatus;
    date: string;
    user: string;
    reason?: string;
}

export interface Attachment {
    name: string;
    size: number; // in KB
}

export interface ExpenseItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    receipt: Attachment;
}

export interface PrestacaoContas {
    submittedDate: string;
    totalAmount: number;
    notes: string;
    items: ExpenseItem[];
}

export interface FundRequest {
    id: string;
    requester: string;
    submissionDate: string;
    status: RequestStatus;
    requestType: string;
    expenseType: string;
    costCenter: string;
    polo: string;
    comarca: string;
    regiaoJudiciaria: string;
    applicationPeriod: {
        start: string;
        end: string;
    };
    amount: number;
    description: string;
    attachment?: Attachment;
    history: RequestHistoryItem[];
    prestacaoContas?: PrestacaoContas;
}

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error';
}

export interface ManagedItem {
    id: string;
    name: string;
}

export type ManagedEntityType = 'expenseTypes' | 'costCenters' | 'polos' | 'comarcas' | 'regioesJudiciarias';

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderName: string;
    content: string;
    timestamp: number;
    isRead: boolean;
}

export interface Conversation {
    id: string;
    participantName: string;
    lastMessage?: ChatMessage;
    unreadCount: number;
}

export interface ExtractedData {
    amount?: number;
    date?: string;
    // other fields can be added here
}

export interface ValidationResult {
    itemId: string;
    status: 'processing' | 'validated' | 'error';
    extractedData?: ExtractedData;
    discrepancies: ('amount' | 'date')[];
}

export interface AiSuprimentoAnalysis {
    summary: string;
    compliance_check: {
        is_compliant: boolean;
        reason: string;
    };
    risk_assessment: {
        level: 'Baixo' | 'Médio' | 'Alto';
        reason: string;
    };
    recommendation: 'Aprovar' | 'Devolver para Ajustes' | 'Rejeitar';
    points_of_attention: string[];
}