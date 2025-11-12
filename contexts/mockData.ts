
import { FundRequest, User, UserRole, RequestStatus, Message, CatalogItem } from '../types';

const today = new Date();
const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
const toIso = (date: Date) => date.toISOString();
const toYmd = (date: Date) => date.toISOString().split('T')[0];

export const MOCK_USERS: User[] = [
    {
        id: 'user-1',
        name: 'João da Silva (Suprido)',
        email: 'joao.silva@example.com',
        role: UserRole.SUPRIDO,
        profileData: {
            fullName: 'João da Silva Pereira',
            cpf: '111.222.333-44',
            cargo: 'Técnico Judiciário',
            lotacao: 'Vara Cível de Belém',
            telefone: '(91) 98888-7777',
            setor: 'Cartório',
            municipio: 'Belém',
            gestorResponsavel: 'Maria Oliveira',
            comarcaLotacao: 'Belém',
            bancoNome: 'Banco do Brasil',
            bancoCodigo: '001',
            agencia: '1234-5',
            conta: '98765-4',
            tipoConta: 'Corrente',
        }
    },
    {
        id: 'user-2',
        name: 'Admin do Sistema',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        profileData: {
            fullName: 'Administrador do Sistema',
            cpf: '000.000.000-00',
            cargo: 'Analista de Sistemas',
            lotacao: 'Departamento de Tecnologia',
            telefone: '(91) 99999-9999',
            setor: 'DTI',
            municipio: 'Belém',
            gestorResponsavel: 'Diretoria Geral',
            comarcaLotacao: 'Belém',
            bancoNome: '',
            bancoCodigo: '',
            agencia: '',
            conta: '',
            tipoConta: 'Corrente',
        }
    }
];

export const MOCK_REQUESTS: FundRequest[] = [
    {
        id: 'SF-001',
        requester: 'João da Silva (Suprido)',
        submissionDate: toIso(addDays(today, -30)),
        status: RequestStatus.PRESTACAO_APROVADA,
        requestType: 'Material de Consumo',
        expenseType: 'Material de Limpeza',
        costCenter: 'CC-ADM-Geral',
        polo: 'Polo Belém',
        comarca: 'Belém',
        regiaoJudiciaria: '1ª Região',
        applicationPeriod: { start: toYmd(addDays(today, -28)), end: toYmd(addDays(today, -20)) },
        amount: 250.00,
        description: 'Compra de material de limpeza para o almoxarifado.',
        history: [
            { date: toIso(addDays(today, -30)), status: RequestStatus.ENVIADA_PARA_ANALISE, user: 'João da Silva (Suprido)' },
            { date: toIso(addDays(today, -29)), status: RequestStatus.APROVADA_PARA_CONCESSAO, user: 'Admin do Sistema' },
            { date: toIso(addDays(today, -15)), status: RequestStatus.PRESTACAO_ENVIADA, user: 'João da Silva (Suprido)' },
            { date: toIso(addDays(today, -14)), status: RequestStatus.PRESTACAO_APROVADA, user: 'Admin do Sistema' }
        ],
        prestacaoContas: {
            submittedDate: toIso(addDays(today, -15)),
            totalAmount: 245.50,
            notes: 'Sobraram R$ 4,50 que foram devolvidos.',
            items: [
                { id: 'SF-001-item-1', date: toYmd(addDays(today, -27)), description: 'Água Sanitária 5L', amount: 50.00, receipt: { name: 'nota1.pdf', size: 120 } },
                { id: 'SF-001-item-2', date: toYmd(addDays(today, -26)), description: 'Sacos de lixo 100L', amount: 195.50, receipt: { name: 'nota2.jpg', size: 345 } },
            ]
        }
    },
    {
        id: 'SF-002',
        requester: 'João da Silva (Suprido)',
        submissionDate: toIso(addDays(today, -10)),
        status: RequestStatus.PRESTACAO_ENVIADA,
        requestType: 'Viagens',
        expenseType: 'Diárias',
        costCenter: 'CC-Diligencias',
        polo: 'Polo Marabá',
        comarca: 'Marabá',
        regiaoJudiciaria: '4ª Região',
        applicationPeriod: { start: toYmd(addDays(today, -8)), end: toYmd(addDays(today, -5)) },
        amount: 800.00,
        description: 'Diárias para diligências na comarca de Parauapebas.',
        history: [
             { date: toIso(addDays(today, -10)), status: RequestStatus.ENVIADA_PARA_ANALISE, user: 'João da Silva (Suprido)' },
             { date: toIso(addDays(today, -9)), status: RequestStatus.APROVADA_PARA_CONCESSAO, user: 'Admin do Sistema' },
             { date: toIso(addDays(today, -2)), status: RequestStatus.PRESTACAO_ENVIADA, user: 'João da Silva (Suprido)' }
        ],
        prestacaoContas: {
            submittedDate: toIso(addDays(today, -2)),
            totalAmount: 789.90,
            notes: 'Despesas com alimentação e hospedagem.',
            items: [
                { id: 'SF-002-item-1', date: toYmd(addDays(today, -7)), description: 'Hospedagem Hotel', amount: 450.00, receipt: { name: 'hotel.pdf', size: 90 } },
                { id: 'SF-002-item-2', date: toYmd(addDays(today, -6)), description: 'Alimentação', amount: 339.90, receipt: { name: 'restaurante.png', size: 512 } },
            ]
        }
    },
    {
        id: 'SF-003',
        requester: 'João da Silva (Suprido)',
        submissionDate: toIso(addDays(today, -2)),
        status: RequestStatus.ENVIADA_PARA_ANALISE,
        requestType: 'Serviços de Terceiros',
        expenseType: 'Chaveiro',
        costCenter: 'CC-ADM-Geral',
        polo: 'Polo Belém',
        comarca: 'Ananindeua',
        regiaoJudiciaria: '1ª Região',
        applicationPeriod: { start: toYmd(addDays(today, 1)), end: toYmd(addDays(today, 2)) },
        amount: 150.00,
        description: 'Serviço de chaveiro para confecção de cópias de chaves da sala do arquivo.',
        history: [
            { date: toIso(addDays(today, -2)), status: RequestStatus.ENVIADA_PARA_ANALISE, user: 'João da Silva (Suprido)' }
        ]
    }
];

