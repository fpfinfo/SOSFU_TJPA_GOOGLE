import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { UserProfile as UserProfileType } from '../../types';
import { ArrowDownOnSquareIcon } from '../../constants';

const UserProfile: React.FC = () => {
    const { currentUser, showToast, comarcas, updateUserProfile } = useAppContext();
    const [profile, setProfile] = useState<UserProfileType | null>(null);

    useEffect(() => {
        if (currentUser) {
            setProfile(currentUser.profileData);
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (profile) {
            updateUserProfile(profile);
            showToast('Perfil salvo com sucesso!', 'success');
        }
    };

    if (!currentUser || !profile) {
        return <div>Carregando perfil...</div>;
    }

    const FormSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">{description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children}
            </div>
        </div>
    );
    
    const InputField: React.FC<{ label: string; value: string; name: string; disabled?: boolean; required?: boolean; className?: string; }> = ({ label, value, name, disabled = false, required = false, className = '' }) => (
        <div className={className}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="text"
                name={name}
                id={name}
                value={value}
                disabled={disabled}
                onChange={!disabled ? handleChange : undefined}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 sm:text-sm ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'border-gray-300 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary'}`}
            />
        </div>
    );


    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-tribunal-primary font-bold text-2xl border-2 border-tribunal-primary/30 bg-gray-100">
                    {profile.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1>
                    <p className="text-gray-600">Gerencie suas informações pessoais e de contato.</p>
                </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.008a1 1 0 011 1v3.008a1 1 0 01-1 1H9a1 1 0 01-1-1V5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <span className="font-bold">Atenção!</span> Manter seus dados de perfil atualizados é fundamental para a correta emissão de portarias e outros documentos.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Informações da Conta" description="Estas informações são gerenciadas pelo sistema e não podem ser alteradas.">
                    <InputField label="Email de Login" name="email" value={currentUser.email} disabled />
                    <InputField label="Nome do Perfil (Google/Microsoft)" name="profileName" value={currentUser.name} disabled />
                    <InputField label="Função no Sistema" name="role" value={currentUser.role} disabled />
                </FormSection>

                <FormSection title="Informações Pessoais" description="Estas informações aparecerão em suas solicitações e documentos.">
                    <div className="lg:col-span-3">
                         <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                            Nome Completo para Exibição <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" name="fullName" id="fullName" value={profile.fullName} onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Este nome aparecerá em suas solicitações, portarias e outros documentos oficiais.</p>
                    </div>
                    <InputField label="CPF" name="cpf" value={profile.cpf} required />
                    <InputField label="Cargo" name="cargo" value={profile.cargo} required />
                    <InputField label="Lotação" name="lotacao" value={profile.lotacao} required />
                    <InputField label="Telefone" name="telefone" value={profile.telefone} required />
                    <InputField label="Setor" name="setor" value={profile.setor} required />
                    <InputField label="Município" name="municipio" value={profile.municipio} required />
                    <InputField label="Gestor Responsável" name="gestorResponsavel" value={profile.gestorResponsavel} className="lg:col-span-2" />
                     <div>
                        <label htmlFor="comarcaLotacao" className="block text-sm font-medium text-gray-700">Comarca de Lotação</label>
                         <select name="comarcaLotacao" id="comarcaLotacao" value={profile.comarcaLotacao} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm">
                             <option value="">Selecione uma comarca</option>
                             {comarcas.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                         </select>
                         <p className="mt-1 text-xs text-gray-500">Usada para pagamento via conta da comarca, quando escolhido na solicitação.</p>
                    </div>
                </FormSection>

                <FormSection title="Dados Bancários do Suprido" description="Essas informações serão exibidas/usadas na solicitação quando você escolher receber em sua conta.">
                    <InputField label="Banco (Nome)" name="bancoNome" value={profile.bancoNome} />
                    <InputField label="Banco (Código)" name="bancoCodigo" value={profile.bancoCodigo} />
                    <InputField label="Agência" name="agencia" value={profile.agencia} />
                    <InputField label="Conta" name="conta" value={profile.conta} />
                    <div>
                        <label htmlFor="tipoConta" className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                        <select name="tipoConta" id="tipoConta" value={profile.tipoConta} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-tribunal-primary focus:border-tribunal-primary sm:text-sm">
                            <option value="Corrente">Corrente</option>
                            <option value="Poupança">Poupança</option>
                        </select>
                    </div>
                </FormSection>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-tribunal-primary hover:bg-tribunal-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tribunal-primary">
                        <ArrowDownOnSquareIcon className="h-5 w-5 mr-2" />
                        Salvar Perfil
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;