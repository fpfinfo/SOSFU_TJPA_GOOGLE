
import React from 'react';
import { ScaleIcon } from '../../constants';
import { useAppContext } from '../../hooks/useAppContext';

const Header: React.FC = () => {
    const { currentUser, logout } = useAppContext();

    const getInitials = (name: string) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };


    return (
        <header className="bg-tribunal-primary shadow-md sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <ScaleIcon className="h-8 w-8 text-tribunal-secondary" />
                        <div className="ml-3">
                             <h1 className="text-xl font-bold text-white tracking-tight">
                                Suprimento de Fundos
                            </h1>
                            <p className="text-xs text-tribunal-secondary/80">Tribunal de Justiça do Estado do Pará</p>
                        </div>
                    </div>
                    {currentUser && (
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">Bem-vindo(a), {currentUser.name}</p>
                                <p className="text-xs text-tribunal-secondary/80">{currentUser.role}</p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/30" title={currentUser.profileData.fullName}>
                               {getInitials(currentUser.profileData.fullName)}
                            </div>
                            <button
                                onClick={logout}
                                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 bg-white/10 text-white hover:bg-white/20"
                            >
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;