export const MOCK_MESSAGES: Message[] = [
    {
        id: 'msg-1',
        conversationId: 'Admin do Sistema_João da Silva (Suprido)',
        senderName: 'Admin do Sistema',
        content: 'Olá João, por favor verifique sua prestação de contas para a solicitação SF-002. A nota do restaurante parece estar com a data incorreta.',
        timestamp: toIso(addDays(today, -1)),
        isRead: false
    }
];

export const MOCK_CATALOG_ITEMS = {
    expenseTypes: [
        { id: 'et-1', name: 'Material de Limpeza' },
        { id: 'et-2', name: 'Diárias' },
        { id: 'et-3', name: 'Chaveiro' },
        { id: 'et-4', name: 'Material de Expediente' },
        { id: 'et-5', name: 'Passagens' },
    ],
    costCenters: [
        { id: 'cc-1', name: 'CC-ADM-Geral' },
        { id: 'cc-2', name: 'CC-Diligencias' },
        { id: 'cc-3', name: 'CC-TI' },
    ],
    polos: [
        { id: 'p-1', name: 'Polo Belém' },
        { id: 'p-2', name: 'Polo Marabá' },
        { id: 'p-3', name: 'Polo Santarém' },
    ],
    comarcas: [
        { id: 'c-1', name: 'Belém' },
        { id: 'c-2', name: 'Ananindeua' },
        { id: 'c-3', name: 'Marabá' },
        { id: 'c-4', name: 'Santarém' },
    ],
    regioesJudiciarias: [
        { id: 'r-1', name: '1ª Região' },
        { id: 'r-2', name: '2ª Região' },
        { id: 'r-3', name: '3ª Região' },
        { id: 'r-4', name: '4ª Região' },
    ]
};
