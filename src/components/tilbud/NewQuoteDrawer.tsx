'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Sparkles, 
  Zap,
  Eye,
  Send,
  Edit3,
  X
} from 'lucide-react';
import { createTilbud, TilbudFormData } from '@/lib/services/tilbudService';
import { getCustomers } from '@/lib/services/customerService';
import { Kunde } from '@/lib/types';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NewQuoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTilbudCreated?: () => void;
}

interface QuoteData {
  jobDescription: string;
  images: File[];
  aiPrice: number;
  adjustedPrice: number;
  priceBasis: string[];
}

const STEPS = [
  { id: 1, title: 'AI-Analyse', description: 'Beskriv jobben og last opp bilder', icon: Sparkles },
  { id: 2, title: 'AI-Prisforslag', description: 'Juster pris basert på AI-analyse', icon: Zap },
  { id: 3, title: 'Send Tilbud', description: 'Forhåndsvis og send tilbud', icon: Send },
];

export const NewQuoteDrawer: React.FC<NewQuoteDrawerProps> = ({ open, onOpenChange, onTilbudCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    jobDescription: '',
    images: [],
    aiPrice: 0,
    adjustedPrice: 0,
    priceBasis: [],
  });
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customers, setCustomers] = useState<Kunde[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Load customers when drawer opens
  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      const customerList = await getCustomers();
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setQuoteData({
      jobDescription: '',
      images: [],
      aiPrice: 0,
      adjustedPrice: 0,
      priceBasis: [],
    });
    setSelectedCustomerId('');
    setProjectName('');
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Simulate AI analysis
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI price calculation
      const mockPrice = Math.round((Math.random() * 50000 + 10000) / 100) * 100;
      setQuoteData(prev => ({
        ...prev,
        aiPrice: mockPrice,
        adjustedPrice: mockPrice,
        priceBasis: [
          'Materialkostnader: kr 8.500,-',
          'Arbeidstimer (16t): kr 12.800,-',
          'Transport og opprydding: kr 2.200,-',
          'Margin (15%): kr 3.000,-'
        ]
      }));
      setIsAnalyzing(false);
    }
    
    if (currentStep === 3) {
      // Handle submission
      await handleSubmit();
    } else if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId || !projectName) {
      alert('Vennligst velg kunde og skriv prosjektnavn');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      
      const tilbudData: TilbudFormData = {
        kundenavn: selectedCustomer?.navn || '',
        prosjekt: projectName,
        jobbtype: 'Generell',
        belop: quoteData.adjustedPrice,
        status: 'venter' as const,
        dato: new Date().toISOString().split('T')[0],
        svarfrist: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        beskrivelse: quoteData.jobDescription,
        notater: quoteData.priceBasis.join('\n'),
      };

      await createTilbud(tilbudData);
      onTilbudCreated?.();
      handleClose();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating tilbud:', error);
      alert('Feil ved oppretting av tilbud. Prøv igjen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    setQuoteData(prev => ({
      ...prev,
      images: [...prev.images, ...imageFiles].slice(0, 5) // Max 5 images
    }));
  }, []);

  const removeImage = (index: number) => {
    setQuoteData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handlePriceChange = (value: number) => {
    setQuoteData(prev => ({
      ...prev,
      adjustedPrice: Math.round(value / 100) * 100 // Snap to 100kr increments
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const IconComponent = step.icon;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
              ${isActive ? 'bg-primary text-primary-foreground border-primary' : ''}
              ${isCompleted ? 'bg-green-500 text-white border-green-500' : ''}
              ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400 border-gray-200' : ''}
            `}>
              <IconComponent className="w-5 h-5" />
            </div>
            
            {index < STEPS.length - 1 && (
              <div className={`
                w-12 h-0.5 mx-2 transition-all
                ${step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Jobbeskrivelse
        </label>
        <textarea
          value={quoteData.jobDescription}
          onChange={(e) => setQuoteData(prev => ({ ...prev, jobDescription: e.target.value }))}
          placeholder="Beskriv jobben som skal utføres..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bilder (Valgfritt)
        </label>
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Dra og slipp bilder her, eller klikk for å velge
          </p>
          <p className="text-xs text-gray-500">
            Maks 5 bilder, PNG, JPG eller WEBP
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setQuoteData(prev => ({
                ...prev,
                images: [...prev.images, ...files].slice(0, 5)
              }));
            }}
          />
        </div>

        {quoteData.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {quoteData.images.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {isAnalyzing ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-gray-600">AI analyserer jobben...</p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                AI-Prisforslag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  kr {quoteData.adjustedPrice.toLocaleString('nb-NO')},-
                </div>
                <p className="text-sm text-gray-600">
                  Basert på AI-analyse av jobbeskrivelse
                  {quoteData.images.length > 0 && ` og ${quoteData.images.length} bilde${quoteData.images.length > 1 ? 'r' : ''}`}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Juster pris
                </label>
                <input
                  type="range"
                  min={Math.max(5000, quoteData.aiPrice * 0.5)}
                  max={quoteData.aiPrice * 2}
                  step={100}
                  value={quoteData.adjustedPrice}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>kr {Math.max(5000, Math.round(quoteData.aiPrice * 0.5 / 100) * 100).toLocaleString('nb-NO')}</span>
                  <span>kr {(Math.round(quoteData.aiPrice * 2 / 100) * 100).toLocaleString('nb-NO')}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Prisgrunnlag</h4>
                <div className="space-y-2">
                  {quoteData.priceBasis.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Send Tilbud
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Velg kunde
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Velg en kunde...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.navn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prosjektnavn
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Skriv inn prosjektnavn..."
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Forhåndsvisning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tilbud</h3>
              <div className="text-3xl font-bold text-primary">
                kr {quoteData.adjustedPrice.toLocaleString('nb-NO')},-
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Jobbeskrivelse</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {quoteData.jobDescription || 'Ingen beskrivelse angitt'}
                </p>
              </div>

              {quoteData.images.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Vedlagte bilder</h4>
                  <p className="text-gray-600 text-sm">
                    {quoteData.images.length} bilde{quoteData.images.length > 1 ? 'r' : ''} vedlagt
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Prissammendrag</h4>
                <div className="space-y-1">
                  {quoteData.priceBasis.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handlePrevious}
        >
          <Edit3 className="w-4 h-4" />
          Endre
        </Button>
        <Button 
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedCustomerId || !projectName}
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Sender...' : 'Send Tilbud'}
        </Button>
      </div>
    </div>
  );

  const currentStepData = STEPS.find(step => step.id === currentStep);
  const canProceed = currentStep === 1 
    ? quoteData.jobDescription.trim().length > 0 
    : currentStep === 3 
    ? selectedCustomerId && projectName.trim().length > 0
    : true;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl font-bold">
                {currentStepData?.title}
              </DrawerTitle>
              <DrawerDescription>
                {currentStepData?.description}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
          {renderStepIndicator()}
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto flex-1">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <DrawerFooter>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Tilbake
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed || isAnalyzing}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin w-4 h-4">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    Analyserer...
                  </>
                ) : (
                  <>
                    Neste
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Lukk
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};