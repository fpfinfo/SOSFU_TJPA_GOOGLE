
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { PaperClipIcon, XMarkIcon } from '../../constants';

interface NewRequestFormProps {
    onClose: () => void;
}

const NewRequestForm: React.FC<NewRequestFormProps> = ({ onClose }) => {
    const { createRequest, expenseTypes, costCenters, polos, comarcas, regioesJudiciarias } = useAppContext();
    const [error, setError] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get('amount') as string);
        if (isNaN(amount) || amount <= 0) {
            setError('Valor inválido.');
            return;
        }

        const newRequest = {
            requestType: formData.get('requestType') as string,
            expenseType: formData.get('expenseType') as string,
            costCenter: formData.get('costCenter') as string,
            polo: formData.get('polo') as string,
            comarca: formData.get('comarca') as string,
            regiaoJudiciaria: formData.get('regiaoJudiciaria') as string,
            applicationPeriod: {
                start: formData.get('startDate') as string,
                end: formData.get('endDate') as string,
            },
            amount: amount,
            description: formData.get('description') as string,
            attachment: attachment ? { name: attachment.name, size: attachment.size / 1024 } : undefined,
        };
        
        createRequest(newRequest);
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl transform transition-all max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-tribunal-primary">Nova Solicitação de Suprimento</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    {/* Form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Tipo de Suprimento" name="requestType" options={['Viagens', 'Material de Consumo', 'Serviços de Terceiros']} />
                        <InputField label="Elemento de Despesa" name="expenseType" options={expenseTypes.map(e => e.name)} />
                        <InputField label="Centro de Custo" name="costCenter" options={costCenters.map(c => c.name)} />
                        <InputField label="Polo" name="polo" options={polos.map(p => p.name)} />
                        <InputField label="Comarca" name="comarca" options={comarcas.map(c => c.name)} />
                        <InputField label="Região Judiciária" name="regiaoJudiciaria" options={regioesJudiciarias.map(r => r.name)} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Início da Aplicação</label>
                            {/* Fix: Replaced custom 'input-style' class with Tailwind CSS utility classes and removed invalid style tag. */}
                            <input type="date" name="startDate" id="startDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm" required/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fim da Aplicação</label>
                            <input type="date" name="endDate" id="endDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm" required/>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor Solicitado (R$)</label>
                        <input type="number" step="0.01" name="amount" id="amount" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm" placeholder="150.00" required/>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição / Justificativa</label>
                        <textarea name="description" id="description" rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm" required></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Anexo</label>
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-tribunal-primary hover:text-tribunal-primary/80">
                                        <span>Carregar arquivo</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">PDF, PNG, JPG até 10MB</p>
                            </div>
                        </div>
                        {attachment && <p className="mt-2 text-sm text-gray-600 truncate">Arquivo selecionado: {attachment.name}</p>}
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse -m-6 mt-4 rounded-b-lg">
                        <button type="submit" className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-tribunal-primary text-base font-medium text-white hover:bg-tribunal-primary/90">
                            Enviar Solicitação
                        </button>
                        <button type="button" onClick={onClose} className="mt-3 sm:mt-0 sm:mr-3 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InputField: React.FC<{label: string, name: string, options: string[]}> = ({label, name, options}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <select name={name} id={name} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm" required>
            <option value="">Selecione...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default NewRequestForm;
