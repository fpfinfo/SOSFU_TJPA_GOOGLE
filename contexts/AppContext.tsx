
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
    User, UserRole, FundRequest, RequestStatus, ToastMessage, PrestacaoContas, 
    ExpenseItem, ValidationResult, UserProfile, Message, Conversation, CatalogItem 
} from '../types';
import { MOCK_REQUESTS, MOCK_USERS, MOCK_MESSAGES, MOCK_CATALOG_ITEMS } from './mockData';
import { simulateOcrExtraction } from '../utils/ocr';

export interface Filters {
    status: RequestStatus[];
    expenseType: string[];
    startDate: string;
    endDate: string;
    sortBy: 'submissionDate' | 'amount';
    sortDirection: 'asc' | 'desc';
}

export interface ReasonModalState {
    isOpen: boolean;
    title?: string;
    label?: string;
    onConfirm?: (reason: string) => void;
    onClose?: () => void;
}

export interface AppContextType {
    currentUser: User | null;
    login: (role: UserRole) => void;
    logout: () => void;
    requests: FundRequest[];
    filteredRequests: FundRequest[];
    createRequest: (newRequestData: Omit<FundRequest, 'id' | 'requester' | 'submissionDate' | 'status' | 'history'>) => void;
    updateRequestStatus: (id: string, status: RequestStatus, reason?: string) => void;
    submitPrestacaoContas: (id: string, prestacaoData: Omit<PrestacaoContas, 'submittedDate'>) => void;
    
    // Modals
    selectedRequest: FundRequest | null;
    viewDetails: (request: FundRequest) => void;
    closeDetails: () => void;
    
    prestacaoModalRequest: FundRequest | null;
    openPrestacaoModal: (request: FundRequest) => void;
    closePrestacaoModal: () => void;
    
    reasonModal: ReasonModalState;
    openReasonModal: (config: Partial<ReasonModalState> & { onConfirm: (reason: string) => void, title: string, label: string }) => void;

    // Toast
    toast: ToastMessage | null;
    showToast: (message: string, type: 'success' | 'error') => void;
    closeToast: () => void;

    // Filters
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;

    // Validation
    validationResults: Record<string, ValidationResult[]>;
    validateDocuments: (requestId: string, items: ExpenseItem[]) => void;

    // Chat
    isChatOpen: boolean;
    toggleChat: () => void;
    unreadMessagesCount: number;
    conversations: Conversation[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    messages: Message[];
    sendMessage: (content: string) => void;
    startChat: (userName: string) => void;

    // Catalogs & User management
    updateUserProfile: (profile: UserProfile) => void;
    expenseTypes: CatalogItem[];
    costCenters: CatalogItem[];
    polos: CatalogItem[];
    comarcas: CatalogItem[];
    regioesJudiciarias: CatalogItem[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [requests, setRequests] = useState<FundRequest[]>(MOCK_REQUESTS);
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    
    const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
    const [prestacaoModalRequest, setPrestacaoModalRequest] = useState<FundRequest | null>(null);
    const [reasonModal, setReasonModal] = useState<ReasonModalState>({ isOpen: false });
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});
    
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    
    const [expenseTypes] = useState<CatalogItem[]>(MOCK_CATALOG_ITEMS.expenseTypes);
    const [costCenters] = useState<CatalogItem[]>(MOCK_CATALOG_ITEMS.costCenters);
    const [polos] = useState<CatalogItem[]>(MOCK_CATALOG_ITEMS.polos);
    const [comarcas] = useState<CatalogItem[]>(MOCK_CATALOG_ITEMS.comarcas);
    const [regioesJudiciarias] = useState<CatalogItem[]>(MOCK_CATALOG_ITEMS.regioesJudiciarias);


    const [filters, setFilters] = useState<Filters>({
        status: [],
        expenseType: [],
        startDate: '',
        endDate: '',
        sortBy: 'submissionDate',
        sortDirection: 'desc',
    });

