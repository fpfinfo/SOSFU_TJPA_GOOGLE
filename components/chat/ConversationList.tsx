import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';

const ConversationList: React.FC = () => {
    const { conversations, setActiveConversationId, currentUser } = useAppContext();

    if (conversations.length === 0) {
        return <div className="p-4 text-center text-sm text-gray-500">Nenhuma conversa encontrada.</div>
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
                {conversations.map((conv) => (
                    <li
                        key={conv.id}
                        onClick={() => setActiveConversationId(conv.id)}
                        className="p-3 flex items-center space-x-3 hover:bg-gray-50 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-tribunal-primary/20 flex-shrink-0 flex items-center justify-center">
                            <span className="text-tribunal-primary font-bold">{conv.participantName.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{conv.participantName}</p>
                            {conv.lastMessage && (
                                <p className="text-sm text-gray-500 truncate">
                                   {conv.lastMessage.senderName === currentUser?.name ? "Você: " : ""}
                                   {conv.lastMessage.content}
                                </p>
                            )}
                        </div>
                        {conv.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-status-rejected text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {conv.unreadCount}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ConversationList;
