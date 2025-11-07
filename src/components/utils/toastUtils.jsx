import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import React from "react";

export function useAppToasts() {
  const { toast } = useToast();

  const success = (title, description) =>
    toast({
      title: title || "Sucesso",
      description,
      className: "border-green-200 bg-green-50 text-green-900",
      duration: 3000,
      icon: <CheckCircle2 className="w-4 h-4 text-green-600" />
    });

  const error = (title, description) =>
    toast({
      title: title || "Erro",
      description,
      variant: "destructive",
      duration: 6000,
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />
    });

  const info = (title, description) =>
    toast({
      title: title || "Informação",
      description,
      className: "border-blue-200 bg-blue-50 text-blue-900",
      duration: 3500,
      icon: <Info className="w-4 h-4 text-blue-600" />
    });

  return { success, error, info };
}