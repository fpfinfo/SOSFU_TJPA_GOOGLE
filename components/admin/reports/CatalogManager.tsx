
import React from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import Card from '../../common/Card';
import { CatalogItem } from '../../../types';

const CatalogList: React.FC<{ title: string, items: CatalogItem[] }> = ({ title, items }) => (
    <div>
        <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
        <ul className="divide-y divide-gray-200 border rounded-md max-h-60 overflow-y-auto">
            {items.map(item => (
                <li key={item.id} className="px-4 py-2 text-sm text-gray-800 bg-white">
                    {item.name}
                </li>
            ))}
        </ul>
    </div>
);

const CatalogManager: React.FC = () => {
    const { expenseTypes, costCenters, polos, comarcas, regioesJudiciarias } = useAppContext();

    return (
        <Card title="Gerenciador de Catálogos">
            <p className="text-sm text-gray-600 mb-6">
                Visualize os catálogos de dados utilizados nos formulários de solicitação.
                A edição destes catálogos deve ser feita diretamente no sistema de origem (backend).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CatalogList title="Elementos de Despesa" items={expenseTypes} />
                <CatalogList title="Centros de Custo" items={costCenters} />
                <CatalogList title="Polos" items={polos} />
                <CatalogList title="Comarcas" items={comarcas} />
                <CatalogList title="Regiões Judiciárias" items={regioesJudiciarias} />
            </div>
        </Card>
    );
};

export default CatalogManager;
