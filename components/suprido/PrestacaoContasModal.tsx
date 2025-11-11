
import React, { useState } from 'react';
import { FundRequest, ExpenseItem } from '../../types';
import { useAppContext } from '../../hooks/useAppContext';
import { XMarkIcon, PlusIcon, TrashIcon } from '../../constants';

interface PrestacaoContasModalProps {
    request: FundRequest;
}

const PrestacaoContasModal: React.FC<PrestacaoContasModalProps> = ({ request }) => {
    const { closePrestacaoModal, submitPrestacaoContas } = useAppContext();
    const [items, setItems] = useState<Omit<ExpenseItem, 'id'>[]>(request.prestacaoContas?.items || []);
    const [notes, setNotes] = useState(request.prestacaoContas?.notes || '');
    const [error, setError] = useState('');

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const handleAddItem = () => {
        setItems([...items, { date: '', description: '', amount: 0, receipt: { name: '', size: 0 } }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof Omit<ExpenseItem, 'id' | 'receipt'>, value: string | number) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        if (field === 'amount') {
             (newItems[index] as any)[field] = parseFloat(value as string) || 0;
        }
        setItems(newItems);
    };

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newItems = [...items];
            newItems[index].receipt = { name: file.name, size: file.size / 1024 };
            setItems(newItems);
        }
    };

    const handleSubmit = () => {
        if (items.some(item => !item.date || !item.description || item.amount <= 0 || !item.receipt.name)) {
            setError('Preencha todos os campos de cada item e anexe um comprovante.');
            return;
        }
        setError('');
        submitPrestacaoContas(request.id, {
            items,
            notes,
            totalAmount
        });
        closePrestacaoModal();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl transform transition-all max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-tribunal-primary">Prestação de Contas - Solicitação #{request.id}</h2>
                    <button onClick={closePrestacaoModal} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Items table */}
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-2">Data</th>
                                    <th className="px-4 py-2 w-2/5">Descrição</th>
                                    <th className="px-4 py-2">Valor (R$)</th>
                                    <th className="px-4 py-2">Comprovante</th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-2 py-2"><input type="date" value={item.date} onChange={e => handleItemChange(index, 'date', e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm" /></td>
                                        <td className="px-2 py-2"><input type="text" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm" /></td>
                                        <td className="px-2 py-2"><input type="number" step="0.01" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm" /></td>
                                        <td className="px-2 py-2 text-sm">
                                            <label htmlFor={`receipt-${index}`} className="cursor-pointer text-tribunal-primary hover:underline">
                                                {item.receipt.name ? item.receipt.name : 'Anexar'}
                                            </label>
                                            <input id={`receipt-${index}`} type="file" className="sr-only" onChange={e => handleFileChange(index, e)} />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={handleAddItem} type="button" className="flex items-center text-sm font-medium text-tribunal-primary hover:underline">
                        <PlusIcon className="w-4 h-4 mr-1" /> Adicionar Item
                    </button>
                    <div>
                        <div className="flex justify-between items-baseline">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Observações</label>
                            <span className="text-sm font-semibold text-gray-800">Valor Total: R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <textarea name="notes" id="notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm"></textarea>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button onClick={handleSubmit} type="button" className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-tribunal-primary text-base font-medium text-white hover:bg-tribunal-primary/90">
                        Enviar Prestação
                    </button>
                    <button type="button" onClick={closePrestacaoModal} className="mt-3 sm:mt-0 sm:mr-3 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrestacaoContasModal;
