
import React from 'react';
import { UserRole } from '../../types';
import { ScaleIcon } from '../../constants';
import { useAppContext } from '../../hooks/useAppContext';

const LoginScreen: React.FC = () => {
  const { login } = useAppContext();

  return (
    <div className="flex items-center justify-center min-h-screen bg-tribunal-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-2xl">
        <div className="flex flex-col items-center">
          <ScaleIcon className="w-16 h-16 text-tribunal-primary" />
          <h1 className="mt-4 text-3xl font-bold text-center text-tribunal-primary tracking-tight">
            Sistema de Suprimento de Fundos
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Tribunal de Justiça do Estado do Pará
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-center font-medium text-gray-700">Selecione seu perfil para continuar</p>
          <button
            onClick={() => login(UserRole.SUPRIDO)}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-tribunal-primary hover:bg-tribunal-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tribunal-primary transition-colors"
          >
            Entrar como Suprido
          </button>
          <button
            onClick={() => login(UserRole.ADMIN)}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-tribunal-primary bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tribunal-secondary transition-colors"
          >
            Entrar como Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
