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
import { createTilbud, updateTilbud, getTilbudById, TilbudFormData, getUniqueCategoriesFromQuotes } from '@/lib/services/tilbudService';
import { getCustomers } from '@/lib/services/customerService';
import { getBusinessContextForAI, getBusinessSettings } from '@/lib/services/businessService';
import { getProducts, getCategories, getSubcategories } from '@/lib/services/catalogService';
import { Kunde, PriceComponent, AIPriceSuggestion, BusinessSettings, Product, Category, Subcategory, Tilbud } from '@/lib/types';
import { useBreakpoint } from '@/hooks/useResponsive';
import { ref } from 'firebase/database';
import { db } from '@/lib/firebase';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductDetailsDrawer } from '../katalog';

async function downloadTemplate(templateName: string): Promise<string> {
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
}

interface NewQuoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTilbudCreated?: () => void;
  editingQuote?: Tilbud | null;
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
  { id: 2, title: 'Rediger prisforslag', description: 'Juster pris basert på AI-analyse', icon: Zap },
  { id: 3, title: 'Prissammendrag', description: 'Gjennomgå og bekreft prising', icon: Calculator },
  { id: 4, title: 'Design', description: 'Velg mal og send tilbud', icon: Palette },
];

export const NewQuoteDrawer: React.FC<NewQuoteDrawerProps> = ({ open, onOpenChange, onTilbudCreated, editingQuote }) => {
  const breakpoints = useBreakpoint();
  const isMobile = !breakpoints.md;
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
  const [skipAI, setSkipAI] = useState(false);
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
  const [isCatalogDialogOpen, setIsCatalogDialogOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>([]);
  const [catalogSubcategories, setCatalogSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState<string>('all');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'list'>('list');
  const [catalogSortBy, setCatalogSortBy] = useState<'name' | 'price'>('name');
  const [selectedProducts, setSelectedProducts] = useState<Map<string, { product: Product; quantity: number }>>(new Map());
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  
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
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${component.quantity || 1}</td>
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

  // Load customers and catalog data when drawer opens
  useEffect(() => {
    if (open) {
      loadCustomers();
      if (!catalogLoaded) {
        loadCatalogData();
      }
    }
  }, [open, catalogLoaded]);

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
          amount: Math.round((comp.quantity || 1) * (comp.unitPrice || 0) * markupMultiplier),
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

  // Initialize data when editing a quote
  useEffect(() => {
    if (editingQuote && open) {
      // Find the customer for this quote
      const customer = customers.find(c => c.navn === editingQuote.kundenavn);
      if (customer) {
        setSelectedCustomerId(customer.id);
      }
      
      // Set project details
      setProjectName(editingQuote.prosjekt);
      setQuoteMessage(editingQuote.beskrivelse || '');
      setSelectedTemplate(editingQuote.template || 'modern');
      
      // Set quote data
      setQuoteData({
        jobDescription: editingQuote.beskrivelse || '',
        images: [],
        aiSuggestion: null,
        adjustedComponents: editingQuote.prisgrunnlag || [],
        finalPrice: editingQuote.belop,
      });
      
      // Go directly to step 2 (price components)
      setCurrentStep(2);
    }
  }, [editingQuote, open, customers]);

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

  const loadCatalogData = async () => {
    setIsLoadingCatalog(true);
    try {
      const [products, categories, subcategories] = await Promise.all([
        getProducts(),
        getCategories(),
        getSubcategories()
      ]);
      setCatalogProducts(products);
      setCatalogCategories(categories);
      setCatalogSubcategories(subcategories);
      setCatalogLoaded(true);
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const openCatalogDialog = async () => {
    setSelectedProducts(new Map());
    setIsCatalogDialogOpen(true);
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      if (newMap.has(product.id)) {
        newMap.delete(product.id);
      } else {
        newMap.set(product.id, { product, quantity: 1 });
      }
      return newMap;
    });
  };

  const updateSelectedProductQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      const item = newMap.get(productId);
      if (item && quantity > 0) {
        newMap.set(productId, { ...item, quantity });
      }
      return newMap;
    });
  };

  const addSelectedProductsToQuote = () => {
    const newComponents: PriceComponent[] = [];
    
    selectedProducts.forEach(({ product, quantity }) => {
      const newComponent: PriceComponent = {
        id: `product-${product.id}-${Date.now()}`,
        category: 'materialer',
        name: product.produktnavn,
        description: product.beskrivelse || `${product.produsent ? product.produsent + ' - ' : ''}${product.produktnavn}`,
        amount: 0,
        quantity: quantity,
        unit: product.enhet,
        unitPrice: product.enhetspris,
        priceMarkup: product.påslag,
        materialMarkup: materialMarkup,
        isEditable: true,
        confidence: 0,
      };
      
      newComponent.amount = calculateAmountWithMarkup(newComponent);
      newComponents.push(newComponent);
    });
    
    setQuoteData(prev => {
      const updatedComponents = [...prev.adjustedComponents, ...newComponents];
      const newTotal = updatedComponents.reduce((sum, comp) => sum + comp.amount, 0);
      return {
        ...prev,
        adjustedComponents: updatedComponents,
        finalPrice: newTotal,
      };
    });
    
    setIsCatalogDialogOpen(false);
    setSelectedProducts(new Map());
    setCatalogSearchTerm('');
    setSelectedCategoryFilter('all');
    setSelectedSubcategoryFilter('all');
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

  const generateNewCatalog = () => {
    let newCatalog: any = {};

    catalogCategories.forEach(cat => {
      newCatalog[cat.id] = {
        "category-name": cat.navn,
        "category-description": cat.beskrivelse || '',
        "subcategories": []
      };
    });

    catalogSubcategories.forEach(subcat => {
      if (newCatalog[subcat.kategoriId]) {
        newCatalog[subcat.kategoriId].subcategories.push({
          "subcategory-name": subcat.navn,
          "subcategory-description": subcat.beskrivelse || '',
          "products": []
        });
      }
    });

    // Add products to their respective subcategories
    catalogProducts.forEach(product => {
      const category = newCatalog[product.kategoriId];
      if (category) {
        const subcategory = category.subcategories.find((sub: any) => {
          // Find the subcategory by matching the subcategory ID
          const matchingSubcat = catalogSubcategories.find(s => s.id === product.underkategoriId);
          return matchingSubcat && matchingSubcat.navn === sub["subcategory-name"];
        });
        if (subcategory) {
          subcategory.products.push({
            "produktnavn": product.produktnavn,
            "produsent": product.produsent,
            "enhet": product.enhet,
            "enhetspris": product.enhetspris,
            "påslag": product.påslag,
            "beskrivelse": product.beskrivelse || ''
          });
        }
      }
    });

    return newCatalog;
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
            catalog: generateNewCatalog()
          }),
        });

        console.log(catalogProducts);

        if (!response.ok) throw new Error('AI-tjeneste feilet: ' + response.statusText);

        // Håndter respons som streng med ''' eller ``` rundt, også med linjeskift og ekstra tekst
        const responseText = await response.json()
        // Clean response: remove code block markers and trim whitespace
        console.log("RAW API RESPONSE:", responseText)
        console.log("RESPONSE components:", responseText.components)
        if (responseText.components && responseText.components.length > 0) {
          console.log("First component:", responseText.components[0])
        }

        const aiSuggestion: AIPriceSuggestion = responseText;

        if (aiSuggestion) {
          // Convert confidence from 0-1 to 0-100 scale for display, but only if needed
          const convertConfidence = (conf: number) => {
            if (conf > 1) return conf; // Already in 0-100 range
            return Math.round(conf * 100); // Convert from 0-1 to 0-100
          };

          const convertedSuggestion = {
            ...aiSuggestion,
            confidence: convertConfidence(aiSuggestion.confidence),
            components: aiSuggestion.components.map(comp => ({
              ...comp,
              confidence: convertConfidence(comp.confidence)
            }))
          };

          const adjustedComponents = convertedSuggestion.components.map((comp: any) => {
            // Ensure numeric fields are numbers
            const numericComp = {
              ...comp,
              amount: Number(comp.amount) || 0,
              unitPrice: Number(comp.unitPrice) || 0,
              priceMarkup: Number(comp.priceMarkup) || 0,
              materialMarkup: Number(comp.materialMarkup) || 0,
            };

            console.log('Processing component:', numericComp);

            // Map API fields correctly: API amount -> quantity
            const componentWithCorrectMapping = {
              ...numericComp,
              quantity: numericComp.amount, // API amount is actually the quantity
              priceMarkup: priceMarkup, // Override with user settings
              materialMarkup: materialMarkup, // Override with user settings
              isEditable: true, // Ensure all components are always editable
            };

            console.log('Component with mapping:', componentWithCorrectMapping);

            // Calculate the correct amount based on quantity, unitPrice, and markups
            const calculatedAmount = calculateAmountWithMarkup(componentWithCorrectMapping);

            console.log('Calculated amount:', calculatedAmount);

            return {
              ...componentWithCorrectMapping,
              amount: calculatedAmount,
            };
          });
          console.log("ADJUSTED COMPONENTS:", adjustedComponents)
          setQuoteData(prev => ({
            ...prev,
            aiSuggestion: convertedSuggestion,
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

  const handleSaveDraft = async () => {
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
        status: 'draft' as const,
        dato: new Date().toISOString().split('T')[0],
        svarfrist: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        beskrivelse: quoteMessage || quoteData.jobDescription,
        notater: `AI-generert tilbud med ${quoteData.adjustedComponents.length} prisgrunnlagskomponenter (UTKAST)`,
        prisgrunnlag: quoteData.adjustedComponents,
        template: selectedTemplate,
      };

      // Create or update the draft quote
      if (editingQuote) {
        await updateTilbud(editingQuote.id, tilbudData);
      } else {
        await createTilbud(tilbudData);
      }

      // Reset form and close drawer
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
      setSelectedTemplate('modern');
      onOpenChange(false);
      
      if (onTilbudCreated) {
        onTilbudCreated();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Kunne ikke lagre utkast. Prøv igjen.');
    } finally {
      setIsSubmitting(false);
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
        belop: quoteData.finalPrice,
        status: 'venter' as const,
        dato: new Date().toISOString().split('T')[0],
        svarfrist: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        beskrivelse: quoteMessage || quoteData.jobDescription,
        notater: `AI-generert tilbud med ${quoteData.adjustedComponents.length} prisgrunnlagskomponenter`,
        prisgrunnlag: quoteData.adjustedComponents,
        template: selectedTemplate,
      };

      // Create or update the quote
      let quoteId: string;
      if (editingQuote) {
        await updateTilbud(editingQuote.id, tilbudData);
        quoteId = editingQuote.id;
      } else {
        quoteId = await createTilbud(tilbudData);
      }

      // Send email to customer
      let emailSent = false;
      
      // Check if customer has email address
      if (!selectedCustomer?.epost) {
        console.log('⚠️ Customer has no email address, skipping email send');
        console.log('Customer data:', selectedCustomer);
        alert(`Tilbud opprettet!\n\nKunden ${selectedCustomer?.navn} har ingen registrert e-postadresse.\nVennligst legg til e-post i kunderegisteret for å kunne sende tilbud.`);
      } else {
        // Only try to send email if customer has email address
        console.log('📧 Customer has email, attempting to send:', selectedCustomer.epost);
        
        try {
        // Get the saved quote with viewToken
        console.log('📋 Fetching quote by ID:', quoteId);
        const savedQuote = await getTilbudById(quoteId);
        console.log('📋 Retrieved quote:', savedQuote);
        console.log('📋 ViewToken:', savedQuote?.viewToken);
        
        if (!savedQuote) {
          console.error('❌ Could not retrieve quote');
          console.error('QuoteId:', quoteId);
          throw new Error('Kunne ikke hente tilbud fra databasen');
        }

        // Ensure viewToken exists - generate one if missing
        let viewToken = savedQuote.viewToken;
        if (!viewToken) {
          console.log('⚠️ ViewToken missing, generating new one...');
          const { ensureViewToken } = await import('@/lib/services/tilbudService');
          viewToken = await ensureViewToken(quoteId);
          console.log('✅ ViewToken generated:', viewToken);
        }

        const businessSettings = await getBusinessSettings();
        const baseUrl = window.location.origin;
        const viewUrl = `${baseUrl}/tilbudsvisning/${quoteId}?token=${viewToken}`;
        
        console.log('Sending email to:', selectedCustomer!.epost);
        console.log('View URL:', viewUrl);
        
        const quoteForEmail = {
          id: quoteId,
          ...tilbudData,
          viewToken: viewToken
        };

        const emailHtml = await generateQuoteHtml(quoteForEmail, selectedCustomer!, businessSettings, viewUrl);

        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: selectedCustomer!.epost,
            subject: `Tilbud: ${projectName}`,
            message: emailHtml,
            customerId: selectedCustomer!.id,
            quoteId: quoteId,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('Email API error:', errorData);
          throw new Error(errorData.error || 'Failed to send email');
        }

        const responseData = await emailResponse.json();
        console.log('Email sent successfully:', responseData);
        emailSent = true;
        } catch (emailError: any) {
          console.error('Error sending email:', emailError);
          alert(`Tilbud opprettet, men e-post kunne ikke sendes:\n${emailError.message}\n\nVennligst send tilbudet manuelt til ${selectedCustomer!.epost}`);
        }
      }

      if (emailSent) {
        alert(`Tilbud sendt til ${selectedCustomer!.epost}!`);
      }

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

  // Helper to generate full quote HTML for emails using selected template
  const generateQuoteHtml = async (quote: any, customer: Kunde, businessSettings: BusinessSettings | null, viewUrl?: string) => {
    // Generate a nice email with the view link
    const companyName = businessSettings?.companyName || 'Håndverksbedrift';
    
    console.log('🔗 Generating email HTML with viewUrl:', viewUrl);
    console.log('🔗 Quote viewToken:', quote.viewToken);
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          ${businessSettings?.logoUrl ? `<img src="${businessSettings.logoUrl}" alt="${companyName}" style="max-height: 60px; margin-bottom: 20px;">` : ''}
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Nytt tilbud fra ${companyName}</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <h2 style="color: #333333; margin-top: 0;">${quote.prosjekt}</h2>
          
          <p style="color: #666666; font-size: 16px; line-height: 1.6;">
            Hei ${customer.navn},
          </p>
          
          <p style="color: #666666; font-size: 16px; line-height: 1.6;">
            Takk for henvendelsen! Vi har laget et tilbud for prosjektet "${quote.prosjekt}".
          </p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #333333;"><strong>Totalpris:</strong></p>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #667eea;">${quote.belop?.toLocaleString('nb-NO') || 0} kr</p>
          </div>
          
          <div style="margin: 30px 0;">
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              <strong>Tilbudsdato:</strong> ${quote.dato || new Date().toLocaleDateString('nb-NO')}
            </p>
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              <strong>Svarfrist:</strong> ${quote.svarfrist || new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString('nb-NO')}
            </p>
          </div>
          
          ${viewUrl ? `
          <div style="text-align: center; margin: 40px 0;">
            <a href="${viewUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold;">
              Se tilbud og svar
            </a>
          </div>
          
          <p style="color: #666666; font-size: 14px; text-align: center; margin-top: 20px;">
            På tilbudssiden kan du:
          </p>
          <ul style="color: #666666; font-size: 14px; text-align: left; max-width: 400px; margin: 10px auto;">
            <li>Se full prissammendrag og beskrivelse</li>
            <li>Godkjenne eller avvise tilbudet</li>
            <li>Stille spørsmål eller komme med innspill</li>
          </ul>
          ` : ''}
          
          ${quote.beskrivelse ? `
          <div style="margin: 30px 0;">
            <h3 style="color: #333333;">Beskrivelse:</h3>
            <p style="color: #666666; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
              ${quote.beskrivelse}
            </p>
          </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e0e0e0; margin-top: 40px; padding-top: 20px;">
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              <strong>${companyName}</strong>
            </p>
            ${businessSettings?.organizationNumber ? `
            <p style="color: #999999; font-size: 12px; margin: 5px 0;">
              Org.nr: ${businessSettings.organizationNumber}
            </p>
            ` : ''}
            ${businessSettings?.phone ? `
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              📞 ${businessSettings.phone}
            </p>
            ` : ''}
            ${businessSettings?.email ? `
            <p style="color: #666666; font-size: 14px; margin: 5px 0;">
              ✉️ ${businessSettings.email}
            </p>
            ` : ''}
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            Powered by Proanbud AI
          </p>
        </div>
      </div>
    `;
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
        <Button 
          onClick={() => {
            // Skip directly to step 2 without AI analysis
            setSkipAI(true);
            setCurrentStep(2);
            // Initialize with empty components if none exist
            if (quoteData.adjustedComponents.length === 0) {
              setQuoteData(prev => ({
                ...prev,
                adjustedComponents: [],
                finalPrice: 0,
              }));
            }
          }} 
          variant="outline" 
          className="flex-1"
        >
          Fortsett uten AI
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

  const calculateAmountWithMarkup = (component: PriceComponent, quantity?: number, unitPrice?: number, priceMarkup?: number) => {
    const qty = quantity !== undefined ? quantity : component.quantity || 1;
    const price = unitPrice !== undefined ? unitPrice : component.unitPrice || 0;
    const markup = priceMarkup !== undefined ? priceMarkup : (component.priceMarkup || 0);
    const markupMultiplier = 1 + (markup / 100);
    const result = Math.round(qty * price * markupMultiplier);
    console.log(`calculateAmountWithMarkup: qty=${qty}, price=${price}, markup=${markup}%, multiplier=${markupMultiplier}, result=${result}`);
    return result;
  };

  const updateComponent = (id: string, updates: Partial<PriceComponent>) => {
    setQuoteData(prev => {
      const updatedComponents = prev.adjustedComponents.map(comp => {
        if (comp.id === id) {
          const updatedComp = { ...comp, ...updates };
          // Always recalculate amount when component is updated
          updatedComp.amount = calculateAmountWithMarkup(
            updatedComp,
            updatedComp.quantity,
            updatedComp.unitPrice,
            updatedComp.priceMarkup
          );
          return updatedComp;
        }
        return comp;
      });
      const newTotal = updatedComponents.reduce((sum, comp) => sum + comp.amount, 0);
      console.log('Updated components, new total:', newTotal);
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
        amount: 0, // Will be calculated below
        quantity: 1,
        unit: 'stk',
        unitPrice: 0,
        priceMarkup: priceMarkup,
        materialMarkup: materialMarkup,
        isEditable: true,
        confidence: 0, // 0 indicates user-added component, not AI-generated
      };
      
      // Calculate amount based on quantity and unitPrice
      newComponent.amount = calculateAmountWithMarkup(newComponent);
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
        ) : (
          <>
            {/* AI Confidence and Summary - only show if AI suggestion exists */}
            {quoteData.aiSuggestion && (
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
            )}

            {/* Interactive Price Components Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rediger prisforslag</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={openCatalogDialog} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Legg til produkt
                    </Button>
                    <Button onClick={addComponent} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Lag produkt
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
                        <th className="text-right py-2 px-2">Påslag (%)</th>
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
                                type="text"
                                value={component.quantity || 1}
                                onChange={(e) => {
                                  const quantity = Number(e.target.value);
                                  updateComponent(component.id, {
                                    quantity,
                                  });
                                }}
                                className="w-16 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                min="0"
                                step="1"
                              />
                            ) : (
                              <span className="text-sm">{component.quantity || 1}</span>
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
                            {component.isEditable ? (
                              <input
                                type="text"
                                step="1"
                                value={component.priceMarkup ?? 0}
                                onChange={(e) => {
                                  const priceMarkup = Number(e.target.value) || 0;
                                  updateComponent(component.id, {
                                    priceMarkup,
                                  });
                                }}
                                className="w-16 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                min="0"
                              />
                            ) : (
                              <span className="text-sm">{component.priceMarkup || 0}%</span>
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
                        <td colSpan={7} className="py-3 px-2 text-right">Total:</td>
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
                        {component.amount && component.unit && (
                          <span>Antall: {component.amount} {component.unit}</span>
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
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
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
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  (() => {
                    const totalProfit = quoteData.adjustedComponents.reduce((sum, c) => {
                      const amount = c.amount || 0;
                      const markupPercent = c.priceMarkup || 0;
                      // Calculate base cost: amount / (1 + markup%)
                      const baseCost = markupPercent > 0 ? amount / (1 + markupPercent / 100) : amount;
                      // Profit = final amount - base cost
                      const profit = amount - baseCost;
                      return sum + profit;
                    }, 0);
                    return totalProfit >= 0 ? 'text-green-700' : 'text-red-700';
                  })()
                }`}>
                  kr {(() => {
                    const totalProfit = quoteData.adjustedComponents.reduce((sum, c) => {
                      const amount = c.amount || 0;
                      const markupPercent = c.priceMarkup || 0;
                      // Calculate base cost: amount / (1 + markup%)
                      const baseCost = markupPercent > 0 ? amount / (1 + markupPercent / 100) : amount;
                      // Profit = final amount - base cost
                      const profit = amount - baseCost;
                      return sum + profit;
                    }, 0);
                    return totalProfit.toLocaleString('nb-NO');
                  })()}
                </div>
                <div className="text-sm text-gray-600">Total profitt</div>
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
        {selectedCustomerId && projectName.trim().length > 0 && (
          <Button 
            variant="outline"
            className="flex items-center justify-center gap-2 px-4"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Edit3 className="w-4 h-4" />
            {isSubmitting ? 'Lagrer...' : 'Lagre som utkast'}
          </Button>
        )}
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
          variant="outline"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleSaveDraft}
          disabled={isSubmitting || !selectedCustomerId || !projectName}
        >
          <Edit3 className="w-4 h-4" />
          {isSubmitting ? 'Lagrer...' : 'Lagre som utkast'}
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

      {/* Catalog Dialog - Enhanced & Responsive */}
      {isMobile ? (
        <Drawer open={isCatalogDialogOpen} onOpenChange={setIsCatalogDialogOpen}>
          <DrawerContent className="max-h-[95vh] flex flex-col">
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DrawerTitle>Produktkatalog</DrawerTitle>
                  <DrawerDescription>
                    Velg produkter fra katalogen
                  </DrawerDescription>
                </div>
                {selectedProducts.size > 0 && (
                  <div className="bg-primary/10 px-3 py-1.5 rounded-lg">
                    <span className="text-xs font-medium text-primary">
                      {selectedProducts.size} valgt
                    </span>
                  </div>
                )}
              </div>
            </DrawerHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              {/* Mobile Search and Filters */}
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Søk etter produkt..."
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                
                <div className="flex gap-2">
                  <Select value={selectedCategoryFilter} onValueChange={(value) => {
                    setSelectedCategoryFilter(value);
                    setSelectedSubcategoryFilter('all');
                  }}>
                    <SelectTrigger className="flex-1 text-sm">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle kategorier</SelectItem>
                      {catalogCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.navn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedCategoryFilter !== 'all' && catalogSubcategories.filter(s => s.kategoriId === selectedCategoryFilter).length > 0 && (
                    <Select value={selectedSubcategoryFilter} onValueChange={setSelectedSubcategoryFilter}>
                      <SelectTrigger className="flex-1 text-sm">
                        <SelectValue placeholder="Underkategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        {catalogSubcategories
                          .filter(s => s.kategoriId === selectedCategoryFilter)
                          .map(subcat => (
                            <SelectItem key={subcat.id} value={subcat.id}>
                              {subcat.navn}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <Select value={catalogSortBy} onValueChange={(value) => setCatalogSortBy(value as 'name' | 'price')}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sorter: Navn</SelectItem>
                    <SelectItem value="price">Sorter: Pris</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products List - Mobile */}
              <div className="flex-1 overflow-y-auto -mx-4 px-4">
                {isLoadingCatalog ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 mx-auto mb-3 border-4 border-primary border-t-transparent rounded-full"></div>
                      <p className="text-sm text-gray-500">Laster...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {catalogProducts
                      .filter(product => {
                        const matchesSearch = catalogSearchTerm === '' || 
                          product.produktnavn.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                          product.beskrivelse?.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                          product.produsent?.toLowerCase().includes(catalogSearchTerm.toLowerCase());
                        
                        const matchesCategory = selectedCategoryFilter === 'all' || 
                          product.kategoriId === selectedCategoryFilter;
                        
                        const matchesSubcategory = selectedSubcategoryFilter === 'all' || 
                          product.underkategoriId === selectedSubcategoryFilter;
                        
                        return matchesSearch && matchesCategory && matchesSubcategory;
                      })
                      .sort((a, b) => {
                        if (catalogSortBy === 'name') {
                          return a.produktnavn.localeCompare(b.produktnavn);
                        } else {
                          return a.enhetspris - b.enhetspris;
                        }
                      })
                      .map(product => {
                        const category = catalogCategories.find(c => c.id === product.kategoriId);
                        const subcategory = catalogSubcategories.find(s => s.id === product.underkategoriId);
                        const isSelected = selectedProducts.has(product.id);
                        const selectedItem = selectedProducts.get(product.id);
                        
                        return (
                          <div 
                            key={product.id} 
                            className={`border rounded-lg p-3 transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3" onClick={() => toggleProductSelection(product)}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900 mb-0.5">
                                  {product.produktnavn}
                                </h4>
                                {product.produsent && (
                                  <p className="text-xs text-gray-600 mb-1">
                                    {product.produsent}
                                  </p>
                                )}
                                {product.beskrivelse && (
                                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                    {product.beskrivelse}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-wrap gap-1.5">
                                    {category && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                        {category.navn}
                                      </span>
                                    )}
                                    {subcategory && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                        {subcategory.navn}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="text-right">
                                    <p className="font-bold text-sm text-gray-900">
                                      {product.enhetspris.toLocaleString('nb-NO')} kr
                                    </p>
                                    <p className="text-xs text-gray-500">/{product.enhet}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    
                    {catalogProducts.filter(product => {
                      const matchesSearch = catalogSearchTerm === '' || 
                        product.produktnavn.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                        product.beskrivelse?.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                        product.produsent?.toLowerCase().includes(catalogSearchTerm.toLowerCase());
                      
                      const matchesCategory = selectedCategoryFilter === 'all' || 
                        product.kategoriId === selectedCategoryFilter;
                      
                      const matchesSubcategory = selectedSubcategoryFilter === 'all' || 
                        product.underkategoriId === selectedSubcategoryFilter;
                      
                      return matchesSearch && matchesCategory && matchesSubcategory;
                    }).length === 0 && (
                      <div className="p-8 text-center">
                        <p className="text-gray-600 text-sm">Ingen produkter funnet</p>
                        <p className="text-gray-500 text-xs mt-1">Prøv å endre søkeord eller filter</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Footer */}
            <DrawerFooter className="border-t bg-gray-50">
              {selectedProducts.size > 0 && (
                <div className="text-sm text-gray-600 mb-2 text-center">
                  <span className="font-medium">{selectedProducts.size}</span> produkt{selectedProducts.size !== 1 ? 'er' : ''} valgt
                  <span className="block mt-1">
                    Total: <span className="font-semibold">
                      {Array.from(selectedProducts.values())
                        .reduce((sum, { product, quantity }) => sum + (product.enhetspris * quantity), 0)
                        .toLocaleString('nb-NO')} kr
                    </span>
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCatalogDialogOpen(false);
                    setSelectedProducts(new Map());
                    setCatalogSearchTerm('');
                    setSelectedCategoryFilter('all');
                    setSelectedSubcategoryFilter('all');
                  }}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button 
                  onClick={addSelectedProductsToQuote}
                  disabled={selectedProducts.size === 0}
                  className="flex-1"
                >
                  Legg til {selectedProducts.size > 0 && `(${selectedProducts.size})`}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isCatalogDialogOpen} onOpenChange={setIsCatalogDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Produktkatalog</DialogTitle>
                <DialogDescription>
                  Velg produkter fra katalogen og legg til i tilbudet
                </DialogDescription>
              </div>
              {selectedProducts.size > 0 && (
                <div className="bg-primary/10 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-primary">
                    {selectedProducts.size} produkt{selectedProducts.size !== 1 ? 'er' : ''} valgt
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Categories */}
            <div className="w-64 border-r bg-gray-50 overflow-y-auto p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3 px-2">KATEGORIER</h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategoryFilter('all');
                    setSelectedSubcategoryFilter('all');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategoryFilter === 'all' 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  Alle kategorier
                  <span className="ml-2 text-xs opacity-75">
                    ({catalogProducts.length})
                  </span>
                </button>
                
                {catalogCategories.map(category => {
                  const categoryProducts = catalogProducts.filter(p => p.kategoriId === category.id);
                  const categorySubcategories = catalogSubcategories.filter(s => s.kategoriId === category.id);
                  
                  return (
                    <div key={category.id}>
                      <button
                        onClick={() => {
                          setSelectedCategoryFilter(category.id);
                          setSelectedSubcategoryFilter('all');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategoryFilter === category.id 
                            ? 'bg-primary text-white' 
                            : 'hover:bg-gray-200'
                        }`}
                      >
                        {category.navn}
                        <span className="ml-2 text-xs opacity-75">
                          ({categoryProducts.length})
                        </span>
                      </button>
                      
                      {/* Subcategories */}
                      {selectedCategoryFilter === category.id && categorySubcategories.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          <button
                            onClick={() => setSelectedSubcategoryFilter('all')}
                            className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                              selectedSubcategoryFilter === 'all'
                                ? 'bg-primary/20 text-primary font-medium'
                                : 'hover:bg-gray-200'
                            }`}
                          >
                            Alle
                          </button>
                          {categorySubcategories.map(subcat => {
                            const subcatProducts = categoryProducts.filter(p => p.underkategoriId === subcat.id);
                            return (
                              <button
                                key={subcat.id}
                                onClick={() => setSelectedSubcategoryFilter(subcat.id)}
                                className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                                  selectedSubcategoryFilter === subcat.id
                                    ? 'bg-primary/20 text-primary font-medium'
                                    : 'hover:bg-gray-200'
                                }`}
                              >
                                {subcat.navn}
                                <span className="ml-2 opacity-75">
                                  ({subcatProducts.length})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b bg-white space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Søk etter produktnavn, produsent eller beskrivelse..."
                    value={catalogSearchTerm}
                    onChange={(e) => setCatalogSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <Select value={catalogSortBy} onValueChange={(value) => setCatalogSortBy(value as 'name' | 'price')}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sorter: Navn</SelectItem>
                      <SelectItem value="price">Sorter: Pris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Stats bar */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Viser {catalogProducts.filter(product => {
                      const matchesSearch = catalogSearchTerm === '' || 
                        product.produktnavn.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                        product.beskrivelse?.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                        product.produsent?.toLowerCase().includes(catalogSearchTerm.toLowerCase());
                      
                      const matchesCategory = selectedCategoryFilter === 'all' || 
                        product.kategoriId === selectedCategoryFilter;
                      
                      const matchesSubcategory = selectedSubcategoryFilter === 'all' || 
                        product.underkategoriId === selectedSubcategoryFilter;
                      
                      return matchesSearch && matchesCategory && matchesSubcategory;
                    }).length} produkter
                  </span>
                </div>
              </div>

              {/* Products Grid/List */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingCatalog ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin w-10 h-10 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"></div>
                      <p className="text-gray-500">Laster produkter...</p>
                    </div>
                  </div>
                ) : (
                  <div className={catalogViewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-3'}>
                    {catalogProducts
                      .filter(product => {
                        const matchesSearch = catalogSearchTerm === '' || 
                          product.produktnavn.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                          product.beskrivelse?.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                          product.produsent?.toLowerCase().includes(catalogSearchTerm.toLowerCase());
                        
                        const matchesCategory = selectedCategoryFilter === 'all' || 
                          product.kategoriId === selectedCategoryFilter;
                        
                        const matchesSubcategory = selectedSubcategoryFilter === 'all' || 
                          product.underkategoriId === selectedSubcategoryFilter;
                        
                        return matchesSearch && matchesCategory && matchesSubcategory;
                      })
                      .sort((a, b) => {
                        if (catalogSortBy === 'name') {
                          return a.produktnavn.localeCompare(b.produktnavn);
                        } else {
                          return a.enhetspris - b.enhetspris;
                        }
                      })
                      .map(product => {
                        const category = catalogCategories.find(c => c.id === product.kategoriId);
                        const subcategory = catalogSubcategories.find(s => s.id === product.underkategoriId);
                        const isSelected = selectedProducts.has(product.id);
                        const selectedItem = selectedProducts.get(product.id);
                        
                        return (
                          <div 
                            key={product.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(product)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              />
                              
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {product.produktnavn}
                                </h4>
                                {product.produsent && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    {product.produsent}
                                  </p>
                                )}
                                {product.beskrivelse && (
                                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                                    {product.beskrivelse}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {category && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                      {category.navn}
                                    </span>
                                  )}
                                  {subcategory && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                      {subcategory.navn}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Price and Quantity */}
                              <div className="text-right space-y-2">
                                <div>
                                  <p className="font-bold text-lg text-gray-900">
                                    {product.enhetspris.toLocaleString('nb-NO')} kr
                                  </p>
                                  <p className="text-xs text-gray-500">per {product.enhet}</p>
                                </div>
                                
                                {isSelected && (
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600">Antall:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedItem?.quantity || 1}
                                      onChange={(e) => updateSelectedProductQuantity(product.id, parseInt(e.target.value) || 1)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    
                    {catalogProducts.filter(product => {
                      const matchesSearch = catalogSearchTerm === '' || 
                        product.produktnavn.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                        product.beskrivelse?.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                        product.produsent?.toLowerCase().includes(catalogSearchTerm.toLowerCase());
                      
                      const matchesCategory = selectedCategoryFilter === 'all' || 
                        product.kategoriId === selectedCategoryFilter;
                      
                      const matchesSubcategory = selectedSubcategoryFilter === 'all' || 
                        product.underkategoriId === selectedSubcategoryFilter;
                      
                      return matchesSearch && matchesCategory && matchesSubcategory;
                    }).length === 0 && (
                      <div className="col-span-3 p-12 text-center">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium">Ingen produkter funnet</p>
                        <p className="text-gray-500 text-sm mt-1">Prøv å endre søkeord eller filter</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedProducts.size > 0 && (
                  <>
                    <span className="font-medium">{selectedProducts.size}</span> produkt{selectedProducts.size !== 1 ? 'er' : ''} valgt
                    {selectedProducts.size > 0 && (
                      <span className="ml-4">
                        Total: <span className="font-semibold">
                          {Array.from(selectedProducts.values())
                            .reduce((sum, { product, quantity }) => sum + (product.enhetspris * quantity), 0)
                            .toLocaleString('nb-NO')} kr
                        </span>
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCatalogDialogOpen(false);
                    setSelectedProducts(new Map());
                    setCatalogSearchTerm('');
                    setSelectedCategoryFilter('all');
                    setSelectedSubcategoryFilter('all');
                  }}
                >
                  Avbryt
                </Button>
                <Button 
                  onClick={addSelectedProductsToQuote}
                  disabled={selectedProducts.size === 0}
                  className="min-w-32"
                >
                  Legg til {selectedProducts.size > 0 && `(${selectedProducts.size})`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </Drawer>
  );
};