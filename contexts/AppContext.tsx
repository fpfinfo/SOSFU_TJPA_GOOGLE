
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { 
    User, 
    UserRole, 
    FundRequest, 
    RequestStatus, 
    ToastMessage, 
    ManagedItem,
    ManagedEntityType,
    PrestacaoContas,
    ExpenseItem,
    ChatMessage,
    Conversation,
    ValidationResult,
    UserProfile,
} from '../types';
import { 
    MOCK_USERS, 
    MOCK_REQUESTS, 
    MOCK_EXPENSE_TYPES, 
    MOCK_COST_CENTERS, 
    MOCK_POLOS, 
    MOCK_COMARCAS, 
    MOCK_REGIOES,
    MOCK_MESSAGES,
    MOCK_CONVERSATIONS
} from './mockData';
import supabase from '../supabaseClient';
import { simulateOcrExtraction } from '../utils/ocr';


// Helper function for managed entities
const createManagedEntityState = (initialItems: ManagedItem[]) => {
    const [items, setItems] = useState<ManagedItem[]>(initialItems);
    // In a real app, these would be async and call an API (Supabase)
    const add = async (name: string) => { 
        const newItem = { id: `new_${Date.now()}`, name };
        setItems(prev => [...prev, newItem]);
        // await supabase.from('...').insert({ name });
    };
    const update = async (id: string, name: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, name } : item));
        // await supabase.from('...').update({ name }).eq('id', id);
    };
    const deleteItem = async (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        // await supabase.from('...').delete().eq('id', id);
    };
    return { items, add, update, delete: deleteItem };
};

export interface Filters {
    status: RequestStatus[];
    expenseType: string[];
    startDate: string;
    endDate: string;
    sortBy: 'submissionDate' | 'amount';
    sortDirection: 'asc' | 'desc';
}

