import React, { useState } from 'react';
import { XMarkIcon } from '../../constants';

interface ReasonModalProps {
  title: string;
  label: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const ReasonModal: React.FC<ReasonModalProps> = ({ title, label, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError('O motivo é obrigatório.');
            return;
        }
        setError('');
        onConfirm(reason);
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[60]" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="reason-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 id="reason-modal-title" className="text-xl font-semibold text-tribunal-primary">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">{label}</label>
                        <textarea
                            id="reason"
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-tribunal-primary text-base font-medium text-white hover:bg-tribunal-primary/90 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                        Confirmar
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReasonModal;
