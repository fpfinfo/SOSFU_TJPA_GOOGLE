import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const PrintableDocument = ({ 
  title, 
  children, 
  className = "",
  showPrintButton = true 
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-document, .printable-document * {
            visibility: visible;
          }
          .printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
          .page-break {
            page-break-after: always;
          }
          .page-break:last-child {
            page-break-after: auto;
          }
        }
      `}</style>

      <div className={`bg-white ${className}`}>
        {showPrintButton && (
          <div className="no-print mb-4 flex justify-end">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir {title}
            </Button>
          </div>
        )}
        
        <div className="printable-document">
          {children}
        </div>
      </div>
    </>
  );
};

export default PrintableDocument;