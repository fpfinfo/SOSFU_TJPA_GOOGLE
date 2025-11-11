import React, { useState } from 'react';
import { RequestStatus } from '../../types';
import RequestList from './RequestList';
import Dashboard from './Dashboard';
import FilterControls from '../common/FilterControls';
import Card from '../common/Card';
import { useAppContext } from '../../hooks/useAppContext';
import { 
    ChartBarIcon, 
    DocumentCheckIcon, 
    DocumentTextIcon, 
    ChartPieIcon, 
    QuestionMarkCircleIcon, 
    BookOpenIcon,
    HomeIcon,
} from '../../constants';
import ReportsView from './reports/ReportsView';

type AdminViewName = 'dashboard' | 'analiseSuprimento' | 'analisePrestacao' | 'relatorios' | 'faq' | 'manual';

const PlaceholderView: React.FC<{ title: string }> = ({ title }) => (
    <Card>
        <div className="text-center text-gray-500 py-24">
            <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
            <p className="mt-2">Página em construção.</p>
        </div>
    </Card>
);

const AdminView: React.FC = () => {
    const { filteredRequests, filters, setFilters, expenseTypes } = useAppContext();
    const [activeView, setActiveView] = useState<AdminViewName>('analiseSuprimento');

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
        { id: 'analiseSuprimento', label: 'Análise Suprimento', icon: DocumentTextIcon },
        { id: 'analisePrestacao', label: 'Análise Prestação', icon: DocumentCheckIcon },
        { id: 'relatorios', label: 'Cadastros', icon: ChartPieIcon },
        { id: 'faq', label: 'FAQ', icon: QuestionMarkCircleIcon },
        { id: 'manual', label: 'Manual de Uso', icon: BookOpenIcon },
    ];
    
    const renderContent = () => {
        const breadcrumbBase = (
             <div className="flex items-center text-sm text-gray-500 mb-4">
                <HomeIcon className="w-4 h-4 mr-2"/>
                <span>Início</span>
                <span className="mx-2">&gt;</span>
            </div>
        );

        switch (activeView) {
            case 'dashboard':
                return <Dashboard />;
            case 'analiseSuprimento': {
                 const requests = filteredRequests.filter(r => [
                    RequestStatus.ENVIADA_PARA_ANALISE,
                    RequestStatus.EM_ANALISE,
                    RequestStatus.DEVOLVIDA_PARA_AJUSTES,
                ].includes(r.status));
                return (
                    <div className="space-y-6">
                        {breadcrumbBase}
                        <h1 className="text-3xl font-bold text-gray-800">Análise de Suprimento</h1>
                        <p className="text-gray-600 -mt-4">Analise e aprove solicitações de suprimento de fundos</p>
                        <FilterControls 
                            filters={filters} 
                            setFilters={setFilters} 
                            availableStatuses={Object.values(RequestStatus)}
                            availableExpenseTypes={expenseTypes.map(e => e.name)}
                        />
                        <RequestList title="Solicitações" requests={requests} listType="solicitacoes" />
                    </div>
                );
            }
            case 'analisePrestacao': {
                const requests = filteredRequests.filter(r => [
                    RequestStatus.PRESTACAO_ENVIADA,
                    RequestStatus.PRESTACAO_EM_ANALISE,
                    RequestStatus.PRESTACAO_DEVOLVIDA,
                    RequestStatus.PRESTACAO_CORRIGIDA,
                    RequestStatus.PRESTACAO_REPROVADA,
                    RequestStatus.EM_ALCANCE,
                ].includes(r.status));
                 return (
                    <div className="space-y-6">
                        {breadcrumbBase}
                        <h1 className="text-3xl font-bold text-gray-800">Análise de Prestação de Contas</h1>
                        <p className="text-gray-600 -mt-4">Verifique a conformidade das prestações de contas enviadas</p>
                        <FilterControls 
                            filters={filters} 
                            setFilters={setFilters} 
                            availableStatuses={Object.values(RequestStatus)}
                            availableExpenseTypes={expenseTypes.map(e => e.name)}
                        />
                        <RequestList title="Prestações de Contas para Análise" requests={requests} listType="prestacoes" />
                    </div>
                );
            }
            case 'relatorios': return <ReportsView />;
            case 'faq': return <PlaceholderView title="FAQ" />;
            case 'manual': return <PlaceholderView title="Manual de Uso" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            <aside className="w-64 bg-white flex-shrink-0 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-tribunal-primary text-white flex items-center justify-center rounded-lg font-bold text-sm">SOSFU</div>
                        <div className="ml-3">
                            <h2 className="font-bold text-gray-800">GESTOR</h2>
                            <p className="text-xs text-gray-500">Gestão de Suprimento de Fundos</p>
                        </div>
                    </div>
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