import React, { useState, useRef, useEffect } from 'react';
import { RequestStatus } from '../../types';
import { FunnelIcon, TrashIcon, ChevronDownIcon, ArrowUpIcon, ArrowDownIcon } from '../../constants';
import { Filters } from '../../contexts/AppContext';

interface FilterControlsProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    availableStatuses: RequestStatus[];
    availableExpenseTypes: string[];
}

const MultiSelectDropdown: React.FC<{
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
}> = ({ options, selected, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const handleSelect = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="mt-1 flex justify-between items-center w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm bg-white"
            >
                <span className={selected.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                    {selected.length > 0 ? `${selected.length} selecionado(s)` : placeholder}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border max-h-60 overflow-auto">
                    <ul className="py-1">
                        {options.map(option => (
                            <li key={option} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center" onClick={() => handleSelect(option)}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option)}
                                    onChange={() => {}}
                                    className="h-4 w-4 text-tribunal-primary border-gray-300 rounded focus:ring-tribunal-primary"
                                />
                                <span className="ml-3">{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const FilterControls: React.FC<FilterControlsProps> = ({ filters, setFilters, availableStatuses, availableExpenseTypes }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    const handleFilterChange = (field: keyof Filters, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleSortDirectionToggle = () => {
        handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    }

    const resetFilters = () => {
        setFilters({
            status: [],
            expenseType: [],
            startDate: '',
            endDate: '',
            sortBy: 'submissionDate',
            sortDirection: 'desc',
        });
    }

    return (
        <div className="bg-white rounded-lg shadow-md mb-6">
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="w-full flex justify-between items-center px-4 py-3 sm:px-6 text-left"
            >
                <div className="flex items-center">
                    <FunnelIcon className="h-5 w-5 mr-3 text-tribunal-primary" />
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Filtros e Ordenação</h3>
                </div>
                 <ChevronDownIcon className={`w-6 h-6 text-gray-400 transform transition-transform ${isVisible ? 'rotate-180' : ''}`} />
            </button>
            {isVisible && (
                 <div className="border-t border-gray-200 p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Status</label>
                             <MultiSelectDropdown
                                options={availableStatuses}
                                selected={filters.status}
                                onChange={(value) => handleFilterChange('status', value)}
                                placeholder="Todos os status"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Elemento de Despesa</label>
                           <MultiSelectDropdown
                                options={availableExpenseTypes}
                                selected={filters.expenseType}
                                onChange={(value) => handleFilterChange('expenseType', value)}
                                placeholder="Todos os tipos"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                            <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data de Fim</label>
                            <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Ordenar por</label>
                            <div className="flex items-center mt-1">
                                <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm">
                                    <option value="submissionDate">Data</option>
                                    <option value="amount">Valor</option>
                                </select>
                                <button onClick={handleSortDirectionToggle} className="p-2 border-t border-b border-r border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100">
                                    {filters.sortDirection === 'desc' ? <ArrowDownIcon className="h-5 w-5 text-gray-600"/> : <ArrowUpIcon className="h-5 w-5 text-gray-600"/>}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                         <button onClick={resetFilters} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <TrashIcon className="h-5 w-5 mr-2 text-gray-400"/>
                            Limpar Filtros
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterControls;