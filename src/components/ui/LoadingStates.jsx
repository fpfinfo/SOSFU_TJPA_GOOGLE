import React from "react";
import { Loader2, FileText, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const PageLoading = ({ message = "Carregando..." }) => (
  <div className="p-6 text-center flex flex-col items-center justify-center h-full min-h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
    <p className="text-gray-600">{message}</p>
  </div>
);

export const TableLoading = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse space-y-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4">
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardLoading = ({ className = "" }) => (
  <Card className={className}>
    <CardContent className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const EmptyState = ({ 
  icon: Icon = FileText, 
  title = "Nenhum item encontrado", 
  description = "",
  actionButton = null,
  className = ""
}) => (
  <div className={`text-center py-12 text-gray-500 ${className}`}>
    <Icon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
    {actionButton}
  </div>
);

export const ErrorState = ({ 
  title = "Erro ao carregar dados", 
  description = "Ocorreu um erro inesperado. Tente novamente.",
  onRetry = null,
  className = ""
}) => (
  <div className={`text-center py-12 ${className}`}>
    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tentar Novamente
      </button>
    )}
  </div>
);

export default {
  PageLoading,
  TableLoading,
  CardLoading,
  EmptyState,
  ErrorState
};