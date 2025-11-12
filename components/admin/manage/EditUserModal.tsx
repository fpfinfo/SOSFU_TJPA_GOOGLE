
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../../types';
import { XMarkIcon } from '../../../constants';

interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: (user: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
    const [editedUser, setEditedUser] = useState<User>(user);

    useEffect(() => {
        setEditedUser(user);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedUser);
    };

    return (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-tribunal-primary">Editar Usuário</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                        <input type="text" name="name" id="name" value={editedUser.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="email" value={editedUser.email} disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Função</label>
                        <select name="role" id="role" value={editedUser.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm">
                            {Object.values(UserRole).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse -m-6 mt-4 rounded-b-lg">
                        <button type="submit" className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-tribunal-primary text-base font-medium text-white hover:bg-tribunal-primary/90">
                            Salvar Alterações
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

export default EditUserModal;
