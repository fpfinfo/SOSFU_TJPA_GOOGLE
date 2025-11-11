import { FundRequest, RequestStatus, User, UserRole, ManagedItem, ChatMessage, Conversation } from '../types';

export const MOCK_USERS: User[] = [
    { 
        id: 'user1', 
        name: 'fabio.freitas', 
        role: UserRole.SUPRIDO,
        email: 'fabio.freitas@tjpa.jus.br',
        profileData: {
            fullName: 'Suprido Pereira de Freitas',
            cpf: '793.050.832-34',
            cargo: 'ANALISTA JUDICIÁRIO',
            lotacao: 'SOSFU',
            telefone: '91982188699',
            setor: 'SEPLAN',
            municipio: 'Belém',
            gestorResponsavel: 'Ingrid Alencar',
            comarcaLotacao: 'Belém', // Default value
            bancoNome: 'Banpará',
            bancoCodigo: '037',
            agencia: '0026',
            conta: '1212-8',
            tipoConta: 'Corrente',
        } 
    },
    { 
        id: 'user2', 
        name: 'Carlos Santos', 
        role: UserRole.SUPRIDO,
        email: 'carlos.santos@tjpa.jus.br',
        profileData: {
            fullName: 'Carlos Eduardo Santos',
            cpf: '987.654.321-99',
            cargo: 'TÉCNICO JUDICIÁRIO',
            lotacao: 'GABINETE',
            telefone: '91912345678',
            setor: 'PRESIDÊNCIA',
            municipio: 'Ananindeua',
            gestorResponsavel: 'Ingrid Alencar',
            comarcaLotacao: 'Ananindeua',
            bancoNome: 'Banco do Brasil',
            bancoCodigo: '001',
            agencia: '1234',
            conta: '5678-9',
            tipoConta: 'Corrente',
        }
    },
    { 
        id: 'admin1', 
        name: 'Gestor TJPA', 
        role: UserRole.ADMIN,
        email: 'gestor.sosfu@tjpa.jus.br',
        profileData: {
            fullName: 'Gestor do Sistema SOSFU',
            cpf: '000.000.000-00',
            cargo: 'DIRETOR DE DEPARTAMENTO',
            lotacao: 'SOSFU',
            telefone: '91900000000',
            setor: 'SEPLAN',
            municipio: 'Belém',
            gestorResponsavel: '-',
            comarcaLotacao: 'Belém',
            bancoNome: '-',
            bancoCodigo: '-',
            agencia: '-',
            conta: '-',
            tipoConta: 'Corrente',
        }
    },
];

export const MOCK_EXPENSE_TYPES: ManagedItem[] = [
    { id: 'et1', name: 'Diárias - País' },
    { id: 'et2', name: 'Material de Consumo' },
    { id: 'et3', name: 'Passagens e Despesas de Locomoção' },
    { id: 'et4', name: 'Serviços de Consultoria' },
];
export const MOCK_COST_CENTERS: ManagedItem[] = [
    { id: 'cc1', name: 'Presidência' },
    { id: 'cc2', name: 'Corregedoria' },
    { id: 'cc3', name: 'Tecnologia da Informação' },
    { id: 'cc4', name: 'Gestão de Pessoas' },
];
export const MOCK_POLOS: ManagedItem[] = [
    { id: 'p1', name: 'Polo Belém' },
    { id: 'p2', name: 'Polo Santarém' },
    { id: 'p3', name: 'Polo Marabá' },
];
export const MOCK_COMARCAS: ManagedItem[] = [
    { id: 'c1', name: 'Belém' },
    { id: 'c2', name: 'Santarém' },
    { id: 'c3', name: 'Marabá' },
    { id: 'c4', name: 'Ananindeua' },
];
export const MOCK_REGIOES: ManagedItem[] = [
    { id: 'r1', name: '1ª Região (Guajará)' },
    { id: 'r2', name: '2ª Região (Rio Caeté)' },
    { id: 'r3', name: '3ª Região (Marajó)' },
];

