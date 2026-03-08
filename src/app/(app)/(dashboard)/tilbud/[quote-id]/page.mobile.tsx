'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, User, Eye, Trash2, Plus, Send, ArrowLeft, MoreHorizontal, Loader2 } from 'lucide-react';
import { Tilbud, Kunde, BusinessSettings, PriceComponent } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/shared/Card';
import { updateTilbud, deleteTilbud, getTilbudById, TilbudFormData } from '@/lib/services/tilbudService';
import { getBusinessSettings } from '@/lib/services/businessService';
import { getCustomers } from '@/lib/services/customerService';
import { useBreakpoint } from '@/hooks/useResponsive';
import { generateQuoteEmailHtml } from '@/lib/email/generateQuoteEmailHtml';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProductCatalog, ProductCatalogHandle, ProductCatalogSelectionItem } from '@/components/katalog';
import GroupedDataTable from '@/components/shared/GroupedDataTable';


const EDITABLE_QUOTE_STATUSES = new Set(['draft', 'venter', 'avvist', 'vunnet', 'tapt']);
const DEFAULT_PROJECT_CATEGORY = 'Generelt prosjekt';
type QuoteDetailsPatch = Partial<TilbudFormData> & { notater?: string };

export default function QuoteDetailsPageMobile() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params['quote-id'] as string;

  const [quote, setQuote] = useState<Tilbud | null>(null);
  const [customers, setCustomers] = useState<Kunde[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuote, setEditedQuote] = useState<Partial<TilbudFormData>>({});
  const [editedPriceComponents, setEditedPriceComponents] = useState<PriceComponent[]>([]);
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Price component editing state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PriceComponent | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [editValue, setEditValue] = useState('');
  const productCatalogRef = useRef<ProductCatalogHandle>(null);
  const skipEditingInitRef = useRef(false);
  const pendingComponentsRef = useRef<PriceComponent[] | null>(null);
  const isPersistingPriceRef = useRef(false);
  const [isPriceAutosaving, setIsPriceAutosaving] = useState(false);
  const [priceAutosaveError, setPriceAutosaveError] = useState<string | null>(null);
  const [lastAutosaveAt, setLastAutosaveAt] = useState<number | null>(null);
  const pendingDetailsRef = useRef<QuoteDetailsPatch>({});
  const isPersistingDetailsRef = useRef(false);
  const [isDetailsAutosaving, setIsDetailsAutosaving] = useState(false);
  const [detailsAutosaveError, setDetailsAutosaveError] = useState<string | null>(null);
  const [lastDetailsAutosaveAt, setLastDetailsAutosaveAt] = useState<number | null>(null);

  // Load quote and customers on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [quoteData, customersData] = await Promise.all([
          getTilbudById(quoteId),
          getCustomers()
        ]);

        if (!quoteData) {
          setError('Tilbud ikke funnet');
          return;
        }

        setQuote(quoteData);
        setCustomers(customersData);
      } catch (err) {
        console.error('Error loading quote:', err);
        setError('Kunne ikke laste tilbud');
      } finally {
        setIsLoading(false);
      }
    };

    if (quoteId) {
      loadData();
    }
  }, [quoteId]);

  // Fetch business settings on component mount
  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const settings = await getBusinessSettings();
        setBusinessSettings(settings);
      } catch (error) {
        console.error('Error fetching business settings:', error);
      }
    };

    fetchBusinessSettings();
  }, []);

  // Ensure catalog data is fresh on mount
  useEffect(() => {
    productCatalogRef.current?.refresh();
  }, []);

  // Email cooldown timer
  useEffect(() => {
    if (emailCooldown > 0) {
      const timer = setTimeout(() => {
        setEmailCooldown(emailCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCooldown]);

  const initializeEditingState = useCallback(() => {
    if (!quote) return;

    setEditedQuote({
      kundenavn: quote.kundenavn,
      prosjekt: quote.prosjekt,
      jobbtype: quote.jobbtype,
      belop: quote.belop,
      status: quote.status,
      dato: quote.dato,
      svarfrist: quote.svarfrist,
      template: quote.template || 'modern',
    });
    setEditedPriceComponents(quote.prisgrunnlag ? JSON.parse(JSON.stringify(quote.prisgrunnlag)) : []);
    setEditedNotes(quote.notater || '');
    setIsEditing(true);
  }, [quote]);

  useEffect(() => {
    if (!quote) return;

    if (skipEditingInitRef.current) {
      skipEditingInitRef.current = false;
      return;
    }

    if (EDITABLE_QUOTE_STATUSES.has(quote.status as string)) {
      initializeEditingState();
    } else {
      setIsEditing(false);
      setEditedQuote({});
      setEditedPriceComponents([]);
      setEditedNotes('');
    }
  }, [quote, initializeEditingState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600">Laster tilbud...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="p-4 bg-red-50 rounded-full w-fit mx-auto">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Feil</h1>
            <p className="text-slate-600">{error || 'Tilbud ikke funnet'}</p>
          </div>
          <Button onClick={() => router.push('/tilbud')} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til tilbud
          </Button>
        </div>
      </div>
    );
  }

  const currentQuote = quote;
  const canEditQuote = EDITABLE_QUOTE_STATUSES.has(currentQuote.status as string);
  const relatedCustomer = customers.find(customer => customer.navn === currentQuote.kundenavn);

  const handleResendEmail = async () => {
    if (!relatedCustomer || emailCooldown > 0 || isSendingEmail) return;

    setIsSendingEmail(true);
    try {
      console.log('📧 Resending quote email to:', relatedCustomer.epost);
      console.log('🔗 Quote viewToken:', quote.viewToken);

      let viewToken = quote.viewToken;
      if (!viewToken) {
        console.log('⚠️ ViewToken missing, generating new one...');
        const { ensureViewToken } = await import('@/lib/services/tilbudService');
        viewToken = await ensureViewToken(quote.id);
        console.log('✅ ViewToken generated:', viewToken);
      }

      const baseUrl = window.location.origin;
      const viewUrl = viewToken
        ? `${baseUrl}/tilbudsvisning/${quote.id}?token=${viewToken}`
        : null;

      console.log('🔗 Generated viewUrl:', viewUrl);

      const emailHtml = generateQuoteEmailHtml({
        quote,
        customer: relatedCustomer,
        businessSettings,
        viewUrl,
      });

      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: relatedCustomer.epost,
          subject: `Tilbud: ${quote.prosjekt}`,
          message: emailHtml,
          customerId: relatedCustomer.id,
          quoteId: quote.id,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const responseData = await emailResponse.json();
      console.log('✅ Email resent successfully:', responseData);

      alert(`Tilbud sendt på nytt til ${relatedCustomer.epost}!`);
      setEmailCooldown(10);
    } catch (error: any) {
      console.error('❌ Error resending email:', error);
      alert(`Kunne ikke sende e-post:\n${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendQuote = async () => {
    if (!relatedCustomer || !quote || isSendingEmail) return;

    setIsSendingEmail(true);
    try {
      console.log('📧 Sending quote email to:', relatedCustomer.epost);

      let viewToken = quote.viewToken;
      if (!viewToken) {
        console.log('⚠️ ViewToken missing, generating new one...');
        const { ensureViewToken } = await import('@/lib/services/tilbudService');
        viewToken = await ensureViewToken(quote.id);
        console.log('✅ ViewToken generated:', viewToken);
      }

      const baseUrl = window.location.origin;
      const viewUrl = viewToken
        ? `${baseUrl}/tilbudsvisning/${quote.id}?token=${viewToken}`
        : null;

      console.log('🔗 Generated viewUrl:', viewUrl);

      const emailHtml = generateQuoteEmailHtml({
        quote,
        customer: relatedCustomer,
        businessSettings,
        viewUrl,
      });

      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: relatedCustomer.epost,
          subject: `Tilbud: ${quote.prosjekt}`,
          message: emailHtml,
          customerId: relatedCustomer.id,
          quoteId: quote.id,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const responseData = await emailResponse.json();
      console.log('✅ Email sent successfully:', responseData);

      await updateTilbud(quote.id, { status: 'venter' });
      setQuote(prev => prev ? { ...prev, status: 'venter' } : null);

      alert(`Tilbud sendt til ${relatedCustomer.epost}!`);
      setEmailCooldown(10);
    } catch (error: any) {
      console.error('❌ Error sending quote:', error);
      alert(`Kunne ikke sende tilbud:\n${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const addPriceComponent = () => {
    const newComponent: PriceComponent = {
      id: `comp-${Date.now()}`,
      category: 'materialer',
      name: '',
      description: '',
      produsent: '',
      projectCategory: resolveDefaultProjectCategory(),
      amount: 0,
      quantity: 1,
      unit: 'stk',
      unitPrice: 0,
      priceMarkup: 0,
      materialMarkup: 0,
      isEditable: true,
      confidence: 0,
    };
    setEditedPriceComponents([...editedPriceComponents, newComponent]);
  };

  const updatePriceComponent = (index: number, field: keyof PriceComponent, value: any) => {
    const updated = [...editedPriceComponents];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : updated[index].quantity || 1;
      const unitPrice = field === 'unitPrice' ? value : updated[index].unitPrice || 0;
      updated[index].amount = quantity * unitPrice;
    }

    setEditedPriceComponents(updated);
  };

  const deletePriceComponent = (index: number) => {
    setEditedPriceComponents(editedPriceComponents.filter((_, i) => i !== index));
  };

  const calculateAmountWithMarkup = (component: PriceComponent): number => {
    const baseAmount = (component.quantity || 1) * (component.unitPrice || 0);
    const markupMultiplier = 1 + ((component.priceMarkup || 0) / 100);
    return Math.round(baseAmount * markupMultiplier);
  };

  const resolveDefaultProjectCategory = () => {
    const source = editedPriceComponents.length > 0
      ? editedPriceComponents
      : quote?.prisgrunnlag ?? [];
    const existing = source.find((component) => component.projectCategory?.trim());
    if (existing?.projectCategory) {
      return existing.projectCategory;
    }
    return DEFAULT_PROJECT_CATEGORY;
  };

  const sanitizePriceComponents = (components: PriceComponent[]): PriceComponent[] => {
    return components.map((component) => {
      const quantity = typeof component.quantity === 'number' && !Number.isNaN(component.quantity)
        ? component.quantity
        : 1;
      const unitPrice = typeof component.unitPrice === 'number' && !Number.isNaN(component.unitPrice)
        ? component.unitPrice
        : 0;
      const priceMarkup = typeof component.priceMarkup === 'number' && !Number.isNaN(component.priceMarkup)
        ? component.priceMarkup
        : 0;

      const normalized: PriceComponent = {
        ...component,
        quantity,
        unit: component.unit || 'stk',
        unitPrice,
        priceMarkup,
        materialMarkup: component.materialMarkup ?? 0,
        isEditable: component.isEditable ?? true,
        confidence: component.confidence ?? 0,
        description: component.description ?? '',
        produsent: component.produsent ?? '',
        name: component.name ?? '',
        category: component.category || 'annet',
        projectCategoryDescription: component.projectCategoryDescription || '',
        catalogMatch: component.catalogMatch || '',
        catalogSource: component.catalogSource || '',
      };

      return {
        ...normalized,
        amount: calculateAmountWithMarkup(normalized),
      };
    });
  };

  const persistPriceComponents = async (components: PriceComponent[]) => {
    if (!quote) return;

    pendingComponentsRef.current = components;

    if (isPersistingPriceRef.current) {
      return;
    }

    isPersistingPriceRef.current = true;
    setIsPriceAutosaving(true);
    setPriceAutosaveError(null);
    const quoteId = quote.id;

    try {
      while (pendingComponentsRef.current) {
        const componentsToSave = pendingComponentsRef.current;
        pendingComponentsRef.current = null;
        if (!componentsToSave) {
          break;
        }

        const sanitizedComponents = sanitizePriceComponents(componentsToSave);
        const calculatedTotal = sanitizedComponents.reduce((sum, c) => sum + (c.amount || 0), 0);

        await updateTilbud(quoteId, {
          prisgrunnlag: sanitizedComponents,
          belop: calculatedTotal,
        });

        skipEditingInitRef.current = true;
        setQuote((prev) =>
          prev
            ? {
                ...prev,
                prisgrunnlag: sanitizedComponents,
                belop: calculatedTotal,
              }
            : prev
        );
        setLastAutosaveAt(Date.now());
      }
    } catch (error) {
      console.error('Failed to auto-save prisgrunnlag:', error);
      setPriceAutosaveError('Kunne ikke lagre prisgrunnlag. Sjekk at alle linjer har et prosjekt før du prøver igjen.');
    } finally {
      isPersistingPriceRef.current = false;
      setIsPriceAutosaving(false);
    }
  };

  const persistDetails = async (): Promise<void> => {
    if (!quote) return;

    isPersistingDetailsRef.current = true;
    setIsDetailsAutosaving(true);
    setDetailsAutosaveError(null);
    const quoteId = quote.id;

    try {
      while (pendingDetailsRef.current && Object.keys(pendingDetailsRef.current).length > 0) {
        const patch = pendingDetailsRef.current;
        pendingDetailsRef.current = {};
        const filteredEntries = Object.entries(patch).filter(([, value]) => value !== undefined);
        if (filteredEntries.length === 0) {
          continue;
        }
        const filteredPatch = Object.fromEntries(filteredEntries) as QuoteDetailsPatch;
        await updateTilbud(quoteId, filteredPatch);
        skipEditingInitRef.current = true;
        setQuote((prev) =>
          prev
            ? {
                ...prev,
                ...filteredPatch,
              }
            : prev
        );
        setLastDetailsAutosaveAt(Date.now());
      }
    } catch (error) {
      console.error('Failed to auto-save tilbudsinformasjon:', error);
      setDetailsAutosaveError('Kunne ikke lagre tilbudsinformasjon. Prøv igjen.');
    } finally {
      isPersistingDetailsRef.current = false;
      setIsDetailsAutosaving(false);
      if (pendingDetailsRef.current && Object.keys(pendingDetailsRef.current).length > 0) {
        void persistDetails();
      }
    }
  };

  const scheduleDetailsPersist = (patch: QuoteDetailsPatch) => {
    if (!quote) return;
    pendingDetailsRef.current = { ...pendingDetailsRef.current, ...patch };
    if (!isPersistingDetailsRef.current) {
      void persistDetails();
    }
  };

  function handleQuoteFieldChange<K extends keyof TilbudFormData>(field: K, value: TilbudFormData[K]) {
    setEditedQuote((prev) => ({
      ...prev,
      [field]: value,
    }));
    scheduleDetailsPersist({ [field]: value } as QuoteDetailsPatch);
  }

  const handleNotesChange = (value: string) => {
    setEditedNotes(value);
    scheduleDetailsPersist({ notater: value });
  };

  const updateComponent = (componentId: string, updates: Partial<PriceComponent>) => {
    setEditedPriceComponents(prev => 
      prev.map(comp => {
        if (comp.id === componentId) {
          const updatedComp = { ...comp, ...updates };
          if (updates.quantity !== undefined || updates.unitPrice !== undefined || updates.priceMarkup !== undefined) {
            updatedComp.amount = calculateAmountWithMarkup(updatedComp);
          }
          return updatedComp;
        }
        return comp;
      })
    );
  };

  const removeComponent = (id: string) => {
    setEditedPriceComponents(editedPriceComponents.filter(comp => comp.id !== id));
  };

  const handlePriceComponentsChange = (updatedComponents: PriceComponent[]) => {
    setEditedPriceComponents(updatedComponents);
    const sanitizedComponents = sanitizePriceComponents(updatedComponents);
    const calculatedTotal = sanitizedComponents.reduce((sum, c) => sum + (c.amount || 0), 0);
    setEditedQuote(prev => ({
      ...prev,
      belop: calculatedTotal,
    }));
    void persistPriceComponents(updatedComponents);
  };

  const addComponent = () => {
    const newComponent: PriceComponent = {
      id: `custom-${Date.now()}`,
      category: 'annet',
      name: 'Ny komponent',
      description: 'Beskrivelse av komponenten',
      produsent: '',
      amount: 0,
      quantity: 1,
      unit: 'stk',
      unitPrice: 0,
      priceMarkup: 0,
      materialMarkup: 0,
      isEditable: true,
      confidence: 0,
    };
    
    newComponent.amount = calculateAmountWithMarkup(newComponent);
    setEditedPriceComponents([...editedPriceComponents, newComponent]);
  };

  const applyCatalogSelections = (selections: ProductCatalogSelectionItem[]) => {
    if (selections.length === 0) {
      return;
    }

    const newComponents: PriceComponent[] = selections.map(({ product, quantity }) => {
      const component: PriceComponent = {
        id: `catalog-${product.id}-${Date.now()}`,
        category: 'materialer',
        name: product.produktnavn,
        description: product.beskrivelse || `${product.produsent ? `${product.produsent} - ` : ''}${product.produktnavn}`,
        produsent: product.produsent || '',
        projectCategory: resolveDefaultProjectCategory(),
        amount: 0,
        quantity,
        unit: product.enhet || 'stk',
        unitPrice: product.enhetspris || 0,
        priceMarkup: product.påslag || 0,
        materialMarkup: 0,
        isEditable: true,
        confidence: 0,
      };
      component.amount = calculateAmountWithMarkup(component);
      return component;
    });

    setEditedPriceComponents(prev => [...prev, ...newComponents]);
  };

  const openProductCatalog = async (viewMode: 'grid' | 'list' = 'grid') => {
    if (!productCatalogRef.current) return;
    try {
      const result = await productCatalogRef.current.open({ viewMode });
      if (result.confirmed && result.selections.length > 0) {
        applyCatalogSelections(result.selections);
      }
    } catch (error) {
      console.error('Error opening product catalog:', error);
      alert('Kunne ikke åpne produktkatalogen');
    }
  };

  const openEditDialog = (component: PriceComponent, field: 'name' | 'description') => {
    setEditingComponent(component);
    setEditingField(field);
    setEditValue(component[field] || '');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vunnet':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'tapt':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'venter':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vunnet':
        return 'Vunnet';
      case 'tapt':
        return 'Tapt';
      case 'venter':
        return 'Venter';
      default:
        return status;
    }
  };

  const handlePreview = async () => {
    try {
      let viewToken = quote.viewToken;
      if (!viewToken) {
        console.log('⚠️ ViewToken missing for preview, generating new one...');
        const { ensureViewToken } = await import('@/lib/services/tilbudService');
        viewToken = await ensureViewToken(quote.id);
        console.log('✅ ViewToken generated for preview:', viewToken);
      }

      const previewUrl = viewToken
        ? `/tilbudsvisning/${quoteId}?token=${viewToken}&viewOnly=true`
        : `/tilbudsvisning/${quoteId}?viewOnly=true`;

      router.push(previewUrl);
    } catch (error) {
      console.error('❌ Error generating preview token:', error);
      router.push(`/tilbudsvisning/${quoteId}?viewOnly=true`);
    }
  };

  const getDaysUntilDeadline = (svarfrist: string) => {
    const deadline = new Date(svarfrist);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDeadline = getDaysUntilDeadline(quote.svarfrist);

  const totalComponentCost = (quote.prisgrunnlag || []).reduce((sum, c) => sum + (c.amount || 0), 0);
  const customerPrice = quote.belop || 0;

  const totalProfit = (quote.prisgrunnlag || []).reduce((sum, c) => {
    const amount = c.amount || 0;
    const markupPercent = c.priceMarkup || 0;
    const baseCost = markupPercent > 0 ? amount / (1 + markupPercent / 100) : amount;
    const profit = amount - baseCost;
    return sum + profit;
  }, 0);

  const profitMargin = customerPrice > 0 ? (totalProfit / customerPrice) * 100 : 0;

  const editedTotalProfit = editedPriceComponents.reduce((sum, c) => {
    const amount = c.amount || 0;
    const markupPercent = c.priceMarkup || 0;
    const baseCost = markupPercent > 0 ? amount / (1 + markupPercent / 100) : amount;
    const profit = amount - baseCost;
    return (sum + profit);
  }, 0);

  return (
    <div className="min-h-full bg-background">
      {/* Mobile Header - Compact and Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/tilbud')}
            className="p-0 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">{quote.prosjekt}</h1>
            <p className="text-xs text-slate-500 truncate">{quote.kundenavn}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMoreMenuOpen(true)}
            className="p-0 h-10 w-10"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Status badge - positioned under header */}
        <div className="px-6 py-2 flex items-center gap-2 border-t border-slate-100">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentQuote.status)}`}>
            {getStatusText(currentQuote.status)}
          </span>
          <span className="text-xs text-slate-500">Opprettet: {formatDate(currentQuote.dato)}</span>
          {daysUntilDeadline <= 7 && currentQuote.status !== 'vunnet' && currentQuote.status !== 'tapt' && (
            <span className="text-xs ml-2 text-amber-600 font-medium">
                ⏰ {daysUntilDeadline} dager igjen.
            </span>
          )}
        </div>
      </div>

      {/* Main content with top padding for fixed header */}
      <div className="pt-12 pb-6 px-4 space-y-4">
        
        {/* Customer Card */}
        {relatedCustomer && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Kunde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">{relatedCustomer.navn}</p>
                  <p className="text-slate-600">{relatedCustomer.epost}</p>
                  {relatedCustomer.telefon && (
                    <p className="text-slate-600">{relatedCustomer.telefon}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote Summary Card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tilbudsoppsummering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Beløp</p>
                <p className="text-md font-bold text-slate-900">{formatCurrency(quote.belop)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Svarfrist</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(quote.svarfrist)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Prosjekt:</span>
                <span className="font-medium">{quote.prosjekt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jobbtype:</span>
                <span className="font-medium">{quote.jobbtype}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Components Section */}
        <div className="space-y-3">          
          <GroupedDataTable 
            items={isEditing ? editedPriceComponents : (quote.prisgrunnlag ?? [])}
            editable={isEditing}
            onItemsChange={handlePriceComponentsChange}
            onOpenCatalog={() => openProductCatalog('grid')}
            customCategories={customCategories}
            onCustomCategoriesChange={setCustomCategories}
            enableProjectGrouping
          />
          
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {isPriceAutosaving && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Lagrer prisgrunnlag...
              </span>
            )}
            {!isPriceAutosaving && lastAutosaveAt !== null && !priceAutosaveError && (
              <span>✓ Lagret</span>
            )}
            {priceAutosaveError && (
              <span className="text-red-600">Feil: {priceAutosaveError}</span>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notater</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Legg til notater..."
                  rows={3}
                  className="text-sm resize-none"
                />
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {isDetailsAutosaving && (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Lagrer...
                    </span>
                  )}
                  {!isDetailsAutosaving && lastDetailsAutosaveAt !== null && !detailsAutosaveError && (
                    <span>✓ Lagret</span>
                  )}
                  {detailsAutosaveError && (
                    <span className="text-red-600">Feil: {detailsAutosaveError}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{editedNotes || 'Ingen notater'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Slett tilbud</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-100 rounded-full flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Er du sikker?</p>
                <p className="text-xs text-slate-600 mt-1">
                  Dette vil permanent slette tilbudet for "{quote.prosjekt}". Denne handlingen kan ikke angres.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await deleteTilbud(quote.id);
                  router.push('/tilbud');
                } catch (error) {
                  console.error('Error deleting quote:', error);
                  alert('Kunne ikke slette tilbud');
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Sletter...' : 'Slett tilbud'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog for component name/description */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Rediger {editingField === 'name' ? 'navn' : 'beskrivelse'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={editingField === 'name' ? 'Komponentnavn' : 'Beskrivelse'}
              rows={editingField === 'name' ? 2 : 4}
              className="text-sm"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              onClick={saveEditDialog}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Lagre
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actions Dialog */}
      <Dialog open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold">Handlinger</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                handlePreview();
                setMoreMenuOpen(false);
              }}
              className="w-full justify-start h-11 bg-white hover:bg-slate-50"
            >
              <Eye className="h-4 w-4 mr-3 text-slate-600" />
              <span>Forhåndsvisning</span>
            </Button>

            {currentQuote.status === 'venter' && (
              <Button
                variant="outline"
                onClick={() => {
                  handleResendEmail();
                  setMoreMenuOpen(false);
                }}
                disabled={emailCooldown > 0 || isSendingEmail}
                className="w-full justify-start h-11 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-3 text-slate-600" />
                <span>
                  Send på nytt
                  {emailCooldown > 0 && ` (${emailCooldown}s)`}
                </span>
              </Button>
            )}

            {currentQuote.status === 'draft' && (
              <Button
                variant="outline"
                onClick={() => {
                  handleSendQuote();
                  setMoreMenuOpen(false);
                }}
                disabled={isSendingEmail}
                className="w-full justify-start h-11 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-3 text-slate-600" />
                <span>Send tilbud</span>
              </Button>
            )}

            <div className="my-3 border-t border-slate-200"></div>

            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(true);
                setMoreMenuOpen(false);
              }}
              disabled={isDeleting}
              className="w-full text-red-600 justify-start h-11 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-3 text-red-600" />
              <span>Slett tilbud</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProductCatalog ref={productCatalogRef} />
    </div>
  );
}

// Add missing import for AlertCircle
import { AlertCircle } from 'lucide-react';
