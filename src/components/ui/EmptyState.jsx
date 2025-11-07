import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function EmptyState({ icon: Icon = FileText, title, description, action }) {
  return (
    <div className="text-center py-12 px-4 bg-white/60 rounded-xl border">
      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}