export const MOCK_REQUESTS: FundRequest[] = [
    {
        id: 'SF001',
        requester: 'fabio.freitas',
        submissionDate: '2023-10-01T09:00:00Z',
        status: RequestStatus.APROVADA_PARA_CONCESSAO,
        requestType: 'Viagens',
        expenseType: 'Diárias - País',
        costCenter: 'Presidência',
        polo: 'Polo Belém',
        comarca: 'Belém',
        regiaoJudiciaria: '1ª Região (Guajará)',
        applicationPeriod: { start: '2023-10-10', end: '2023-10-15' },
        amount: 1500.00,
        description: 'Viagem para participação em congresso nacional de magistrados.',
        attachment: { name: 'oficio_convocacao.pdf', size: 256 },
        history: [
            { status: RequestStatus.ENVIADA_PARA_ANALISE, date: '2023-10-01T09:00:00Z', user: 'fabio.freitas' },
            { status: RequestStatus.EM_ANALISE, date: '2023-10-01T14:00:00Z', user: 'Gestor TJPA' },
            { status: RequestStatus.APROVADA_PARA_CONCESSAO, date: '2023-10-02T11:00:00Z', user: 'Gestor TJPA' },
        ],
    },
    {
        id: 'SF002',
        requester: 'Carlos Santos',
        submissionDate: '2023-09-20T15:30:00Z',
        status: RequestStatus.DEVOLVIDA_PARA_AJUSTES,
        requestType: 'Material de Consumo',
        expenseType: 'Material de Consumo',
        costCenter: 'Tecnologia da Informação',
        polo: 'Polo Belém',
        comarca: 'Ananindeua',
        regiaoJudiciaria: '1ª Região (Guajará)',
        applicationPeriod: { start: '2023-09-25', end: '2023-09-30' },
        amount: 850.50,
        description: 'Compra de material de escritório e suprimentos de informática para o setor.',
        history: [
            { status: RequestStatus.ENVIADA_PARA_ANALISE, date: '2023-09-20T15:30:00Z', user: 'Carlos Santos' },
            { status: RequestStatus.EM_ANALISE, date: '2023-09-21T10:00:00Z', user: 'Gestor TJPA' },
            { status: RequestStatus.DEVOLVIDA_PARA_AJUSTES, date: '2023-09-21T16:00:00Z', user: 'Gestor TJPA', reason: 'Falta detalhamento dos itens a serem adquiridos na justificativa.' },
        ],
    },
    {
        id: 'SF003',
        requester: 'fabio.freitas',
        submissionDate: '2023-10-20T11:00:00Z',
        status: RequestStatus.PRESTACAO_ENVIADA,
        requestType: 'Viagens',
        expenseType: 'Passagens e Despesas de Locomoção',
        costCenter: 'Corregedoria',
        polo: 'Polo Santarém',
        comarca: 'Santarém',
        regiaoJudiciaria: '2ª Região (Rio Caeté)',
        applicationPeriod: { start: '2023-10-22', end: '2023-10-24' },
        amount: 1200.00,
        description: 'Viagem para correição extraordinária na comarca de Santarém.',
        prestacaoContas: {
            submittedDate: '2023-10-25T10:00:00Z',
            totalAmount: 1155.75,
            notes: 'Viagem tranquila, despesas conforme o planejado. Sobra de R$ 44,25 a ser devolvida.',
            items: [
                { id: 'exp1', date: '2023-10-22', description: 'Almoço equipe correição', amount: 85.50, receipt: { name: 'almoco.pdf', size: 120 } },
                { id: 'exp2', date: '2023-10-22', description: 'Táxi Aeroporto-Hotel', amount: 60.00, receipt: { name: 'taxi_ida.jpg', size: 250 } },
                { id: 'exp3', date: '2023-10-23', description: 'Jantar', amount: 95.25, receipt: { name: 'jantar.png', size: 310 } },
                { id: 'exp4', date: '2023-10-24', description: 'Táxi Hotel-Aeroporto', amount: 65.00, receipt: { name: 'taxi_volta.pdf', size: 115 } },
                { id: 'exp5', date: '2023-10-24', description: 'Passagem Aérea (Bel-Stm-Bel)', amount: 850.00, receipt: { name: 'passagem.pdf', size: 450 } },
            ]
        },
        history: [
            { status: RequestStatus.ENVIADA_PARA_ANALISE, date: '2023-10-20T11:00:00Z', user: 'fabio.freitas' },
            { status: RequestStatus.APROVADA_PARA_CONCESSAO, date: '2023-10-20T17:00:00Z', user: 'Gestor TJPA' },
            { status: RequestStatus.RECURSO_LIBERADO, date: '2023-10-21T10:00:00Z', user: 'Gestor TJPA' },
            { status: RequestStatus.EM_EXECUCAO, date: '2023-10-22T08:00:00Z', user: 'Sistema' },
            { status: RequestStatus.AGUARDANDO_PRESTACAO, date: '2023-10-25T00:00:00Z', user: 'Sistema' },
            { status: RequestStatus.PRESTACAO_ENVIADA, date: '2023-10-25T10:00:00Z', user: 'fabio.freitas' },
        ],
    },
    {
        id: 'SF004',
        requester: 'Carlos Santos',
        submissionDate: '2023-10-22T14:20:00Z',
        status: RequestStatus.EM_ALCANCE,
        requestType: 'Serviços de Terceiros',
        expenseType: 'Serviços de Consultoria',
        costCenter: 'Gestão de Pessoas',
        polo: 'Polo Marabá',
        comarca: 'Marabá',
        regiaoJudiciaria: '3ª Região (Marajó)',
        applicationPeriod: { start: '2023-09-01', end: '2023-09-15' },
        amount: 3000.00,
        description: 'Contratação de consultoria para treinamento de equipes.',
        history: [
            { status: RequestStatus.AGUARDANDO_PRESTACAO, date: '2023-09-16T00:00:00Z', user: 'Sistema' },
            { status: RequestStatus.EM_ALCANCE, date: '2023-10-16T00:00:00Z', user: 'Sistema', reason: 'Prazo para prestação de contas expirado.' },
        ],
    },
];


export const MOCK_MESSAGES: ChatMessage[] = [
    { id: 'msg1', conversationId: 'fabio.freitas_Admin do Sistema', senderName: 'fabio.freitas', content: 'Bom dia! Teria como verificar a minha solicitação SF001?', timestamp: Date.now() - 2 * 60 * 60 * 1000, isRead: true },
    { id: 'msg2', conversationId: 'fabio.freitas_Admin do Sistema', senderName: 'Admin do Sistema', content: 'Bom dia. Já está em análise, em breve teremos um retorno.', timestamp: Date.now() - 1 * 60 * 60 * 1000, isRead: true },
    { id: 'msg3', conversationId: 'Carlos Santos_Admin do Sistema', senderName: 'Admin do Sistema', content: 'Carlos, sua solicitação SF004 está com a prestação de contas pendente. Por favor, regularizar.', timestamp: Date.now() - 5 * 60 * 1000, isRead: false },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
    { id: 'fabio.freitas_Admin do Sistema', participantName: 'fabio.freitas', lastMessage: MOCK_MESSAGES[1], unreadCount: 0 },
    { id: 'Carlos Santos_Admin do Sistema', participantName: 'Carlos Santos', lastMessage: MOCK_MESSAGES[2], unreadCount: 1 },
];