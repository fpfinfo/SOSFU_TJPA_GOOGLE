
import React, { useState } from 'react';
import Card from '../../common/Card';
import { User } from '../../../types';
import EditUserModal from './EditUserModal';

// Dummy data for now
const dummyUsers: User[] = [
    {
        id: 'user-1',
        name: 'João da Silva (Suprido)',
        email: 'joao.silva@example.com',
        role: 'Suprido' as any,
        profileData: {
            fullName: 'João da Silva Pereira',
            cpf: '111.222.333-44',
            cargo: 'Técnico Judiciário',
            lotacao: 'Vara Cível de Belém',
            telefone: '(91) 98888-7777',
            setor: 'Cartório',
            municipio: 'Belém',
            gestorResponsavel: 'Maria Oliveira',
            comarcaLotacao: 'Belém',
            bancoNome: 'Banco do Brasil',
            bancoCodigo: '001',
            agencia: '1234-5',
            conta: '98765-4',
            tipoConta: 'Corrente',
        }
    },
     {
        id: 'user-2',
        name: 'Admin do Sistema',
        email: 'admin@example.com',
        role: 'Admin do Sistema' as any,
        profileData: {
            fullName: 'Administrador do Sistema',
            cpf: '000.000.000-00',
            cargo: 'Analista de Sistemas',
            lotacao: 'Departamento de Tecnologia',
            telefone: '(91) 99999-9999',
            setor: 'DTI',
            municipio: 'Belém',
            gestorResponsavel: 'Diretoria Geral',
            comarcaLotacao: 'Belém',
            bancoNome: '',
            bancoCodigo: '',
            agencia: '',
            conta: '',
            tipoConta: 'Corrente',
        }
    }
];

const UserManager: React.FC = () => {
    const [users] = useState<User[]>(dummyUsers);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleSaveUser = (updatedUser: User) => {
        // In a real app, this would call an API
        console.log("Saving user:", updatedUser);
        setEditingUser(null);
    };

    return (
        <>
            {editingUser && (
                <EditUserModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onSave={handleSaveUser} 
                />
            )}
            <Card title="Gerenciar Usuários">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setEditingUser(user)} className="text-tribunal-primary hover:underline">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
};

export default UserManager;
