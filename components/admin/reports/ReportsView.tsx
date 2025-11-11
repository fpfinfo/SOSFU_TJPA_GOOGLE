import React, { useState } from 'react';
import CatalogManager from './CatalogManager';
import { useAppContext } from '../../../hooks/useAppContext';
import { ManagedEntityType } from '../../../types';

const TABS: { id: ManagedEntityType; label: string, singular: string }[] = [
    { id: 'expenseTypes', label: 'Elementos de Despesa', singular: 'Elemento de Despesa' },
    { id: 'costCenters', label: 'Centros de Custo', singular: 'Centro de Custo' },
    { id: 'polos', label: 'Polos', singular: 'Polo' },
    { id: 'comarcas', label: 'Comarcas', singular: 'Comarca' },
    { id: 'regioesJudiciarias', label: 'Regiões Judiciárias', singular: 'Região Judiciária' },
];

const ReportsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ManagedEntityType>('expenseTypes');
    const { managedEntities } = useAppContext();

    const currentEntity = managedEntities[activeTab];
    const currentTabConfig = TABS.find(t => t.id === activeTab);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Cadastros</h1>
            <p className="text-gray-600 -mt-4">Adicione, edite ou remova itens que populam os formulários de solicitação.</p>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-tribunal-primary text-tribunal-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {currentEntity && currentTabConfig && (
                 <CatalogManager
                    key={activeTab} 
                    title={currentTabConfig.label}
                    singularTitle={currentTabConfig.singular}
                    items={currentEntity.items}
                    onAdd={currentEntity.add}
                    onUpdate={currentEntity.update}
                    onDelete={currentEntity.delete}
                />
            )}
        </div>
    );
};

export default ReportsView;