export interface AppContextType {
    // Auth
    currentUser: User | null;
    login: (role: UserRole) => void;
    logout: () => void;
    // Data
    requests: FundRequest[];
    filteredRequests: FundRequest[];
    // Modals
    selectedRequest: FundRequest | null;
    viewDetails: (request: FundRequest) => void;
    closeDetails: () => void;
    prestacaoModalRequest: FundRequest | null;
    openPrestacaoModal: (request: FundRequest) => void;
    closePrestacaoModal: () => void;
    reasonModal: { isOpen: boolean; props: any };
    openReasonModal: (props: any) => void;
    closeReasonModal: () => void;
    // Actions
    createRequest: (newRequestData: Omit<FundRequest, 'id' | 'requester' | 'submissionDate' | 'status' | 'history'>) => void;
    updateRequestStatus: (id: string, status: RequestStatus, reason?: string) => void;
    submitPrestacaoContas: (requestId: string, prestacaoData: Omit<PrestacaoContas, 'submittedDate' | 'items'> & { items: Omit<ExpenseItem, 'id'>[] }) => void;
    updateUserProfile: (newProfileData: UserProfile) => void;
    // Toast
    toast: ToastMessage | null;
    showToast: (message: string, type: 'success' | 'error') => void;
    closeToast: () => void;
    // Filters
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    // Managed Entities
    expenseTypes: ManagedItem[];
    costCenters: ManagedItem[];
    polos: ManagedItem[];
    comarcas: ManagedItem[];
    regioesJudiciarias: ManagedItem[];
    managedEntities: Record<ManagedEntityType, { items: ManagedItem[]; add: (name: string) => Promise<void>; update: (id: string, name: string) => Promise<void>; delete: (id: string) => Promise<void>; }>;
    // Chat
    isChatOpen: boolean;
    toggleChat: () => void;
    unreadMessagesCount: number;
    conversations: Conversation[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    messages: ChatMessage[];
    sendMessage: (content: string) => void;
    startChat: (userName: string) => void;
    // Validation
    validationResults: Record<string, ValidationResult[]>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    // State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [requests, setRequests] = useState<FundRequest[]>([]);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
    const [prestacaoModalRequest, setPrestacaoModalRequest] = useState<FundRequest | null>(null);
    const [reasonModal, setReasonModal] = useState({ isOpen: false, props: {} });
    const [filters, setFilters] = useState<Filters>({ status: [], expenseType: [], startDate: '', endDate: '', sortBy: 'submissionDate', sortDirection: 'desc' });
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
    const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});

    // Managed Entities Hooks
    const expenseTypesState = createManagedEntityState(MOCK_EXPENSE_TYPES);
    const costCentersState = createManagedEntityState(MOCK_COST_CENTERS);
    const polosState = createManagedEntityState(MOCK_POLOS);
    const comarcasState = createManagedEntityState(MOCK_COMARCAS);
    const regioesState = createManagedEntityState(MOCK_REGIOES);

    const managedEntities = {
        expenseTypes: expenseTypesState,
        costCenters: costCentersState,
        polos: polosState,
        comarcas: comarcasState,
        regioesJudiciarias: regioesState,
    };

    useEffect(() => {
        // Simulating data loading
        if (supabase) {
            // Fetch initial data from Supabase
        } else {
            // Use mock data if Supabase is not configured
            setRequests(MOCK_REQUESTS);
        }
    }, []);

    // Memoized filtered requests
    const filteredRequests = useMemo(() => {
        let filtered = currentUser?.role === UserRole.ADMIN 
            ? requests 
            : requests.filter(r => r.requester === currentUser?.name);

        if (filters.status.length > 0) {
            filtered = filtered.filter(r => filters.status.includes(r.status));
        }
        if (filters.expenseType.length > 0) {
            filtered = filtered.filter(r => filters.expenseType.includes(r.expenseType));
        }
        if (filters.startDate) {
            filtered = filtered.filter(r => new Date(r.submissionDate) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            filtered = filtered.filter(r => new Date(r.submissionDate) <= new Date(filters.endDate));
        }

        return filtered.sort((a, b) => {
            const aValue = a[filters.sortBy];
            const bValue = b[filters.sortBy];
            if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [requests, filters, currentUser]);

    // Functions
    const showToast = (message: string, type: 'success' | 'error') => {
        const id = new Date().toISOString();
        setToast({ id, message, type });
        setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 5000);
    };
    const closeToast = () => setToast(null);

    const login = (role: UserRole) => {
        const userToLogin = MOCK_USERS.find(u => u.role === role);
        setCurrentUser(userToLogin || null);
    };
    const logout = () => setCurrentUser(null);
    
    const viewDetails = (request: FundRequest) => setSelectedRequest(request);
    const closeDetails = () => setSelectedRequest(null);
    const openPrestacaoModal = (request: FundRequest) => setPrestacaoModalRequest(request);
    const closePrestacaoModal = () => setPrestacaoModalRequest(null);

    const openReasonModal = (props: any) => setReasonModal({ isOpen: true, props });
    const closeReasonModal = () => setReasonModal({ isOpen: false, props: {} });
    
    const addHistory = (request: FundRequest, status: RequestStatus, reason?: string): FundRequest => {
        return {
            ...request,
            history: [...request.history, { status, date: new Date().toISOString(), user: currentUser?.name || 'Sistema', reason }]
        };
    };

    const createRequest = (newRequestData: Omit<FundRequest, 'id' | 'requester' | 'submissionDate' | 'status' | 'history'>) => {
        if (!currentUser) return;
        const newRequest: FundRequest = {
            id: `SF${String(requests.length + 1).padStart(3, '0')}`,
            requester: currentUser.name,
            submissionDate: new Date().toISOString(),
            status: RequestStatus.ENVIADA_PARA_ANALISE,
            history: [],
            ...newRequestData,
        };
        newRequest.history.push({ status: newRequest.status, date: newRequest.submissionDate, user: currentUser.name });
        setRequests(prev => [newRequest, ...prev]);
        showToast('Solicitação enviada com sucesso!', 'success');
    };

    const updateRequestStatus = (id: string, status: RequestStatus, reason?: string) => {
        setRequests(prev => prev.map(r => r.id === id ? addHistory({ ...r, status }, status, reason) : r));
        showToast(`Status atualizado para ${status}`, 'success');
    };
    
    const submitPrestacaoContas = (
        requestId: string,
        prestacaoData: Omit<PrestacaoContas, 'submittedDate' | 'items'> & { items: Omit<ExpenseItem, 'id'>[] }
    ) => {
        setRequests(prev => {
            const updatedRequests = prev.map(r => {
                if (r.id === requestId) {
                    const newStatus = RequestStatus.PRESTACAO_ENVIADA;
                    const newPrestacao: PrestacaoContas = {
                        submittedDate: new Date().toISOString(),
                        totalAmount: prestacaoData.totalAmount,
                        notes: prestacaoData.notes,
                        items: prestacaoData.items.map((item, index) => ({ ...item, id: `exp_${requestId}_${index}` })),
                    };
                    return addHistory({ ...r, status: newStatus, prestacaoContas: newPrestacao }, newStatus);
                }
                return r;
            });

            // Trigger validation after state update
            const updatedRequest = updatedRequests.find(r => r.id === requestId);
            if (updatedRequest?.prestacaoContas) {
                triggerValidation(updatedRequest);
            }
            return updatedRequests;
        });
        showToast('Prestação de contas enviada com sucesso!', 'success');
    };

    const updateUserProfile = (newProfileData: UserProfile) => {
        if (!currentUser) return;
        
        const updatedUser = {
            ...currentUser,
            profileData: newProfileData,
        };
        
        setCurrentUser(updatedUser);
        
        // In this mock setup, we don't persist it back to the MOCK_USERS array,
        // so changes will be lost on logout/login. A real app would save this to a DB.
    };

    const triggerValidation = (request: FundRequest) => {
        if (!request.prestacaoContas) return;
        
        const initialResults: ValidationResult[] = request.prestacaoContas.items.map(item => ({
            itemId: item.id,
            status: 'processing',
            discrepancies: [],
        }));
        setValidationResults(prev => ({ ...prev, [request.id]: initialResults }));

        request.prestacaoContas.items.forEach(async (item) => {
            const extractedData = await simulateOcrExtraction(item);
            
            const discrepancies: ('amount' | 'date')[] = [];
            if (extractedData.amount !== undefined && extractedData.amount !== item.amount) {
                discrepancies.push('amount');
            }

            const originalDate = new Date(item.date + 'T00:00:00Z').toLocaleDateString('pt-BR');
            const extractedDateStr = extractedData.date
                ? (extractedData.date.includes('/') ? extractedData.date : new Date(extractedData.date + 'T00:00:00Z').toLocaleDateString('pt-BR'))
                : '';

            if (extractedData.date !== undefined && originalDate !== extractedDateStr) {
                discrepancies.push('date');
            }

            const finalResult: ValidationResult = {
                itemId: item.id,
                status: Object.keys(extractedData).length > 0 ? 'validated' : 'error',
                extractedData,
                discrepancies,
            };

            setValidationResults(prev => {
                const currentRequestResults = prev[request.id] || [];
                const updatedResults = currentRequestResults.map(r => r.itemId === item.id ? finalResult : r);
                return { ...prev, [request.id]: updatedResults };
            });
        });
    };

    // Chat logic
    const toggleChat = () => setIsChatOpen(prev => !prev);
    const unreadMessagesCount = useMemo(() => conversations.reduce((acc, c) => acc + c.unreadCount, 0), [conversations]);
    
    const currentMessages = useMemo(() => {
        return messages.filter(m => m.conversationId === activeConversationId);
    }, [messages, activeConversationId]);
    
    const sendMessage = (content: string) => {
        if (!content.trim() || !currentUser || !activeConversationId) return;

        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            conversationId: activeConversationId,
            senderName: currentUser.name,
            content: content.trim(),
            timestamp: Date.now(),
            isRead: true,
        };
        setMessages(prev => [...prev, newMessage]);
        // Simulate bot reply for demo
        setTimeout(() => {
            const otherParticipant = activeConversationId.split('_').find(p => p !== currentUser.name);
            const reply: ChatMessage = {
                id: `msg_${Date.now()+1}`,
                conversationId: activeConversationId,
                senderName: otherParticipant!,
                content: "Recebido. Irei verificar e retorno em breve.",
                timestamp: Date.now() + 1,
                isRead: false,
            };
            setMessages(prev => [...prev, reply]);
             setConversations(prev => prev.map(c => c.id === activeConversationId ? {...c, lastMessage: reply, unreadCount: c.unreadCount + (isChatOpen ? 0 : 1)} : c));
        }, 1500);
    };

     const startChat = (userName: string) => {
        if (!currentUser) return;
        const convId = [userName, currentUser.name].sort().join('_');
        const existingConv = conversations.find(c => c.id === convId);
        if (!existingConv) {
            const newConv: Conversation = {
                id: convId,
                participantName: userName,
                unreadCount: 0,
            };
            setConversations(prev => [newConv, ...prev]);
        }
        setActiveConversationId(convId);
        setIsChatOpen(true);
    };

    const value: AppContextType = {
        currentUser,
        login,
        logout,
        requests,
        filteredRequests,
        selectedRequest,
        viewDetails,
        closeDetails,
        prestacaoModalRequest,
        openPrestacaoModal,
        closePrestacaoModal,
        reasonModal,
        openReasonModal,
        closeReasonModal,
        createRequest,
        updateRequestStatus,
        submitPrestacaoContas,
        updateUserProfile,
        toast,
        showToast,
        closeToast,
        filters,
        setFilters,
        expenseTypes: expenseTypesState.items,
        costCenters: costCentersState.items,
        polos: polosState.items,
        comarcas: comarcasState.items,
        regioesJudiciarias: regioesState.items,
        managedEntities,
        isChatOpen,
        toggleChat,
        unreadMessagesCount,
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages: currentMessages,
        sendMessage,
        startChat,
        validationResults,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};