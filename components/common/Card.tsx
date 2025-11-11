
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

const Card: React.FC<CardProps> = ({ children, className, title }) => {
    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
            {title && (
                 <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                </div>
            )}
            <div className="p-4 sm:p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;