    const login = (role: UserRole) => {
        const userToLogin = users.find(u => u.role === role);
        if (userToLogin) {
            setCurrentUser(userToLogin);
        }
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const viewDetails = (request: FundRequest) => setSelectedRequest(request);
    const closeDetails = () => setSelectedRequest(null);
    const openPrestacaoModal = (request: FundRequest) => setPrestacaoModalRequest(request);
    const closePrestacaoModal = () => setPrestacaoModalRequest(null);

    const openReasonModal = (config: Partial<ReasonModalState> & { onConfirm: (reason: string) => void, title: string, label: string }) => {
        setReasonModal({
            isOpen: true,
            title: config.title,
            label: config.label,
            onConfirm: config.onConfirm,
            onClose: () => setReasonModal({ isOpen: false }),
        });
    };
    
    const showToast = (message: string, type: 'success' | 'error') => {
        const id = new Date().toISOString();
        setToast({ id, message, type });
        setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 5000);
    };

    const closeToast = () => setToast(null);

    const addHistory = (request: FundRequest, status: RequestStatus, reason?: string): FundRequest => {
        const newHistoryEntry: typeof request.history[0] = {
            date: new Date().toISOString(),
            status,
            user: currentUser?.name || 'Sistema',
            reason,
        };
        return { ...request, history: [...request.history, newHistoryEntry] };
    };

