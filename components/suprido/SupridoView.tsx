
import React, { useState } from 'react';
import MinhasSolicitacoesView from './MinhasSolicitacoesView';
import UserProfile from './UserProfile';
import { DocumentTextIcon, UserCircleIcon } from '../../constants';
import { useAppContext } from '../../hooks/useAppContext';


type SupridoViewName = 'solicitacoes' | 'perfil';

const SupridoView: React.FC = () => {
    const { currentUser } = useAppContext();
    const [activeView, setActiveView] = useState<SupridoViewName>('solicitacoes');
    
     const menuItems = [
        { id: 'solicitacoes', label: 'Minhas Solicitações', icon: DocumentTextIcon },
        { id: 'perfil', label: 'Meu Perfil', icon: UserCircleIcon },
    ];

    const getInitials = (name: string) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const renderContent = () => {
        switch (activeView) {
            case 'solicitacoes':
                return <MinhasSolicitacoesView />;
            case 'perfil':
                return <UserProfile />;
            default:
                return null;
        }
    };


    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            <aside className="w-64 bg-white flex-shrink-0 border-r border-gray-200 flex flex-col">
                 <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-tribunal-primary/20 text-tribunal-primary flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0">
                            {currentUser ? getInitials(currentUser.profileData.fullName) : ''}
                        </div>
                        <div className="ml-3 min-w-0">
                            <h2 className="font-bold text-gray-800 truncate" title={currentUser?.name}>{currentUser?.name}</h2>
                            <p className="text-xs text-gray-500">{currentUser?.role}</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as SupridoViewName)}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                activeView === item.id 
                                ? 'bg-tribunal-primary/10 text-tribunal-primary' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                            <span className="text-left">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-6 lg:p-8 bg-tribunal-background overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default SupridoView;