'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Sparkles, 
  Zap,
  Send,
  Edit3,
  X,
  Plus,
  Trash2,
  Calculator,
  Check,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { createTilbud, updateTilbud, getTilbudById, TilbudFormData, getUniqueCategoriesFromQuotes } from '@/lib/services/tilbudService';
import { getCustomers } from '@/lib/services/customerService';
import { getBusinessContextForAI, getBusinessSettings } from '@/lib/services/businessService';
import { Kunde, PriceComponent, AIPriceSuggestion, BusinessSettings, Tilbud } from '@/lib/types';
import { useBreakpoint } from '@/hooks/useResponsive';
import { generateQuoteEmailHtml } from '@/lib/email/generateQuoteEmailHtml';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ProductCatalog, ProductCatalogHandle, ProductCatalogSelectionItem } from '../katalog';
import { AlertDialog } from '../ui/alert-dialog';
import { cn } from "@/lib/utils";

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
];

const DEFAULT_PROJECT_CATEGORY = 'Generelt prosjekt';
const FALLBACK_PROJECT_CATEGORY = 'Ingen prosjekt';

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
  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [priceMarkup, setPriceMarkup] = useState<number>(0);
  const [materialMarkup, setMaterialMarkup] = useState<number>(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PriceComponent | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [editValue, setEditValue] = useState('');
  const productCatalogRef = useRef<ProductCatalogHandle>(null);
  const skipAutoSaveRef = useRef(false);
  const previousOpenRef = useRef(open);
  const [unitPriceInputs, setUnitPriceInputs] = useState<Map<string, string>>(new Map());
  const [visibleProjectCategories, setVisibleProjectCategories] = useState<Record<string, boolean>>({});
  const [collapsedProjectCategories, setCollapsedProjectCategories] = useState<Record<string, boolean>>({});
  const [manualProjects, setManualProjects] = useState<string[]>([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // When the edit dialog is open, hide lower z-index overlays to avoid stacking glitches.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const markerAttr = 'data-hidden-by-dialogs';
    const customBackdropZIndex = 450; // z-[450] for our custom backdrop

    if (editDialogOpen) {
      const overlays = Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0'));
      overlays.forEach(el => {
        const computedZIndex = parseInt(getComputedStyle(el).zIndex, 10) || 0;
        if (computedZIndex < customBackdropZIndex && el.style.display !== 'none') {
          el.setAttribute(markerAttr, el.style.display || '');
          el.style.display = 'none';
        }
      });
    } else {
      document.querySelectorAll<HTMLElement>(`[${markerAttr}]`).forEach(el => {
        const prev = el.getAttribute(markerAttr) || '';
        el.style.display = prev;
        el.removeAttribute(markerAttr);
      });
    }

    return () => {
      document.querySelectorAll<HTMLElement>(`[${markerAttr}]`).forEach(el => {
        const prev = el.getAttribute(markerAttr) || '';
        el.style.display = prev;
        el.removeAttribute(markerAttr);
      });
    };
  }, [editDialogOpen]);
  
  // Load customers and catalog data when drawer opens
  useEffect(() => {
    if (open) {
      loadCustomers();
      productCatalogRef.current?.refresh();
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

  const projectCategorySummary = useMemo(() => {
    const groups: Record<string, PriceComponent[]> = {};
    const totals: Record<string, number> = {};
    const order: string[] = [];

    quoteData.adjustedComponents.forEach(component => {
      const label = component.projectCategory?.trim() || FALLBACK_PROJECT_CATEGORY;
      if (!groups[label]) {
        groups[label] = [];
        totals[label] = 0;
        order.push(label);
      }
      groups[label].push(component);
      totals[label] += component.amount || 0;
    });

    if (order.length === 0) {
      order.push(FALLBACK_PROJECT_CATEGORY);
      groups[FALLBACK_PROJECT_CATEGORY] = groups[FALLBACK_PROJECT_CATEGORY] || [];
      totals[FALLBACK_PROJECT_CATEGORY] = totals[FALLBACK_PROJECT_CATEGORY] || 0;
    }

    return { groups, totals, order };
  }, [quoteData.adjustedComponents]);

  const projectOptions = useMemo(() => {
    const set = new Set<string>();
    set.add(DEFAULT_PROJECT_CATEGORY);
    set.add(FALLBACK_PROJECT_CATEGORY);
    manualProjects.forEach(name => {
      const trimmed = name.trim();
      if (trimmed) set.add(trimmed);
    });
    projectCategorySummary.order.forEach(name => {
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [manualProjects, projectCategorySummary.order]);

  const projectDropdownOptions = useMemo(() => {
    return [...projectOptions].sort((a, b) => a.localeCompare(b, 'nb')); // keep dropdown deterministic
  }, [projectOptions]);

  useEffect(() => {
    setVisibleProjectCategories(prev => {
      const next = { ...prev };
      let changed = false;
      projectCategorySummary.order.forEach(category => {
        if (next[category] === undefined) {
          next[category] = true;
          changed = true;
        }
      });
      Object.keys(next).forEach(category => {
        if (!projectCategorySummary.order.includes(category)) {
          delete next[category];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [projectCategorySummary.order]);

  useEffect(() => {
    setCollapsedProjectCategories(prev => {
      const next = { ...prev };
      let changed = false;
      projectCategorySummary.order.forEach(category => {
        if (next[category] === undefined) {
          next[category] = false;
          changed = true;
        }
      });
      Object.keys(next).forEach(category => {
        if (!projectCategorySummary.order.includes(category)) {
          delete next[category];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [projectCategorySummary.order]);

  const resolveDefaultProjectCategory = useCallback(() => {
    const firstWithCategory = quoteData.adjustedComponents.find(comp => comp.projectCategory?.trim());
    if (firstWithCategory?.projectCategory) {
      return firstWithCategory.projectCategory;
    }
    const firstRegistered = projectCategorySummary.order.find(category => category !== FALLBACK_PROJECT_CATEGORY);
    return firstRegistered || DEFAULT_PROJECT_CATEGORY;
  }, [quoteData.adjustedComponents, projectCategorySummary.order]);

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

  const applyCatalogSelections = (selections: ProductCatalogSelectionItem[]) => {
    if (selections.length === 0) {
      return;
    }

    const newComponents: PriceComponent[] = selections.map(({ product, quantity }) => {
      const component: PriceComponent = {
        id: `product-${product.id}-${Date.now()}`,
        category: 'materialer',
        name: product.produktnavn,
        description: product.beskrivelse || `${product.produsent ? `${product.produsent} - ` : ''}${product.produktnavn}`,
        produsent: product.produsent || '',
        projectCategory: resolveDefaultProjectCategory(),
        amount: 0,
        quantity,
        unit: product.enhet,
        unitPrice: product.enhetspris,
        priceMarkup: product.påslag,
        materialMarkup,
        isEditable: true,
        confidence: 0,
      };
      component.amount = calculateAmountWithMarkup(component);
      return component;
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
  };

  const openProductCatalog = async (viewMode: 'grid' | 'list' = 'list') => {
    if (!productCatalogRef.current) return;
    try {
      const result = await productCatalogRef.current.open({ viewMode });
      if (result.confirmed && result.selections.length > 0) {
        applyCatalogSelections(result.selections);
      }
    } catch (error) {
      console.error('Error opening product catalog:', error);
    }
  };

  const resetFormState = useCallback(() => {
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
    setUnitPriceInputs(new Map());
    setVisibleProjectCategories({});
    setCollapsedProjectCategories({});
    setManualProjects([]);
    setShowAddProject(false);
    setNewProjectName('');
    productCatalogRef.current?.close();
  }, []);

  const handleClose = () => {
    onOpenChange(false);
  };

  const generateCatalogPayload = () => {
    const snapshot = productCatalogRef.current?.getCatalogData();
    if (!snapshot) return null;

    const { categories, subcategories, products } = snapshot;
    const newCatalog: Record<string, any> = {};
    const subcategoryLookup = new Map<string, { categoryId: string; entry: any }>();

    categories.forEach(cat => {
      newCatalog[cat.id] = {
        'category-name': cat.navn,
        'category-description': cat.beskrivelse || '',
        subcategories: [],
      };
    });

    subcategories.forEach(subcat => {
      const category = newCatalog[subcat.kategoriId];
      if (!category) return;
      const entry = {
        'subcategory-name': subcat.navn,
        'subcategory-description': subcat.beskrivelse || '',
        products: [] as any[],
      };
      category.subcategories.push(entry);
      subcategoryLookup.set(subcat.id, { categoryId: subcat.kategoriId, entry });
    });

    products.forEach(product => {
      const subRef = subcategoryLookup.get(product.underkategoriId);
      if (!subRef) return;
      subRef.entry.products.push({
        produktnavn: product.produktnavn,
        produsent: product.produsent,
        enhet: product.enhet,
        enhetspris: product.enhetspris,
        påslag: product.påslag,
        beskrivelse: product.beskrivelse || '',
      });
    });

    return newCatalog;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      setIsAnalyzing(true);
      setAiError(null);
      try {
        const businessInfo = await getBusinessContextForAI();
        const catalogPayload = generateCatalogPayload();
        const requestBody: Record<string, unknown> = {
          prompt: quoteData.jobDescription,
          businessInfo,
        };
        if (catalogPayload) {
          requestBody.catalog = catalogPayload;
        }

        const response = await fetch('/api/ai-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

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
              componentTotal: Number(comp.componentTotal ?? comp.total ?? comp.component_total) || 0,
            };

            console.log('Processing component:', numericComp);

            // Map API fields correctly: API amount -> quantity
            const componentWithCorrectMapping = {
              ...numericComp,
              quantity: numericComp.amount, // API amount is actually the quantity
              priceMarkup: numericComp.priceMarkup, // Override with user settings
              materialMarkup: numericComp.materialMarkup, // Override with user settings
              projectCategory: comp.projectCategory || comp.project_category || resolveDefaultProjectCategory(),
              projectCategoryDescription: comp.projectCategoryDescription || comp.project_category_description || "",
              catalogMatch: comp.catalogMatch || comp.catalog_match || "",
              catalogSource: comp.catalogSource || comp.catalog_source || "",
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

  const saveDraft = useCallback(async (options?: { skipValidation?: boolean; silent?: boolean }) => {
    const { skipValidation = false, silent = false } = options || {};

    if (!skipValidation && (!selectedCustomerId || !projectName.trim())) {
      if (!silent) {
        alert('Vennligst velg kunde og skriv prosjektnavn');
      }
      return false;
    }

    const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;
    const selectedCustomerName = selectedCustomer?.navn ? selectedCustomer.navn.trim() : '';
    const editingCustomerName = editingQuote?.kundenavn ? editingQuote.kundenavn.trim() : '';
    const resolvedCustomerName = (selectedCustomerName || editingCustomerName || (skipValidation ? 'Uspesifisert kunde' : '')).trim();

    if (!resolvedCustomerName) {
      if (!silent) {
        alert('Vennligst velg kunde');
      }
      return false;
    }

    const manualProjectName = projectName.trim();
    const editingProjectName = editingQuote?.prosjekt ? editingQuote.prosjekt.trim() : '';
    const resolvedProjectName = (() => {
      if (manualProjectName) return manualProjectName;
      if (editingProjectName) return editingProjectName;
      if (skipValidation) {
        const jobLine = quoteData.jobDescription.trim().split('\n').find(line => line.trim()) || '';
        if (jobLine) {
          return jobLine.length > 80 ? `${jobLine.slice(0, 77)}...` : jobLine;
        }
        return `Prosjekt uten navn ${new Date().toLocaleDateString('nb-NO')}`;
      }
      return '';
    })();

    if (!resolvedProjectName) {
      if (!silent) {
        alert('Vennligst skriv prosjektnavn');
      }
      return false;
    }

    const tilbudData: TilbudFormData = {
      kundenavn: resolvedCustomerName,
      prosjekt: resolvedProjectName,
      jobbtype: 'Generell',
      belop: quoteData.finalPrice,
      status: 'draft',
      dato: new Date().toISOString().split('T')[0],
      svarfrist: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      beskrivelse: quoteMessage || quoteData.jobDescription,
      notater: ``,
      prisgrunnlag: quoteData.adjustedComponents,
    };

    if (!skipValidation) {
      setIsSubmitting(true);
    }

    try {
      if (editingQuote) {
        await updateTilbud(editingQuote.id, tilbudData);
      } else {
        await createTilbud(tilbudData);
      }
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!silent) {
        alert('Kunne ikke lagre utkast. Prøv igjen.');
      }
      return false;
    } finally {
      if (!skipValidation) {
        setIsSubmitting(false);
      }
    }
  }, [customers, editingQuote, projectName, quoteData, quoteMessage, selectedCustomerId]);

  const handleSaveDraft = async () => {
    const saved = await saveDraft();
    if (!saved) {
      return;
    }

    onTilbudCreated?.();
    skipAutoSaveRef.current = true;
    onOpenChange(false);
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
        notater: ``,
        prisgrunnlag: quoteData.adjustedComponents,
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

        const emailHtml = generateQuoteEmailHtml({
          quote: quoteForEmail,
          customer: selectedCustomer!,
          businessSettings,
          viewUrl,
        });

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
      skipAutoSaveRef.current = true;
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating tilbud:', error);
      alert('Feil ved oppretting av tilbud. Prøv igjen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSaveOnClose = useCallback(async () => {
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      resetFormState();
      return;
    }

    const hasComponents = quoteData.adjustedComponents.length > 0;
    const editingNonDraft = editingQuote && editingQuote.status !== 'draft';

    if (!hasComponents || editingNonDraft) {
      resetFormState();
      return;
    }

    const saved = await saveDraft({ skipValidation: true, silent: true });
    if (saved) {
      onTilbudCreated?.();
    } else {
      console.warn('Auto-lagring av tilbudsutkast feilet ved lukking av NewQuoteDrawer.');
    }
    resetFormState();
  }, [editingQuote, onTilbudCreated, quoteData.adjustedComponents.length, resetFormState, saveDraft]);

  useEffect(() => {
    if (previousOpenRef.current && !open) {
      void handleAutoSaveOnClose();
    }
    previousOpenRef.current = open;
  }, [open, handleAutoSaveOnClose]);

  // Helper to generate full quote HTML for emails using selected template

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
          placeholder="Beskriv spesifikt jobben som skal utføres..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bilder (Ikke tilgjengelig for øyeblikket)
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
    // Clear the input value for this component so it shows the updated component value
    setUnitPriceInputs(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const renderStep2 = () => {
    const addComponent = () => {
      const newComponent: PriceComponent = {
        id: `custom-${Date.now()}`,
        category: 'annet',
        name: 'Ny komponent',
        description: 'Beskrivelse av komponenten',
        produsent: '',
        projectCategory: resolveDefaultProjectCategory(),
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

    const toggleProjectCategoryVisibility = (category: string) => {
      setVisibleProjectCategories(prev => ({
        ...prev,
        [category]: prev[category] === false,
      }));
    };

    const resetProjectCategoryVisibility = () => {
      const nextState = projectCategorySummary.order.reduce((acc, category) => {
        acc[category] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibleProjectCategories(nextState);
    };

    const handleShowOnlyCategory = (category: string) => {
      const nextState = projectCategorySummary.order.reduce((acc, current) => {
        acc[current] = current === category;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibleProjectCategories(nextState);
    };

    const toggleProjectCategoryCollapse = (category: string) => {
      setCollapsedProjectCategories(prev => ({
        ...prev,
        [category]: !prev[category],
      }));
    };

    const isCategoryVisible = (category: string) => visibleProjectCategories[category] !== false;

    const visibleCategoryCount = projectCategorySummary.order.filter(isCategoryVisible).length;

    const handleAddProject = () => {
      const trimmed = newProjectName.trim();
      if (!trimmed) return;
      setManualProjects(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setNewProjectName('');
      setShowAddProject(false);
    };

    const handleCancelAddProject = () => {
      setShowAddProject(false);
      setNewProjectName('');
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
                    <Button onClick={() => openProductCatalog('list')} size="sm" variant="outline">
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
                {/* Project Management */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">Prosjekter</h4>
                      <p className="text-xs text-gray-500">Hold prislinjer samlet per prosjekt og filtrer tabellen raskt.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={resetProjectCategoryVisibility} 
                        size="sm" 
                        variant="ghost"
                        className="text-primary hover:text-primary/80"
                      >
                        Vis alle
                      </Button>
                      <Button
                        onClick={() => setShowAddProject(!showAddProject)}
                        size="sm"
                        variant="outline"
                        className="text-primary border-primary/30"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Nytt prosjekt
                      </Button>
                    </div>
                  </div>

                  {showAddProject && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Prosjektnavn..."
                        className="flex-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleAddProject} size="sm" variant="outline">
                          Lagre
                        </Button>
                        <Button onClick={handleCancelAddProject} size="sm" variant="ghost">
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {projectCategorySummary.order.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleProjectCategoryVisibility(category)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1',
                          !isCategoryVisible(category)
                            ? 'bg-white text-gray-500 border-gray-200'
                            : 'bg-primary/10 text-primary border-primary/20'
                        )}
                      >
                        <span>{category}</span>
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">{projectCategorySummary.groups[category]?.length || 0} linjer</span>
                        {!isCategoryVisible(category) && (
                          <span className="ml-1 text-gray-400">(skjult)</span>
                        )}
                      </button>
                    ))}
                    {projectCategorySummary.order.length === 0 && (
                      <span className="text-xs text-gray-500">Legg til et prosjekt og tilordne linjer for å komme i gang.</span>
                    )}
                  </div>
                </div>

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
                          <th className="text-left py-2 px-2">Prosjekt</th>
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
                      {quoteData.adjustedComponents.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-6 text-center text-sm text-gray-500">
                            Ingen prislinjer ennå. Legg til et produkt eller en komponent for å komme i gang.
                          </td>
                        </tr>
                      ) : visibleCategoryCount === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-6 text-center text-sm text-gray-500">
                            Ingen prosjekter er synlige. Bruk filteret over for å vise minst én gruppe.
                          </td>
                        </tr>
                      ) : (
                        projectCategorySummary.order.map(category => {
                          if (!isCategoryVisible(category)) {
                            return null;
                          }
                          const componentsInGroup = projectCategorySummary.groups[category] || [];
                          const isCollapsed = collapsedProjectCategories[category];
                          const groupTotal = projectCategorySummary.totals[category] || 0;
                          return (
                            <React.Fragment key={category}>
                              <tr className="bg-gray-100/70">
                                <td colSpan={11} className="py-2 px-2">
                                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="px-2 h-7"
                                        onClick={() => toggleProjectCategoryCollapse(category)}
                                      >
                                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      </Button>
                                      <span className="font-semibold text-sm">{category}</span>
                                      <span className="text-xs text-gray-500">({componentsInGroup.length} linjer)</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <span className="font-semibold text-primary">
                                        kr {groupTotal.toLocaleString('nb-NO')}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleShowOnlyCategory(category)}
                                      >
                                        Vis kun denne
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => toggleProjectCategoryVisibility(category)}
                                      >
                                        {isCategoryVisible(category) ? 'Skjul' : 'Vis'}
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              {!isCollapsed && componentsInGroup.map(component => (
                                <tr key={component.id} className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-2">
                                    {component.isEditable ? (
                                      <Select
                                        value={component.projectCategory || FALLBACK_PROJECT_CATEGORY}
                                        onValueChange={(value) => {
                                          const normalized = value === FALLBACK_PROJECT_CATEGORY ? undefined : value;
                                          updateComponent(component.id, { projectCategory: normalized });
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Velg prosjekt" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {projectDropdownOptions.map(option => (
                                            <SelectItem key={option} value={option}>
                                              {option === FALLBACK_PROJECT_CATEGORY ? 'Ingen prosjekt' : option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <span className="text-sm text-gray-600">
                                        {component.projectCategory || FALLBACK_PROJECT_CATEGORY}
                                      </span>
                                    )}
                                  </td>
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
                                        value={component.quantity ?? 1}
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
                                        type="text"
                                        step="10"
                                        value={unitPriceInputs.get(component.id) ?? (component.unitPrice || 0)}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/,/g, '');
                                          setUnitPriceInputs(prev => new Map(prev).set(component.id, value));
                                          if (value === '' || (!value.endsWith('.'))) {
                                            const unitPrice = parseFloat(value) || 0;
                                            updateComponent(component.id, { unitPrice });
                                          }
                                        }}
                                        className="w-20 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                        min="0"
                                      />
                                    ) : (
                                      <span className="text-sm">
                                        kr {component.unitPrice ? (component.unitPrice % 1 === 0 ? Math.round(component.unitPrice).toLocaleString('nb-NO') : component.unitPrice.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '0'}
                                      </span>
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
                            </React.Fragment>
                          );
                        })
                      )}
                      <tr className="border-t-2 font-bold">
                        <td colSpan={8} className="py-3 px-2 text-right">Total:</td>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Send tilbud
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Velg kunde
              </label>
              {customers.length === 0 ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Ingen kunder registrert. Gå til <a href="/kunder" className="text-blue-600 hover:underline">Kunder</a> for å opprette kunder først.
                  </p>
                </div>
              ) : (
                <Popover open={openCustomerCombobox} onOpenChange={setOpenCustomerCombobox} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomerCombobox}
                      className="w-full justify-between px-3 py-2 h-auto border-gray-300 hover:bg-gray-50 text-left"
                    >
                      <span className="truncate">
                        {selectedCustomerId
                          ? customers.find((customer) => customer.id === selectedCustomerId)?.navn
                          : "Velg en kunde..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0" 
                    align="start"
                    style={{ zIndex: 9999 }}
                  >
                    <Command>
                      <CommandInput placeholder="Søk etter kunde..." />
                      <CommandList>
                        <CommandEmpty>Ingen kunder funnet.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.navn}
                              onSelect={() => {
                                setSelectedCustomerId(customer.id);
                                setOpenCustomerCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.navn}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
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
    : true;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] z-[400]">
        {/* AI Analysis Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-[500] flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyserer med AI...
              </h3>
              <p className="text-sm text-gray-600">
                Dette kan ta opptil 3 minutter avhengig av prosjektets størrelse
              </p>
            </div>
          </div>
        )}

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
        </div>

      </DrawerContent>

      {/* Backdrop for edit dialog, placed above the Drawer content but below the dialogs */}
      {editDialogOpen && (
        <div
          aria-hidden
          className="fixed inset-0 bg-black/40 z-[450]"
        />
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="z-[600]">
          <DialogHeader>
            <DialogTitle>
              Rediger {editingField === 'name' ? 'navn' : 'beskrivelse'}
            </DialogTitle>
            <DialogDescription>
              Endre {editingField === 'name' ? 'navnet' : 'beskrivelsen'} for denne komponenten.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
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

      <ProductCatalog ref={productCatalogRef} />
    </Drawer>
  );
};
