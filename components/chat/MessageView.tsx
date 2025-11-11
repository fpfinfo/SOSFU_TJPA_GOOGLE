import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { UserRole, RequestStatus } from '../../types';

const MessageView: React.FC = () => {
    const { messages, currentUser, sendMessage, activeConversationId, updateRequestStatus, requests } = useAppContext();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const otherParticipantName = activeConversationId?.split('_').find(p => p !== currentUser?.name) || '';
    const requestInAlcance = requests.find(r => r.requester === otherParticipantName && r.status === RequestStatus.EM_ALCANCE);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(newMessage);
        setNewMessage('');
    };

    const handleUnlock = () => {
        if (requestInAlcance) {
            updateRequestStatus(requestInAlcance.id, RequestStatus.ALCANCE_REGULARIZADO);
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${msg.senderName === currentUser?.name ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                msg.senderName === currentUser?.name
                                    ? 'bg-tribunal-primary text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            }`}
                        >
                            <p className="text-sm">{msg.content}</p>
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>

            {currentUser?.role === UserRole.ADMIN && requestInAlcance && (
                <div className="p-2 border-t bg-yellow-50 border-yellow-200">
                    <button onClick={handleUnlock} className="w-full text-center text-sm font-bold bg-status-alcance-regularizado text-white py-2 rounded-md hover:bg-status-alcance-regularizado/90">
                       Analisar Regularização / Desbloquear Suprido
                    </button>
                    <p className="text-xs text-center text-gray-600 mt-1">Isso irá alterar o status da solicitação <span className="font-bold">#{requestInAlcance.id}</span> para "Regularizado"</p>
                </div>
            )}
            
            <form onSubmit={handleSend} className="p-3 border-t bg-white">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 block w-full border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-tribunal-primary"
                    />
                    <button type="submit" className="flex-shrink-0 w-10 h-10 bg-tribunal-primary text-white rounded-full flex items-center justify-center hover:bg-tribunal-primary/90">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MessageView;
