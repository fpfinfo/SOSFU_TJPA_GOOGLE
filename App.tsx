
import React, { useEffect } from 'react';
import { useAppContext } from './hooks/useAppContext';
import { UserRole } from './types';
import LoginScreen from './components/auth/LoginScreen';
import SupridoView from './components/suprido/SupridoView';
import AdminView from './components/admin/AdminView';
import Header from './components/common/Header';
import RequestDetailsModal from './components/common/RequestDetailsModal';
import PrestacaoContasModal from './components/suprido/PrestacaoContasModal';
import ReasonModal from './components/common/ReasonModal';
import Toast from './components/common/Toast';
import ChatWidget from './components/chat/ChatWidget';


const App: React.FC = () => {
    const { currentUser, selectedRequest, prestacaoModalRequest, reasonModal, toast, closeToast, validateDocuments } = useAppContext();
    
    useEffect(() => {
        if(selectedRequest?.prestacaoContas) {
            validateDocuments(selectedRequest.id, selectedRequest.prestacaoContas.items);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRequest]);

    const renderContent = () => {
        if (!currentUser) {
            return <LoginScreen />;
        }

        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1">
                    {currentUser.role === UserRole.SUPRIDO && <SupridoView />}
                    {currentUser.role === UserRole.ADMIN && <AdminView />}
                </div>
                {currentUser && <ChatWidget />}
            </div>
        );
    };

    return (
        <>
            {renderContent()}
            {selectedRequest && <RequestDetailsModal />}
            {prestacaoModalRequest && <PrestacaoContasModal request={prestacaoModalRequest} />}
            {reasonModal.isOpen && <ReasonModal {...reasonModal} />}
            {toast && <Toast toast={toast} onClose={closeToast} />}
        </>
    );
};

export default App;
