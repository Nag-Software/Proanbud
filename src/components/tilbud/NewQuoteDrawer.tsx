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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
  X,
  Plus,
  Trash2,
  Calculator,
  Palette
} from 'lucide-react';
import { createTilbud, TilbudFormData, getUniqueCategoriesFromQuotes } from '@/lib/services/tilbudService';
import { getCustomers } from '@/lib/services/customerService';
import { getBusinessContextForAI } from '@/lib/services/businessService';
import { Kunde, PriceComponent, AIPriceSuggestion } from '@/lib/types';

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
  aiSuggestion: AIPriceSuggestion | null;
  adjustedComponents: PriceComponent[];
  finalPrice: number;
}

const STEPS = [
  { id: 1, title: 'AI-Analyse', description: 'Beskriv jobben og last opp bilder', icon: Sparkles },
  { id: 2, title: 'AI-Prisforslag', description: 'Juster pris basert på AI-analyse', icon: Zap },
  { id: 3, title: 'Prissammendrag', description: 'Gjennomgå og bekreft prising', icon: Calculator },
  { id: 4, title: 'Design', description: 'Velg mal og send tilbud', icon: Palette },
];

export const NewQuoteDrawer: React.FC<NewQuoteDrawerProps> = ({ open, onOpenChange, onTilbudCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    jobDescription: '',
    images: [],
    aiSuggestion: null,
    adjustedComponents: [],
    finalPrice: 0,
  });
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Kunde[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [priceMarkup, setPriceMarkup] = useState<number>(0);
  const [materialMarkup, setMaterialMarkup] = useState<number>(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PriceComponent | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [templateHtml, setTemplateHtml] = useState('');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  // Template download function
  const downloadTemplate = async (templateName: string): Promise<string> => {
    let url = "";
    switch (templateName) {
      case 'modern':
        url = "/templates/template-modern.html";
        break;
      case 'classic':
        url = "/templates/template-classic.html";
        break;
      case 'minimal':
        url = "/templates/template-minimal.html";
        break;
      default:
        url = "/templates/template-modern.html";
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<div>Error loading template</div>';
    }
  };

  // Preview functions
  const handlePreview = async () => {
    setIsLoadingTemplate(true);
    try {
      const template = await downloadTemplate(selectedTemplate);
      setTemplateHtml(template);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error loading template for preview:', error);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const generatePreviewHtml = () => {
    if (!templateHtml) return '';

    let html = templateHtml;
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    // Replace quote placeholders
    html = html.replace(/\{\{quote\.prosjekt\}\}/g, projectName || 'Prosjektnavn');
    html = html.replace(/\{\{quote\.id\}\}/g, 'PREVIEW');
    html = html.replace(/\{\{quote\.dato\}\}/g, new Date().toLocaleDateString('nb-NO'));
    html = html.replace(/\{\{quote\.svarfrist\}\}/g, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('nb-NO'));
    html = html.replace(/\{\{quote\.status\}\}/g, 'Venter på svar');
    html = html.replace(/\{\{quote\.kundenavn\}\}/g, selectedCustomer?.navn || 'Kundenavn');
    html = html.replace(/\{\{quote\.jobbtype\}\}/g, 'Generell');
    html = html.replace(/\{\{quote\.belop\}\}/g, `${quoteData.finalPrice.toLocaleString('nb-NO')} kr`);
    // Handle conditional message block
    const messageContent = quoteMessage || quoteData.jobDescription;
    if (messageContent && messageContent.trim()) {
      // Keep the message block
      html = html.replace(/\{\{#quote\.beskrivelse\}\}([\s\S]*?)\{\{\/quote\.beskrivelse\}\}/g, '$1');
      html = html.replace(/\{\{quote\.beskrivelse\}\}/g, messageContent);
    } else {
      // Remove the message block
      html = html.replace(/\{\{#quote\.beskrivelse\}\}([\s\S]*?)\{\{\/quote\.beskrivelse\}\}/g, '');
    }

    // Generate price components table rows
    let priceComponentsHtml = '';
    if (quoteData.adjustedComponents && quoteData.adjustedComponents.length > 0) {
      quoteData.adjustedComponents.forEach((component, index) => {
        const rowStyle = index % 2 === 0 ? 'background: #f9fafb;' : '';
        priceComponentsHtml += `
          <tr style="${rowStyle}">
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${component.name}<br/><small style="color: #6b7280;">${component.description}</small></td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${component.quantity} ${component.unit}</td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${(component.unitPrice || 0).toLocaleString('nb-NO')} kr</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${component.amount.toLocaleString('nb-NO')} kr</td>
          </tr>
        `;
      });
    } else {
      priceComponentsHtml = `
        <tr>
          <td colspan="4" style="padding: 20px; text-align: center; color: #6b7280; border-bottom: 1px solid #e5e7eb;">
            Ingen prisgrunnlag definert ennå
          </td>
        </tr>
      `;
    }
    html = html.replace(/\{\{quote\.prisgrunnlag\}\}/g, priceComponentsHtml);

    // Replace customer placeholders
    if (selectedCustomer) {
      html = html.replace(/\{\{customer\.epost\}\}/g, selectedCustomer.epost);
      html = html.replace(/\{\{customer\.telefon\}\}/g, selectedCustomer.telefon);
    } else {
      html = html.replace(/\{\{customer\.epost\}\}/g, 'Ikke tilgjengelig');
      html = html.replace(/\{\{customer\.telefon\}\}/g, 'Ikke tilgjengelig');
    }

    // Replace business placeholders (mock data for preview)
    html = html.replace(/\{\{business\.name\}\}/g, 'Din Bedrift AS');
    html = html.replace(/\{\{business\.orgnr\}\}/g, 'Org.nr: 123456789');
    html = html.replace(/\{\{business\.address\}\}/g, 'Gateadresse 123');
    html = html.replace(/\{\{business\.postalCode\}\}/g, '1234');
    html = html.replace(/\{\{business\.city\}\}/g, 'By');
    html = html.replace(/\{\{business\.phone\}\}/g, '+47 123 45 678');
    html = html.replace(/\{\{business\.email\}\}/g, 'kontakt@dinbedrift.no');
    html = html.replace(/\{\{business\.website\}\}/g, 'www.dinbedrift.no');
    html = html.replace(/\{\{business\.logoUrl\}\}/g, '');
    html = html.replace(/\{\{business\.bankAccount\}\}/g, 'Kontonummer: 1234 56 78901');

    return html;
  };

  // Generate AI price suggestion based on job description and images
  const generateAIPriceSuggestion = (jobDescription: string, imageCount: number): AIPriceSuggestion => {
    // Mock AI analysis - in real implementation this would call an AI service
    const basePrice = Math.round((Math.random() * 50000 + 10000) / 100) * 100;
    
    const components: PriceComponent[] = [
      {
        id: 'materials',
        category: 'materialer',
        name: 'Materialkostnader',
        description: 'Byggematerialer, verktøy og forbruksvarer',
        amount: Math.round(basePrice * 0.25),
        quantity: 1,
        unit: 'pakke',
        unitPrice: Math.round(basePrice * 0.25),
        priceMarkup: priceMarkup,
        materialMarkup: materialMarkup,
        isEditable: true,
        confidence: 85,
      },
      {
        id: 'labor',
        category: 'arbeid',
        name: 'Arbeidskraft',
        description: 'Timelønn for håndverkere og spesialister',
        amount: Math.round(basePrice * 0.5),
        quantity: Math.round((basePrice * 0.5) / 800), // Calculate quantity based on amount and unit price
        unit: 'timer',
        unitPrice: 800,
        priceMarkup: priceMarkup,
        materialMarkup: materialMarkup,
        isEditable: true,
        confidence: 78,
      },
      {
        id: 'transport',
        category: 'transport',
        name: 'Transport og opprydding',
        description: 'Transport av materialer og arbeidsplassopprydding',
        amount: Math.round(basePrice * 0.1),
        quantity: 1,
        unit: 'oppdrag',
        unitPrice: Math.round(basePrice * 0.1),
        priceMarkup: priceMarkup,
        materialMarkup: materialMarkup,
        isEditable: true,
        confidence: 92,
      },
      {
        id: 'equipment',
        category: 'utstyr',
        name: 'Utstyr og verktøy',
        description: 'Leie av spesialverktøy og utstyr',
        amount: Math.round(basePrice * 0.05),
        quantity: 1,
        unit: 'dag',
        unitPrice: Math.round(basePrice * 0.05),
        priceMarkup: priceMarkup,
        materialMarkup: materialMarkup,
        isEditable: true,
        confidence: 70,
      },
      {
        id: 'margin',
        category: 'margin',
        name: 'Margin og fortjeneste',
        description: 'Bedriftens fortjeneste og risikoavdekning',
        amount: Math.round(basePrice * 0.1),
        quantity: 10,
        unit: '%',
        unitPrice: Math.round(basePrice * 0.01),
        priceMarkup: priceMarkup,
        materialMarkup: materialMarkup,
        isEditable: true,
        confidence: 95,
      },
    ];

    const totalPrice = components.reduce((sum, comp) => sum + comp.amount, 0);
    const overallConfidence = Math.round(components.reduce((sum, comp) => sum + comp.confidence, 0) / components.length);

    return {
      totalPrice,
      confidence: overallConfidence,
      components,
      reasoning: ``,
      alternatives: {
        conservative: Math.round(totalPrice * 0.85),
        aggressive: Math.round(totalPrice * 1.15),
      },
    };
  };

  // Load customers when drawer opens
  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  // Update component prices when markup changes
  useEffect(() => {
    setQuoteData(prev => {
      const updatedComponents = prev.adjustedComponents.map(comp => {
        const markup = comp.category === 'materialer' ? (materialMarkup > 0 ? materialMarkup : priceMarkup) : priceMarkup;
        const markupMultiplier = 1 + (markup / 100);
        return {
          ...comp,
          priceMarkup: comp.category === 'materialer' ? priceMarkup : priceMarkup,
          materialMarkup: materialMarkup,
          amount: Math.round((comp.unitPrice || 0) * (comp.quantity || 0) * markupMultiplier),
        };
      });
      const newTotal = updatedComponents.reduce((sum, comp) => sum + comp.amount, 0);
      return {
        ...prev,
        adjustedComponents: updatedComponents,
        finalPrice: newTotal,
      };
    });
  }, [priceMarkup, materialMarkup]);

  const loadCustomers = async () => {
    try {
      const customerList = await getCustomers();
      setCustomers(customerList);
      
      // Load categories from existing quotes
      const categories = await getUniqueCategoriesFromQuotes();
      const customCats = categories.filter(cat => !['materialer', 'arbeid', 'transport', 'utstyr', 'margin', 'annet'].includes(cat));
      setCustomCategories(customCats);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setQuoteData({
      jobDescription: '',
      images: [],
      aiSuggestion: null,
      adjustedComponents: [],
      finalPrice: 0,
    });
    setSelectedCustomerId('');
    setProjectName('');
    setQuoteMessage('');
    setIsSubmitting(false);
    setShowAddCategory(false);
    setNewCategoryName('');
    onOpenChange(false);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      setIsAnalyzing(true);
      setAiError(null);
      try {
        const businessInfo = await getBusinessContextForAI();
        const response = await fetch('/api/ai-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: quoteData.jobDescription,
            businessInfo,
          }),
        });

        if (!response.ok) throw new Error('AI-tjeneste feilet: ' + response.statusText);

        // Håndter respons som streng med ''' eller ``` rundt, også med linjeskift og ekstra tekst
        const responseText = await response.json()
        // Clean response: remove code block markers and trim whitespace
        console.log("RESPONSE", responseText)

        const aiSuggestion: AIPriceSuggestion = responseText;

        if (aiSuggestion) {
          const adjustedComponents = aiSuggestion.components.map((comp: any) => ({
            ...comp,
            priceMarkup: priceMarkup,
            materialMarkup: materialMarkup,
            amount: calculateAmountWithMarkup({
              ...comp,
              priceMarkup: priceMarkup,
              materialMarkup: materialMarkup,
            }),
          }));
          setQuoteData(prev => ({
            ...prev,
            aiSuggestion,
            adjustedComponents,
            finalPrice: adjustedComponents.reduce((sum: number, comp: any) => sum + comp.amount, 0),
          }));
          setIsAnalyzing(false);
          // We've already advanced to the next logical step for analysis results.
          // Return early to avoid the generic increment at the end of the function
          // which was causing a double increment (skipping step 2).
          setCurrentStep(prev => prev + 1);
          return;
        } else {
          throw new Error('Uventet respons fra AI-tjeneste');
        }
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'Ukjent feil ved AI-analyse.');
        setIsAnalyzing(false);
        return; // Don't proceed to next step
      }
      // Don't set isAnalyzing to false here - it will be done when polling completes
    }
    
    if (currentStep === 4) {
      // Handle submission
      await handleSubmit();
    } else if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const pollForResults = (responseId: string) => {
    const sseUrl = `/api/ai-pricing?correlationId=${responseId}`;
    const eventSource = new window.EventSource(sseUrl);
    eventSource.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data);
        // Success! Process the AI results
        if (result && result.payload) {
          const adjustedComponents = result.payload.components?.map((comp: any) => ({
            ...comp,
            priceMarkup: priceMarkup,
            materialMarkup: materialMarkup,
            amount: calculateAmountWithMarkup({
              ...comp,
              priceMarkup: priceMarkup,
              materialMarkup: materialMarkup,
            }),
          })) || [];
          setQuoteData(prev => ({
            ...prev,
            aiSuggestion: result.payload,
            adjustedComponents,
            finalPrice: adjustedComponents.reduce((sum: number, comp: any) => sum + comp.amount, 0),
          }));
          setIsAnalyzing(false);
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing SSE result:', error);
        setAiError('Kunne ikke hente AI-resultater');
        setIsAnalyzing(false);
        eventSource.close();
      }
    };
    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setAiError('AI-analyse feilet (SSE)');
      setIsAnalyzing(false);
      eventSource.close();
    };
    // No polling timeout needed for SSE
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
        belop: quoteData.finalPrice,
        status: 'venter' as const,
        dato: new Date().toISOString().split('T')[0],
        svarfrist: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        beskrivelse: quoteMessage || quoteData.jobDescription,
        notater: `AI-generert tilbud med ${quoteData.adjustedComponents.length} prisgrunnlagskomponenter`,
        prisgrunnlag: quoteData.adjustedComponents,
        template: selectedTemplate,
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
    } else {
      handleClose();
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

      {aiError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{aiError}</p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Button onClick={handlePrevious} variant="outline" className="flex-1">
          Tilbake
        </Button>
        {canProceed && (
          <Button onClick={handleNext} className="flex-1" disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyserer...' : 'Neste'}
          </Button>
        )}
      </div>
    </div>
  );

  const openEditDialog = (component: PriceComponent, field: 'name' | 'description') => {
    setEditingComponent(component);
    setEditingField(field);
    setEditValue(component[field]);
    setEditDialogOpen(true);
  };

  const saveEditDialog = () => {
    if (editingComponent && editingField) {
      updateComponent(editingComponent.id, { [editingField]: editValue });
    }
    setEditDialogOpen(false);
    setEditingComponent(null);
    setEditingField(null);
    setEditValue('');
  };

  const calculateAmountWithMarkup = (component: PriceComponent, quantity?: number, unitPrice?: number) => {
    const qty = quantity !== undefined ? quantity : component.quantity || 1;
    const price = unitPrice !== undefined ? unitPrice : component.unitPrice || 0;
    const markup = component.category === 'materialer' ? (materialMarkup > 0 ? materialMarkup : priceMarkup) : priceMarkup;
    const markupMultiplier = 1 + (markup / 100);
    return Math.round(qty * price * markupMultiplier);
  };

  const updateComponent = (id: string, updates: Partial<PriceComponent>) => {
    setQuoteData(prev => {
      const updatedComponents = prev.adjustedComponents.map(comp => {
        if (comp.id === id) {
          const updatedComp = { ...comp, ...updates };
          // Recalculate amount if quantity or unitPrice changed
          if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
            updatedComp.amount = calculateAmountWithMarkup(updatedComp);
          }
          return updatedComp;
        }
        return comp;
      });
      const newTotal = updatedComponents.reduce((sum, comp) => sum + comp.amount, 0);
      return {
        ...prev,
        adjustedComponents: updatedComponents,
        finalPrice: newTotal,
      };
    });
  };

  const addComponent = () => {
    const newComponent: PriceComponent = {
      id: `custom-${Date.now()}`,
      category: 'annet',
      name: 'Ny komponent',
      description: 'Beskrivelse av komponenten',
      amount: 0,
      quantity: 1,
      unit: 'stk',
      unitPrice: 0,
      priceMarkup: priceMarkup,
      materialMarkup: materialMarkup,
      isEditable: true,
      confidence: 0, // 0 indicates user-added component, not AI-generated
    };
    setQuoteData(prev => ({
      ...prev,
      adjustedComponents: [...prev.adjustedComponents, newComponent],
    }));
  };

  const removeComponent = (id: string) => {
    setQuoteData(prev => {
      const updatedComponents = prev.adjustedComponents.filter(comp => comp.id !== id);
      const newTotal = updatedComponents.reduce((sum, comp) => sum + comp.amount, 0);
      return {
        ...prev,
        adjustedComponents: updatedComponents,
        finalPrice: newTotal,
      };
    });
  };

  const renderStep2 = () => {
    const addComponent = () => {
      const newComponent: PriceComponent = {
        id: `custom-${Date.now()}`,
        category: 'annet',
        name: 'Ny komponent',
        description: 'Beskrivelse av komponenten',
        amount: 0,
        quantity: 1,
        unit: 'stk',
        unitPrice: 0,
        priceMarkup: priceMarkup,
        materialMarkup: materialMarkup,
        isEditable: true,
        confidence: 0, // 0 indicates user-added component, not AI-generated
      };
      setQuoteData(prev => ({
        ...prev,
        adjustedComponents: [...prev.adjustedComponents, newComponent],
      }));
    };

    const removeComponent = (id: string) => {
      setQuoteData(prev => {
        const updatedComponents = prev.adjustedComponents.filter(comp => comp.id !== id);
        const newTotal = updatedComponents.reduce((sum, comp) => sum + comp.amount, 0);
        return {
          ...prev,
          adjustedComponents: updatedComponents,
          finalPrice: newTotal,
        };
      });
    };

    const addCategory = async () => {
      if (newCategoryName.trim() && !customCategories.includes(newCategoryName.trim())) {
        const updatedCategories = [...customCategories, newCategoryName.trim()];
        setCustomCategories(updatedCategories);
        setNewCategoryName('');
        setShowAddCategory(false);
      }
    };

    const removeCategory = async (categoryName: string) => {
      // Don't allow removing default categories
      const defaultCategories = ['materialer', 'arbeid', 'transport', 'utstyr', 'margin', 'annet'];
      if (!defaultCategories.includes(categoryName)) {
        const updatedCategories = customCategories.filter(cat => cat !== categoryName);
        setCustomCategories(updatedCategories);
        
        // Update any components using this category to 'annet'
        setQuoteData(prev => ({
          ...prev,
          adjustedComponents: prev.adjustedComponents.map(comp =>
            comp.category === categoryName ? { ...comp, category: 'annet' as PriceComponent['category'] } : comp
          ),
        }));
      }
    };

    const getAllCategories = () => {
      const defaultCategories = [
        { value: 'materialer', label: 'Materialer', isCustom: false },
        { value: 'arbeid', label: 'Arbeid', isCustom: false },
        { value: 'transport', label: 'Transport', isCustom: false },
        { value: 'utstyr', label: 'Utstyr', isCustom: false },
        { value: 'margin', label: 'Margin', isCustom: false },
        { value: 'annet', label: 'Annet', isCustom: false },
      ];
      
      const customCategoryOptions = customCategories.map(cat => ({
        value: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        isCustom: true,
      }));
      
      return [...defaultCategories, ...customCategoryOptions];
    };

    const getConfidenceColor = (confidence: number) => {
      if (confidence >= 80) return 'text-green-600 bg-green-100';
      if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';
    };

    const getCategoryLabel = (category: PriceComponent['category']) => {
      const labels = {
        materialer: 'Materialer',
        arbeid: 'Arbeid',
        transport: 'Transport',
        utstyr: 'Utstyr',
        margin: 'Margin',
        annet: 'Annet',
      };
      return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
    };

    return (
      <div className="space-y-6">
        {isAnalyzing ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-gray-600">AI analyserer jobben...</p>
          </div>
        ) : quoteData.aiSuggestion && (
          <>
            {/* AI Confidence and Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    AI-Prisforslag
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(quoteData.aiSuggestion.confidence)}`}>
                    {quoteData.aiSuggestion.confidence}% sikkerhet
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary mb-2">
                    kr {quoteData.finalPrice.toLocaleString('nb-NO')},-
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {quoteData.aiSuggestion.reasoning}
                  </p>
                  {quoteData.aiSuggestion.alternatives && (
                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                      <span>Konservativ: kr {quoteData.aiSuggestion.alternatives.conservative.toLocaleString('nb-NO')}</span>
                      <span>•</span>
                      <span>Offensiv: kr {quoteData.aiSuggestion.alternatives.aggressive.toLocaleString('nb-NO')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Interactive Price Components Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Priskomponenter</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={addComponent} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Legg til komponent
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Category Management */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Kategorier</h4>
                    <Button 
                      onClick={() => setShowAddCategory(!showAddCategory)} 
                      size="sm" 
                      variant="ghost"
                      className="text-primary hover:text-primary/80"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ny kategori
                    </Button>
                  </div>
                  
                  {showAddCategory && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Kategorinavn..."
                        className="flex-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary"
                        onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                      />
                      <Button onClick={addCategory} size="sm" variant="outline">
                        Legg til
                      </Button>
                      <Button onClick={() => setShowAddCategory(false)} size="sm" variant="ghost">
                        Avbryt
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {getAllCategories().map((cat) => (
                      <div key={cat.value} className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs">
                        <span>{cat.label}</span>
                        {cat.isCustom && (
                          <button
                            onClick={() => removeCategory(cat.value)}
                            className="text-red-500 hover:text-red-700 ml-1"
                            title="Fjern kategori"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Markup inputs */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Påslag (%)
                    </label>
                    <input
                      type="number"
                      value={priceMarkup}
                      onChange={(e) => {
                        setPriceMarkup(Number(e.target.value));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="0"
                      step="1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materialpåslag (%)
                    </label>
                    <input
                      type="number"
                      value={materialMarkup}
                      onChange={(e) => {
                        setMaterialMarkup(Number(e.target.value));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="0"
                      step="1"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Kategori</th>
                        <th className="text-left py-2 px-2 min-w-[200px]">Navn</th>
                        <th className="text-left py-2 px-2">Beskrivelse</th>
                        <th className="text-right py-2 px-2">Antall</th>
                        <th className="text-right py-2 px-2">Enhet</th>
                        <th className="text-right py-2 px-2">Enhetspris</th>
                        <th className="text-right py-2 px-2">Total</th>
                        <th className="text-center py-2 px-2">Sikkerhet</th>
                        <th className="text-center py-2 px-2">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteData.adjustedComponents.map((component) => (
                        <tr key={component.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">
                            {component.isEditable ? (
                              <Select
                                value={component.category}
                                onValueChange={(value) => updateComponent(component.id, { category: value as PriceComponent['category'] })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAllCategories().map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm font-medium">
                                {getCategoryLabel(component.category)}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 min-w-[200px]">
                            {component.isEditable ? (
                              <input
                                type="text"
                                value={component.name}
                                onClick={() => openEditDialog(component, 'name')}
                                readOnly
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary cursor-pointer"
                              />
                            ) : (
                              <span className="text-sm">{component.name}</span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            {component.isEditable ? (
                              <input
                                type="text"
                                value={component.description}
                                onClick={() => openEditDialog(component, 'description')}
                                readOnly
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary cursor-pointer"
                              />
                            ) : (
                              <span className="text-sm text-gray-600">{component.description}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {component.isEditable ? (
                              <input
                                type="number"
                                value={component.quantity || 1}
                                onChange={(e) => {
                                  const quantity = Number(e.target.value);
                                  updateComponent(component.id, {
                                    quantity,
                                  });
                                }}
                                className="w-16 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                min="0"
                                step="0.1"
                              />
                            ) : (
                              <span className="text-sm">{component.quantity} {component.unit}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {component.isEditable ? (
                              <input
                                type="text"
                                value={component.unit || ''}
                                onChange={(e) => updateComponent(component.id, { unit: e.target.value })}
                                className="w-16 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                placeholder="stk"
                              />
                            ) : (
                              <span className="text-sm">{component.unit}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {component.isEditable ? (
                              <input
                                type="number"
                                value={component.unitPrice || 0}
                                onChange={(e) => {
                                  const unitPrice = Number(e.target.value);
                                  updateComponent(component.id, {
                                    unitPrice,
                                  });
                                }}
                                className="w-20 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                min="0"
                                step="10"
                              />
                            ) : (
                              <span className="text-sm">kr {component.unitPrice?.toLocaleString('nb-NO')}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <span className="text-sm font-medium">
                              kr {component.amount.toLocaleString('nb-NO')}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            {component.confidence > 0 ? (
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(component.confidence)}`}>
                                {component.confidence}%
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {component.isEditable && (
                              <Button
                                onClick={() => removeComponent(component.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                title="Fjern komponent"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Fjern
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 font-bold">
                        <td colSpan={6} className="py-3 px-2 text-right">Total:</td>
                        <td className="py-3 px-2 text-right text-lg whitespace-nowrap">
                          kr {quoteData.finalPrice.toLocaleString('nb-NO')}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handlePrevious}
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake
        </Button>
        <Button 
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleNext}
        >
          <ArrowRight className="w-4 h-4" />
          Neste
        </Button>
      </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Prissammendrag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Total Price Summary with AI Score */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex-1 w-full sm:w-auto text-center p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Total tilbudssum</h3>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary whitespace-nowrap">
                  kr {quoteData.finalPrice.toLocaleString('nb-NO')},-
                </div>
              </div>

              {/* AI Score with Progress Circle */}
              {(() => {
                const aiComponents = quoteData.adjustedComponents.filter(c => c.confidence > 0);
                const totalComponents = quoteData.adjustedComponents.length;
                const aiRatio = totalComponents > 0 ? aiComponents.length / totalComponents : 0;
                
                // Helhetsvurdering: Kombinerer AI-confidence med AI-andel
                const avgConfidence = aiComponents.length > 0 
                  ? Math.round(aiComponents.reduce((sum, c) => sum + c.confidence, 0) / aiComponents.length)
                  : 0;
                
                // Juster score basert på hvor mye som er AI-generert
                const overallScore = Math.round(avgConfidence * aiRatio + (avgConfidence * 0.3) * (1 - aiRatio));
                
                const getScoreColor = (score: number) => {
                  if (score >= 80) return '#10B981'; // green-500
                  if (score >= 60) return '#F59E0B'; // yellow-500
                  return '#EF4444'; // red-500
                };
                
                const strokeColor = getScoreColor(overallScore);
                const circumference = 2 * Math.PI * 35; // radius = 35 (litt mindre)
                const strokeDasharray = circumference;
                const strokeDashoffset = circumference - (overallScore / 100) * circumference;
                
                return (
                  <div className="flex-shrink-0 w-full sm:w-auto text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                    <div className="relative inline-flex items-center justify-center mb-2">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 80 80">
                        {/* Background circle */}
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="#E5E7EB"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke={strokeColor}
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-lg sm:text-xl font-bold ${
                            overallScore >= 80 ? 'text-green-600' :
                            overallScore >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {overallScore}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">AI-score</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {aiComponents.length}/{totalComponents} komponenter
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Price Breakdown */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Prisgrunnlag</h4>
              <div className="space-y-3">
                {quoteData.adjustedComponents.map((component, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{component.name}</span>
                        {component.confidence > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            component.confidence >= 80 ? 'bg-green-100 text-green-700' :
                            component.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {component.confidence}% sikkerhet
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{component.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Kategori: {component.category.charAt(0).toUpperCase() + component.category.slice(1)}</span>
                        {component.quantity && component.unit && (
                          <span>Antall: {component.quantity} {component.unit}</span>
                        )}
                        {component.unitPrice && (
                          <span>Enhetspris: kr {component.unitPrice.toLocaleString('nb-NO')}</span>
                        )}
                        {component.priceMarkup && component.priceMarkup > 0 && (
                          <span>Prispåslag: {component.priceMarkup}%</span>
                        )}
                        {component.materialMarkup && component.materialMarkup > 0 && (
                          <span>Materialpåslag: {component.materialMarkup}%</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        kr {component.amount.toLocaleString('nb-NO')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{quoteData.adjustedComponents.length}</div>
                <div className="text-sm text-gray-600">Priskomponenter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {quoteData.adjustedComponents.filter(c => c.confidence > 0).length}
                </div>
                <div className="text-sm text-gray-600">AI-genererte</div>
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
          <ArrowLeft className="w-4 h-4" />
          Tilbake
        </Button>
        <Button 
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleNext}
        >
          <ArrowRight className="w-4 h-4" />
          Neste
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Design & Send
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Melding til kunde (valgfri)
            </label>
            <textarea
              value={quoteMessage}
              onChange={(e) => setQuoteMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Skriv en beskrivelse eller melding til kunden..."
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Denne meldingen vil vises øverst i tilbudet
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Velg mal
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTemplate('modern')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplate === 'modern'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Moderne
              </button>
              <button
                onClick={() => setSelectedTemplate('classic')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplate === 'classic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Klassisk
              </button>
              <button
                onClick={() => setSelectedTemplate('minimal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplate === 'minimal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Minimal
              </button>
            </div>
          </div>

          {/* Preview Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handlePreview}
              disabled={isLoadingTemplate || !selectedCustomerId || !projectName}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {isLoadingTemplate ? 'Laster forhåndsvisning...' : 'Forhåndsvis tilbud'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handlePrevious}
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake
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
    : currentStep === 4 
    ? selectedCustomerId && projectName.trim().length > 0
    : true;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className='max-h-[130px]'>
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
          {currentStep === 4 && renderStep4()}
        </div>
      </DrawerContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Rediger {editingField === 'name' ? 'navn' : 'beskrivelse'}
            </DialogTitle>
            <DialogDescription>
              Endre {editingField === 'name' ? 'navnet' : 'beskrivelsen'} for denne komponenten.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={editingField === 'name' ? 'Skriv navn...' : 'Skriv beskrivelse...'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={saveEditDialog}>
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Forhåndsvisning av tilbud</DialogTitle>
            <DialogDescription>
              Dette er hvordan tilbudet vil se ut for kunden med den valgte malen.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div 
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
};