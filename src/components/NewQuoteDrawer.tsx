import React, { useState } from 'react';
import { getBusinessContextForAI } from '@/lib/services/businessService';

// Assume a simple DataTable component; replace with your actual one (e.g., from react-table)
interface DataTableProps {
  data: any[];
}
const DataTable: React.FC<DataTableProps> = ({ data }) => (
  <table className="w-full border-collapse border border-gray-300">
    <thead>
      <tr>
        <th className="border border-gray-300 p-2">Komponent</th>
        <th className="border border-gray-300 p-2">Pris</th>
        <th className="border border-gray-300 p-2">Beskrivelse</th>
      </tr>
    </thead>
    <tbody>
      {data.map((item, index) => (
        <tr key={index}>
          <td className="border border-gray-300 p-2">{item.komponent}</td>
          <td className="border border-gray-300 p-2">{item.pris}</td>
          <td className="border border-gray-300 p-2">{item.beskrivelse}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Function to fetch business info from database
const fetchBusinessInfo = async () => {
  return await getBusinessContextForAI();
};

interface NewQuoteDrawerProps {
  onClose: () => void;
}

export const NewQuoteDrawer: React.FC<NewQuoteDrawerProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<'ai-analyse' | 'ai-prisforslag'>('ai-analyse');
  const [prompt, setPrompt] = useState(''); // jobb-beskrivelse
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (!prompt.trim()) {
      setError('Prompt er påkrevd.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const businessInfo = await fetchBusinessInfo();
      const response = await fetch('/api/ai-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, businessInfo }),
      });
      if (!response.ok) throw new Error('AI-tjeneste feilet: ' + response.statusText);
      const data = await response.json();
      
      // Validate response structure
      if (!data || !data.components || !Array.isArray(data.components)) {
        throw new Error('Ugyldig respons fra AI-tjeneste. Mangler komponenter.');
      }
      
      setAiResponse(data);
      setCurrentStep('ai-prisforslag');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent feil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
      <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto">
        <button onClick={onClose} className="mb-4 text-red-500">Lukk</button>
        
        {currentStep === 'ai-analyse' && (
          <div>
            <h2 className="text-xl font-bold mb-4">AI-Analyse</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Skriv jobb-beskrivelse..."
              className="w-full p-2 border rounded mb-4"
              rows={4}
            />
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              onClick={handleNext}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Sender...' : 'Neste'}
            </button>
          </div>
        )}

        {currentStep === 'ai-prisforslag' && aiResponse && (
          <div>
            <h2 className="text-xl font-bold mb-4">AI-Prisforslag</h2>
            <h3 className="text-lg mb-2">Priskomponenter</h3>
            <DataTable data={aiResponse.priskomponenter || []} />
            <button onClick={() => setCurrentStep('ai-analyse')} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">
              Tilbake
            </button>
          </div>
        )}
      </div>
    </div>
  );
};