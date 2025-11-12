
import React from 'react';
import Card from '../../common/Card';

const ReportsView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
                <p className="text-gray-600">Gere e visualize relatórios sobre as solicitações de suprimento de fundos.</p>
            </div>
            
            <Card title="Gerador de Relatórios">
                 <div className="text-center py-12">
                     <h3 className="text-lg font-medium text-gray-900">Em Breve</h3>
                     <p className="mt-2 text-sm text-gray-500">
                         A funcionalidade de geração de relatórios personalizados está em desenvolvimento.
                     </p>
                 </div>
            </Card>
        </div>
    );
};

export default ReportsView;
