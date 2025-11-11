
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { RequestStatus } from '../../types';
import FilterControls from '../common/FilterControls';
import RequestHistory from './RequestHistory';
import NewRequestForm from './NewRequestForm';
import { PlusIcon } from '../../constants';

const MinhasSolicitacoesView: React.FC = () => {
    const { filteredRequests, filters, setFilters, expenseTypes } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <div className="space-y-6">
            {isFormOpen && <NewRequestForm onClose={() => setIsFormOpen(false)} />}
            
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Minhas Solicitações</h1>
                    <p className="text-gray-600">Acompanhe e gerencie suas solicitações de suprimento de fundos.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-tribunal-primary hover:bg-tribunal-primary/90"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nova Solicitação
                </button>
            </div>
            
            <FilterControls 
                filters={filters} 
                setFilters={setFilters} 
                availableStatuses={Object.values(RequestStatus)}
                availableExpenseTypes={expenseTypes.map(e => e.name)}
            />

            <RequestHistory requests={filteredRequests} />
        </div>
    );
};

export default MinhasSolicitacoesView;
