
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import Dashboard from './Dashboard';
import RequestList from './RequestList';
import { RequestStatus } from '../../types';
import UserManager from './manage/UserManager';
import ReportsView from './reports/ReportsView';
import CatalogManager from './reports/CatalogManager';

const ChartPieIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>
);
const DocumentDuplicateIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
);
const ShieldExclamationIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" /></svg>
);
const FolderIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0a2.25 2.25 0 0 1-2.25-2.25V5.25A2.25 2.25 0 0 1 3.75 3h5.25a2.25 2.25 0 0 1 1.591.659l2.25 2.25a2.25 2.25 0 0 0 1.591.659h5.25a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25-2.25h-13.5a2.25 2.25 0 0 1-2.25-2.25V9.75Z" /></svg>
);
const WrenchScrewdriverIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.495-2.495a1.125 1.125 0 0 1 1.591 0l3.001 3.001a1.125 1.125 0 0 1 0 1.591l-2.495 2.495M11.42 15.17 8.617 12.364a1.125 1.125 0 0 1 0-1.591l6.591-6.591a1.125 1.125 0 0 1 1.591 0l2.495 2.495a1.125 1.125 0 0 1 0 1.591l-6.591 6.591a1.125 1.125 0 0 1-1.591 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 21a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0ZM8.625 15.75a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0Z" /></svg>
);
const DocumentChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m-1.125 9a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5v.75A2.25 2.25 0 0 0 5.25 16.5h1.5v-1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
);


type AdminViewName = 'dashboard' | 'solicitacoes' | 'prestacoes' | 'alcance' | 'arquivados' | 'manage' | 'reports';

const AdminView: React.FC = () => {
    const { requests } = useAppContext();
    const [activeView, setActiveView] = useState<AdminViewName>('dashboard');

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: ChartPieIcon },
        { id: 'solicitacoes', label: 'Análise de Solicitações', icon: DocumentDuplicateIcon },
        { id: 'prestacoes', label: 'Análise de Prestações', icon: ShieldExclamationIcon },
        { id: 'alcance', label: 'Suprimentos em Alcance', icon: ShieldExclamationIcon },
        { id: 'arquivados', label: 'Solicitações Arquivadas', icon: FolderIcon },
        { id: 'manage', label: 'Gerenciar', icon: WrenchScrewdriverIcon },
        { id: 'reports', label: 'Relatórios', icon: DocumentChartBarIcon }
    ];

    const solicitacoesPendentes = requests.filter(r => 
        [RequestStatus.ENVIADA_PARA_ANALISE, RequestStatus.EM_ANALISE].includes(r.status)
    );
    const prestacoesPendentes = requests.filter(r => 
        [RequestStatus.PRESTACAO_ENVIADA, RequestStatus.PRESTACAO_EM_ANALISE, RequestStatus.PRESTACAO_CORRIGIDA].includes(r.status)
    );
    const emAlcance = requests.filter(r => r.status === RequestStatus.EM_ALCANCE);
    const arquivados = requests.filter(r => r.status === RequestStatus.ARQUIVADO);

    const ManageView = () => (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Sistema</h1>
            <div className="space-y-6">
                <UserManager />
                <CatalogManager />
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard />;
            case 'solicitacoes':
                return <RequestList title="Solicitações Pendentes de Análise" requests={solicitacoesPendentes} listType="solicitacoes" />;
            case 'prestacoes':
                return <RequestList title="Prestações de Contas Pendentes de Análise" requests={prestacoesPendentes} listType="prestacoes" />;
            case 'alcance':
                return <RequestList title="Suprimentos em Alcance" requests={emAlcance} listType="alcance" />;
            case 'arquivados':
                return <RequestList title="Solicitações Arquivadas" requests={arquivados} listType="readonly" />;
            case 'manage':
                return <ManageView />;
            case 'reports':
                return <ReportsView />;
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            <aside className="w-64 bg-white flex-shrink-0 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                     <h2 className="font-bold text-gray-800 text-lg">Painel do Administrador</h2>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as AdminViewName)}
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

export default AdminView;
