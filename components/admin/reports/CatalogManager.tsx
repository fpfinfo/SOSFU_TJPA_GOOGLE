
import React, { useState } from 'react';
import Card from '../../common/Card';
import { ManagedItem } from '../../../types';
import { PlusIcon, TrashIcon, EditIcon } from '../../../constants';

interface CatalogManagerProps {
    title: string;
    singularTitle: string;
    items: ManagedItem[];
    onAdd: (name: string) => Promise<void>;
    onUpdate: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const CatalogManager: React.FC<CatalogManagerProps> = ({ title, singularTitle, items, onAdd, onUpdate, onDelete }) => {
    const [newItemName, setNewItemName] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemName, setEditingItemName] = useState('');

    const handleAdd = async () => {
        if (newItemName.trim()) {
            await onAdd(newItemName.trim());
            setNewItemName('');
        }
    };

    const handleEditStart = (item: ManagedItem) => {
        setEditingItemId(item.id);
        setEditingItemName(item.name);
    };

    const handleEditCancel = () => {
        setEditingItemId(null);
        setEditingItemName('');
    };

    const handleEditSave = async () => {
        if (editingItemId && editingItemName.trim()) {
            await onUpdate(editingItemId, editingItemName.trim());
            handleEditCancel();
        }
    };

    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Gerenciar {title}</h2>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Novo ${singularTitle}`}
                    className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm"
                />
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-tribunal-primary hover:bg-tribunal-primary/90"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Adicionar
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.length === 0 ? (
                            <tr><td colSpan={2} className="text-center py-4 text-gray-500">Nenhum item cadastrado.</td></tr>
                        ) : (
                            items.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingItemId === item.id ? (
                                        <input
                                            type="text"
                                            value={editingItemName}
                                            onChange={(e) => setEditingItemName(e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm py-1 px-2 focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-900">{item.name}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    {editingItemId === item.id ? (
                                        <>
                                            <button onClick={handleEditSave} className="p-1 rounded-full text-green-600 hover:bg-green-100" title="Salvar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg></button>
                                            <button onClick={handleEditCancel} className="p-1 rounded-full text-gray-600 hover:bg-gray-200" title="Cancelar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => onDelete(item.id)} className="p-1 rounded-full text-red-600 hover:bg-red-100" title="Remover">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleEditStart(item)} className="p-1 rounded-full text-blue-600 hover:bg-blue-100" title="Editar">
                                                <EditIcon className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default CatalogManager;