    const createRequest = (newRequestData: Omit<FundRequest, 'id' | 'requester' | 'submissionDate' | 'status' | 'history'>) => {
        if (!currentUser) return;
        const newRequest: FundRequest = {
            ...newRequestData,
            id: `SF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            requester: currentUser.name,
            submissionDate: new Date().toISOString(),
            status: RequestStatus.ENVIADA_PARA_ANALISE,
            history: [],
        };
        newRequest.history.push({ date: newRequest.submissionDate, status: newRequest.status, user: currentUser.name });
        setRequests(prev => [newRequest, ...prev]);
        showToast('Solicitação enviada com sucesso!', 'success');
    };

    const updateRequestStatus = (id: string, status: RequestStatus, reason?: string) => {
        setRequests(prev => prev.map(req => {
            if (req.id === id) {
                const updatedReq = addHistory({ ...req, status }, status, reason);
                showToast(`Status da solicitação #${id} atualizado para "${status}".`, 'success');
                return updatedReq;
            }
            return req;
        }));
    };

    const submitPrestacaoContas = (id: string, prestacaoData: Omit<PrestacaoContas, 'submittedDate'>) => {
        setRequests(prev => prev.map(req => {
            if (req.id === id) {
                const prestacao: PrestacaoContas = {
                    ...prestacaoData,
                    items: prestacaoData.items.map((item, index) => ({ ...item, id: `${id}-item-${index}` })),
                    submittedDate: new Date().toISOString()
                };
                
                const newStatus = req.prestacaoContas ? RequestStatus.PRESTACAO_CORRIGIDA : RequestStatus.PRESTACAO_ENVIADA;

                const updatedReq = addHistory({ ...req, status: newStatus, prestacaoContas: prestacao }, newStatus);
                showToast(`Prestação de contas para #${id} enviada para análise.`, 'success');
                return updatedReq;
            }
            return req;
        }));
    };
    
    const filteredRequests = useMemo(() => {
        let userRequests = currentUser?.role === UserRole.ADMIN 
            ? requests 
            : requests.filter(r => r.requester === currentUser?.name);

        return userRequests
            .filter(r => {
                const statusMatch = filters.status.length === 0 || filters.status.includes(r.status);
                const typeMatch = filters.expenseType.length === 0 || filters.expenseType.includes(r.expenseType);
                const startDateMatch = !filters.startDate || new Date(r.submissionDate) >= new Date(filters.startDate);
                const endDateMatch = !filters.endDate || new Date(r.submissionDate) <= new Date(filters.endDate + 'T23:59:59Z');
                return statusMatch && typeMatch && startDateMatch && endDateMatch;
            })
            .sort((a, b) => {
                const valA = a[filters.sortBy];
                const valB = b[filters.sortBy];
                const direction = filters.sortDirection === 'asc' ? 1 : -1;
                
                if (valA < valB) return -1 * direction;
                if (valA > valB) return 1 * direction;
                return 0;
            });
    }, [requests, currentUser, filters]);
    
    const validateDocuments = useCallback(async (requestId: string, items: ExpenseItem[]) => {
        if (validationResults[requestId]) return; // Already validated or in process

        setValidationResults(prev => ({
            ...prev,
            [requestId]: items.map(item => ({ itemId: item.id, status: 'processing', discrepancies: [] }))
        }));

        for (const item of items) {
            try {
                const extractedData = await simulateOcrExtraction(item);
                
                const discrepancies: ('amount' | 'date')[] = [];
                if (extractedData.amount !== undefined && extractedData.amount !== item.amount) {
                    discrepancies.push('amount');
                }
                // Date comparison logic can be complex, this is a simplified version
                if (extractedData.date) {
                     const extractedD = new Date(extractedData.date.includes('/') 
                        ? extractedData.date.split('/').reverse().join('-') + 'T00:00:00Z' 
                        : extractedData.date + 'T00:00:00Z');
                     const itemD = new Date(item.date + 'T00:00:00Z');
                     if (extractedD.getTime() !== itemD.getTime()) {
                         discrepancies.push('date');
                     }
                }

                setValidationResults(prev => ({
                    ...prev,
                    [requestId]: prev[requestId].map(r => r.itemId === item.id 
                        ? { itemId: item.id, status: 'validated', extractedData, discrepancies } 
                        : r
                    )
                }));

            } catch (error) {
                 setValidationResults(prev => ({
                    ...prev,
                    [requestId]: prev[requestId].map(r => r.itemId === item.id 
                        ? { itemId: item.id, status: 'error', discrepancies: [] } 
                        : r
                    )
                }));
            }
        }
    }, [validationResults]);

    const toggleChat = () => setIsChatOpen(prev => !prev);

    const conversations = useMemo(() => {
        if (!currentUser) return [];

        const convMap: Record<string, Conversation> = {};

        messages.forEach(msg => {
            const otherParticipant = msg.senderName === currentUser.name 
                ? msg.conversationId.split('_').find(p => p !== currentUser.name)!
                : msg.senderName;
            
            const conversationId = [currentUser.name, otherParticipant].sort().join('_');

            if (!convMap[conversationId]) {
                convMap[conversationId] = {
                    id: conversationId,
                    participantName: otherParticipant,
                    unreadCount: 0,
                }
            }
            
            convMap[conversationId].lastMessage = msg;
            if (msg.senderName !== currentUser.name && !msg.isRead) {
                convMap[conversationId].unreadCount++;
            }
        });
        
        return Object.values(convMap).sort((a,b) => 
            new Date(b.lastMessage!.timestamp).getTime() - new Date(a.lastMessage!.timestamp).getTime()
        );

    }, [messages, currentUser]);

    const unreadMessagesCount = useMemo(() => conversations.reduce((sum, conv) => sum + conv.unreadCount, 0), [conversations]);

    const activeMessages = useMemo(() => {
        return messages.filter(m => m.conversationId === activeConversationId);
    }, [messages, activeConversationId]);
    
    const sendMessage = (content: string) => {
        if (!content.trim() || !currentUser || !activeConversationId) return;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            conversationId: activeConversationId,
            senderName: currentUser.name,
            content,
            timestamp: new Date().toISOString(),
            isRead: false
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const startChat = (userName: string) => {
        if (!currentUser) return;
        const conversationId = [currentUser.name, userName].sort().join('_');
        setActiveConversationId(conversationId);
        setIsChatOpen(true);
    };
    
    const updateUserProfile = (profile: UserProfile) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, profileData: profile };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    };
    
    useEffect(() => {
        if(isChatOpen && activeConversationId) {
            // Mark messages as read
            setMessages(prev => prev.map(m => (
                m.conversationId === activeConversationId && !m.isRead && m.senderName !== currentUser?.name
                ? { ...m, isRead: true }
                : m
            )));
        }
    }, [isChatOpen, activeConversationId, currentUser]);


    return (
        <AppContext.Provider value={{ 
            currentUser, login, logout, requests, filteredRequests, createRequest, updateRequestStatus, submitPrestacaoContas,
            selectedRequest, viewDetails, closeDetails,
            prestacaoModalRequest, openPrestacaoModal, closePrestacaoModal,
            reasonModal, openReasonModal,
            toast, showToast, closeToast,
            filters, setFilters,
            validationResults, validateDocuments,
            isChatOpen, toggleChat, unreadMessagesCount, conversations, activeConversationId, setActiveConversationId, messages: activeMessages, sendMessage, startChat,
            updateUserProfile,
            expenseTypes, costCenters, polos, comarcas, regioesJudiciarias
        }}>
            {children}
        </AppContext.Provider>
    );
};
