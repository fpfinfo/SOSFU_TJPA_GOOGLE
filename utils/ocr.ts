
import { ExpenseItem, ExtractedData } from "../types";

// Helper to add variability to dates
const alterDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    // Add a day to simulate a common OCR error
    date.setDate(date.getDate() + 2); // To account for timezone differences
    // Return in a different format
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Simula uma chamada de API de OCR para extrair dados de um comprovante.
 * Introduz um atraso e possíveis pequenas discrepâncias para um teste realista.
 */
export const simulateOcrExtraction = (item: ExpenseItem): Promise<ExtractedData> => {
    return new Promise(resolve => {
        // Random delay between 1 and 3 seconds
        const delay = 1000 + Math.random() * 2000;

        setTimeout(() => {
            const randomFactor = Math.random();
            let extractedData: ExtractedData = {};

            // 80% chance of successful extraction
            if (randomFactor > 0.2) {
                // 50% chance of amount discrepancy
                if (Math.random() > 0.5) {
                    // Introduce a small difference in the amount
                    const difference = (Math.random() - 0.5) * 5; // +/- R$ 2.50
                    extractedData.amount = parseFloat((item.amount + difference).toFixed(2));
                } else {
                    extractedData.amount = item.amount;
                }

                // 50% chance of date discrepancy
                if (Math.random() > 0.5) {
                    extractedData.date = alterDate(item.date);
                } else {
                    // Return in YYYY-MM-DD
                    const d = new Date(item.date);
                    d.setDate(d.getDate() + 1); // fix timezone issues
                    extractedData.date = d.toISOString().split('T')[0];
                }

            } else {
                // 20% chance of extraction failure (returns empty object)
                extractedData = {};
            }
            
            resolve(extractedData);
        }, delay);
    });
};
