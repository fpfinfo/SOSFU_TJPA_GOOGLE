import React from 'react';
import { ChatBubbleLeftEllipsisIcon, XMarkIcon } from '../../constants';
import { useAppContext } from '../../hooks/useAppContext';
import ConversationList from './ConversationList';
import MessageView from './MessageView';

const ChatWidget: React.FC = () => {
    const { isChatOpen, toggleChat, unreadMessagesCount, activeConversationId, setActiveConversationId } = useAppContext();

    return (
        <div className="fixed bottom-5 right-5 z-40">
            {/* Chat Window */}
            {isChatOpen && (
                <div className="w-[calc(100vw-40px)] h-[60vh] sm:w-[350px] sm:h-[500px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
                    <header className="bg-tribunal-primary text-white p-3 flex justify-between items-center rounded-t-lg">
                        <h3 className="font-bold text-lg">
                            {activeConversationId ? activeConversationId.split('_').find(p => p !== 'Admin do Sistema') : 'Mensagens'}
                        </h3>
                        {activeConversationId && (
                             <button onClick={() => setActiveConversationId(null)} className="text-white/80 hover:text-white">&larr; Voltar</button>
                        )}
                    </header>
                    
                    {activeConversationId ? <MessageView /> : <ConversationList />}
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={toggleChat}
                className="mt-4 ml-auto flex items-center justify-center w-16 h-16 bg-tribunal-primary rounded-full text-white shadow-lg hover:bg-tribunal-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tribunal-primary"
                aria-label={isChatOpen ? "Fechar chat" : "Abrir chat"}
            >
                {isChatOpen ? <XMarkIcon className="w-8 h-8"/> : <ChatBubbleLeftEllipsisIcon className="w-8 h-8" />}
                {!isChatOpen && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                        {unreadMessagesCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
