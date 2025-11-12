
export enum UserRole {
  SUPRIDO = 'Suprido',
  ADMIN = 'Admin do Sistema',
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
  PRESTACAO_EM_ANALISE = 'Prestação em Análise',
  PRESTACAO_DEVOLVIDA = 'Prestação Devolvida para Ajustes',
  PRESTACAO_CORRIGIDA = 'Prestação Corrigida',
  PRESTACAO_APROVADA = 'Prestação Aprovada',
  PRESTACAO_REPROVADA = 'Prestação Reprovada',

  // Alcance
  EM_ALCANCE = 'Em Alcance',
  ALCANCE_REGULARIZADO = 'Alcance Regularizado',
  
  // Finalização
  ARQUIVADO = 'Arquivado',
}


export interface Attachment {
  name: string;
  size: number; // in KB
}

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  receipt: Attachment;
}

export interface PrestacaoContas {
  submittedDate: string; // ISO string
  totalAmount: number;
  notes?: string;
  items: ExpenseItem[];
}

export interface HistoryItem {
  date: string; // ISO string
  status: RequestStatus;
  user: string;
  reason?: string;
}

export interface FundRequest {
  id: string;
  requester: string;
  submissionDate: string; // ISO string
  status: RequestStatus;
  requestType: string;
  expenseType: string;
  costCenter: string;
  polo: string;
  comarca: string;
  regiaoJudiciaria: string;
  applicationPeriod: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
  amount: number;
  description: string;
  attachment?: Attachment;
  history: HistoryItem[];
  prestacaoContas?: PrestacaoContas;
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
  name: string;
  email: string;
  role: UserRole;
  profileData: UserProfile;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export interface ExtractedData {
  amount?: number;
  date?: string; // Can be YYYY-MM-DD or DD/MM/YYYY
}

export interface ValidationResult {
  itemId: string;
  status: 'processing' | 'validated' | 'error';
  extractedData?: ExtractedData;
  discrepancies: Array<'amount' | 'date'>;
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
    recommendation: string;
    points_of_attention: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderName: string;
  content: string;
  timestamp: string; // ISO string
  isRead: boolean;
}

export interface Conversation {
  id: string; // e.g., "Admin_John Doe"
  participantName: string; // The other person
  lastMessage?: Message;
  unreadCount: number;
}

export interface CatalogItem {
    id: string;
    name: string;
    description?: string;
}
