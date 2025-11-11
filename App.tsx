
import React from 'react';
import { useAppContext } from './hooks/useAppContext';
import LoginScreen from './components/auth/LoginScreen';
import AdminView from './components/admin/AdminView';
import SupridoView from './components/suprido/SupridoView';
import { UserRole } from './types';
import Toast from './components/common/Toast';
import RequestDetailsModal from './components/common/RequestDetailsModal';
import PrestacaoContasModal from './components/suprido/PrestacaoContasModal';
import ReasonModal from './components/common/ReasonModal';
import ChatWidget from './components/chat/ChatWidget';
import Header from './components/common/Header';

const App: React.FC = () => {
  const { 
    currentUser, 
    toast, 
    closeToast, 
    selectedRequest, 
    prestacaoModalRequest,
    reasonModal,
  } = useAppContext();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-tribunal-background flex flex-col">
      <Header />
      
      {/* Modals and Overlays */}
      {toast && <Toast toast={toast} onClose={closeToast} />}
      {selectedRequest && <RequestDetailsModal />}
      {prestacaoModalRequest && <PrestacaoContasModal request={prestacaoModalRequest} />}
      {reasonModal.isOpen && <ReasonModal {...reasonModal.props} />}

      {/* Main Content */}
      <main className="flex-1">
        {currentUser.role === UserRole.ADMIN ? <AdminView /> : <SupridoView />}
      </main>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default App;
