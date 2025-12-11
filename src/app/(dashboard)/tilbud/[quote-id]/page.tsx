'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, User, FileText, Calendar, DollarSign, Briefcase, Clock, ExternalLink, Eye, Download, Trash2, Plus, Send, ArrowLeft, MoreHorizontal, Loader2 } from 'lucide-react';
import { Tilbud, Kunde, BusinessSettings, PriceComponent } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/shared/Card';
import { updateTilbud, deleteTilbud, getTilbudById, TilbudFormData } from '@/lib/services/tilbudService';
import { getBusinessSettings } from '@/lib/services/businessService';
import { getCustomers } from '@/lib/services/customerService';
import { useBreakpoint } from '@/hooks/useResponsive';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductCatalog, ProductCatalogHandle, ProductCatalogSelectionItem } from '@/components/katalog';
import GroupedDataTable from '@/components/shared/GroupedDataTable';


const EDITABLE_QUOTE_STATUSES = new Set(['draft', 'venter', 'avvist', 'vunnet', 'tapt']);
const DEFAULT_PROJECT_CATEGORY = 'Generelt prosjekt';
type QuoteDetailsPatch = Partial<TilbudFormData> & { notater?: string };





export default function QuoteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params['quote-id'] as string;
  const breakpoints = useBreakpoint();
  const isMobile = !breakpoints.md;

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

  // Price component editing state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PriceComponent | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [unitPriceInputs, setUnitPriceInputs] = useState<Map<string, string>>(new Map());
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 text-lg">Laster tilbud...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="p-4 bg-red-50 rounded-full w-fit mx-auto">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Feil</h1>
            <p className="text-slate-600">{error || 'Tilbud ikke funnet'}</p>
          </div>
          <Button onClick={() => router.push('/tilbud')} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til tilbud
          </Button>
        </div>
      </div>
    );
  }

  // At this point, quote is guaranteed to be non-null
  const currentQuote = quote;
  const canEditQuote = EDITABLE_QUOTE_STATUSES.has(currentQuote.status as string);

  // Find the customer for this quote
  const relatedCustomer = customers.find(customer => customer.navn === currentQuote.kundenavn);

  const handleResendEmail = async () => {
    if (!relatedCustomer || emailCooldown > 0 || isSendingEmail) return;

    setIsSendingEmail(true);
    try {
      console.log('📧 Resending quote email to:', relatedCustomer.epost);
      console.log('🔗 Quote viewToken:', quote.viewToken);
      console.log('🔗 Quote ID:', quote.id);

      // Ensure the quote has a viewToken
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

      // Generate email HTML
      const emailHtml = generateEmailHtml(quote, relatedCustomer, viewUrl);

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
      setEmailCooldown(10); // Start 10 second cooldown
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
      console.log('🔗 Quote ID:', quote.id);

      // Ensure the quote has a viewToken
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

      // Generate email HTML
      const emailHtml = generateEmailHtml(quote, relatedCustomer, viewUrl);

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

      // Update quote status to 'venter'
      await updateTilbud(quote.id, { status: 'venter' });
      
      // Update local state
      setQuote(prev => prev ? { ...prev, status: 'venter' } : null);

      alert(`Tilbud sendt til ${relatedCustomer.epost}!`);
      setEmailCooldown(10); // Start 10 second cooldown
    } catch (error: any) {
      console.error('❌ Error sending quote:', error);
      alert(`Kunne ikke sende tilbud:\n${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const generateEmailHtml = (quote: Tilbud, customer: Kunde, viewUrl: string | null) => {
    const companyName = businessSettings?.companyName || 'Håndverksbedrift';
    
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
            ${viewUrl ? 'Vi sender tilbudet på nytt. ' : ''}Takk for henvendelsen! Her er vårt tilbud for prosjektet "${quote.prosjekt}".
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
  // Add new price component
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

  // Update a price component
  const updatePriceComponent = (index: number, field: keyof PriceComponent, value: any) => {
    const updated = [...editedPriceComponents];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate amount if quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : updated[index].quantity || 1;
      const unitPrice = field === 'unitPrice' ? value : updated[index].unitPrice || 0;
      updated[index].amount = quantity * unitPrice;
    }

    setEditedPriceComponents(updated);
  };

  // Delete a price component
  const deletePriceComponent = (index: number) => {
    setEditedPriceComponents(editedPriceComponents.filter((_, i) => i !== index));
  };

  // Enhanced price component management functions (from NewQuoteDrawer)
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
          // Recalculate amount when quantity, unitPrice, or markup changes
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
      amount: 0, // Will be calculated below
      quantity: 1,
      unit: 'stk',
      unitPrice: 0,
      priceMarkup: 0,
      materialMarkup: 0,
      isEditable: true,
      confidence: 0, // 0 indicates user-added component, not AI-generated
    };
    
    // Calculate amount based on quantity and unitPrice
    newComponent.amount = calculateAmountWithMarkup(newComponent);
    setEditedPriceComponents([...editedPriceComponents, newComponent]);
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
      setEditedPriceComponents(prev => prev.map(comp =>
        comp.category === categoryName ? { ...comp, category: 'annet' as PriceComponent['category'] } : comp
      ));
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

  // Catalog helpers
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

  // Edit dialog functions
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
      // Ensure the quote has a viewToken
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
      // Fallback to viewOnly without token
      router.push(`/tilbudsvisning/${quoteId}?viewOnly=true`);
    }
  };

  const handleOpenCustomerDrawer = () => {
    if (relatedCustomer) {
      router.push(`/kunder`);
    }
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (svarfrist: string) => {
    const deadline = new Date(svarfrist);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDeadline = getDaysUntilDeadline(quote.svarfrist);

  // Pricing calculations for reconciliation and profit
  const totalComponentCost = (quote.prisgrunnlag || []).reduce((sum, c) => sum + (c.amount || 0), 0);
  const customerPrice = quote.belop || 0;

  // Calculate actual profit considering markup
  const totalProfit = (quote.prisgrunnlag || []).reduce((sum, c) => {
    const amount = c.amount || 0;
    const markupPercent = c.priceMarkup || 0;
    // Calculate base cost: amount / (1 + markup%)
    const baseCost = markupPercent > 0 ? amount / (1 + markupPercent / 100) : amount;
    // Profit = final amount - base cost
    const profit = amount - baseCost;
    return sum + profit;
  }, 0);

  const profitMargin = customerPrice > 0 ? (totalProfit / customerPrice) * 100 : 0;

  // Calculate profit for edited components
  const editedTotalProfit = editedPriceComponents.reduce((sum, c) => {
    const amount = c.amount || 0;
    const markupPercent = c.priceMarkup || 0;
    // Calculate base cost: amount / (1 + markup%)
    const baseCost = markupPercent > 0 ? amount / (1 + markupPercent / 100) : amount;
    // Profit = final amount - base cost
    const profit = amount - baseCost;
    return (sum + profit);
  }, 0);

  const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="min-h-full bg-background rounded-lg px-3 lg:px-6 pt-4 pb-3 lg:pb-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b rounded-xl border-slate-100 sticky top-0 z-10">
        <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => router.push('/tilbud')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbake til tilbud
              </Button>
              <div className="border-l border-slate-200 pl-6">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm text-slate-600">Tilbudsdetaljer</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                    {getStatusText(quote.status)}
                    
                  </span>
                  {daysUntilDeadline > 0 && (
                          <span className="text-xs text-slate-600">
                            {daysUntilDeadline} dager igjen
                          </span>
                        )}
                </div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{quote.prosjekt}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="hidden min-[1500px]:flex items-center gap-2">
                  {relatedCustomer && quote?.status === 'draft' && (
                    <Button
                      onClick={handleSendQuote}
                      disabled={isSendingEmail}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSendingEmail ? 'Sender...' : 'Send tilbud'}
                    </Button>
                  )}
                  {relatedCustomer && quote?.status !== 'draft' && (
                    <Button
                      onClick={handleResendEmail}
                      disabled={emailCooldown > 0 || isSendingEmail}
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSendingEmail ? 'Sender...' : 'Send tilbud'}
                      {emailCooldown > 0 && ` (${emailCooldown}s)`}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Forhåndsvis
                  </Button>
                </div>

                <div className="min-[1500px]:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {relatedCustomer && quote?.status === 'draft' && (
                        <DropdownMenuItem
                          onClick={handleSendQuote}
                          disabled={isSendingEmail}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSendingEmail ? 'Sender...' : 'Send tilbud'}
                        </DropdownMenuItem>
                      )}
                      {relatedCustomer && quote?.status !== 'draft' && (
                        <DropdownMenuItem
                          onClick={handleResendEmail}
                          disabled={emailCooldown > 0 || isSendingEmail}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSendingEmail ? 'Sender...' : 'Send tilbud'}
                          {emailCooldown > 0 && ` (${emailCooldown}s)`}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handlePreview}>
                        <Eye className="h-4 w-4 mr-2" />
                        Forhåndsvis
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {canEditQuote && (
                <div className="flex flex-col items-end text-xs text-slate-500 mr-3">
                  {isDetailsAutosaving && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Lagrer detaljer...
                    </span>
                  )}
                  {!isDetailsAutosaving && detailsAutosaveError && (
                    <span className="text-red-600">{detailsAutosaveError}</span>
                  )}
                  {!isDetailsAutosaving && !detailsAutosaveError && lastDetailsAutosaveAt !== null && (
                    <span>
                      Sist lagret {new Date(lastDetailsAutosaveAt ?? 0).toLocaleTimeString('no-NO', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              )}

              {/* Delete button */}
              <Button
                variant="destructive"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slett
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Grid for Quote and Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quote Information */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <FileText className="h-6 w-6 text-slate-600" />
                  </div>
                  <CardTitle>Tilbudsinformasjon</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Prosjekt</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedQuote.prosjekt || ''}
                      onChange={(e) => handleQuoteFieldChange('prosjekt', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Prosjektnavn"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium text-md leading-relaxed">{quote.prosjekt}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Jobbtype</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedQuote.jobbtype || ''}
                        onChange={(e) => handleQuoteFieldChange('jobbtype', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Jobbtype"
                      />
                    ) : (
                      <p className="text-slate-700 text-lg">{quote.jobbtype}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    {isEditing ? (
                      <select
                        value={editedQuote.status || ''}
                        onChange={(e) => handleQuoteFieldChange('status', e.target.value as 'venter' | 'vunnet' | 'tapt')}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="venter">Venter</option>
                        <option value="vunnet">Vunnet</option>
                        <option value="tapt">Tapt</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(quote.status)}`}>
                          {getStatusText(quote.status)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>

          {/* Customer Information */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <User className="h-6 w-6 text-slate-600" />
                </div>
                <CardTitle>Kundeinformasjon</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-slate-900 font-semibold text-xl">{quote.kundenavn}</p>
                  {relatedCustomer ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">📧</span>
                        <span className="text-sm">{relatedCustomer?.epost}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">📞</span>
                        <span className="text-sm">{relatedCustomer?.telefon}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">📊</span>
                        <span className="text-sm">{relatedCustomer?.antallVunnet}/{relatedCustomer?.antallTilbud} tilbud vunnet</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">🏢</span>
                        <span className="text-sm">{relatedCustomer?.addresser}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
          
          <GroupedDataTable 
            items={isEditing ? editedPriceComponents : (quote.prisgrunnlag ?? [])}
            editable={isEditing}
            onItemsChange={handlePriceComponentsChange}
            onOpenCatalog={() => openProductCatalog('grid')}
            customCategories={customCategories}
            onCustomCategoriesChange={setCustomCategories}
            enableProjectGrouping
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {isPriceAutosaving && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Lagrer prisgrunnlag...
              </span>
            )}
            {!isPriceAutosaving && lastAutosaveAt !== null && !priceAutosaveError && (
              <span>
                Sist lagret {new Date(lastAutosaveAt ?? 0).toLocaleTimeString('no-NO', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
            {priceAutosaveError && (
              <span className="text-red-600">{priceAutosaveError}</span>
            )}
          </div>

          {/* Notes */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <FileText className="h-6 w-6 text-slate-600" />
                </div>
                <CardTitle>Notater</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Skriv inn notater om prosjektet (f.eks. hvor lang tid det skal ta, spesielle forhold, etc.)"
                  className="min-h-[120px] resize-none"
                  rows={5}
                />
              ) : (
                <div className="min-h-[120px] p-4 bg-gray-50 rounded-lg">
                  {quote?.notater ? (
                    <p className="text-slate-700 whitespace-pre-wrap">{quote.notater}</p>
                  ) : (
                    <p className="text-slate-500 italic">Ingen notater lagt til ennå.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Slett tilbud</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-slate-700 mb-2">Er du sikker på at du vil slette tilbudet <strong className="text-slate-900">{quote.prosjekt}</strong>?</p>
                <p className="text-sm text-slate-600">Denne handlingen kan ikke reverseres.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteTilbud(quote.id);
                    setIsDeleteConfirmOpen(false);
                    setIsDeleting(false);
                    router.push('/tilbud');
                  } catch (error) {
                    console.error('Feil ved sletting av tilbud:', error);
                    setIsDeleting(false);
                    alert('Kunne ikke slette tilbud');
                  }
                }}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Sletter...' : 'Slett'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProductCatalog ref={productCatalogRef} />

      {/* Edit Dialog for component name/description */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Rediger {editingField === 'name' ? 'navn' : 'beskrivelse'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {editingField === 'name' ? 'Navn' : 'Beskrivelse'}
                </label>
                {editingField === 'name' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Skriv inn navn..."
                  />
                ) : (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Skriv inn beskrivelse..."
                    rows={4}
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Avbryt
              </Button>
              <Button
                onClick={saveEditDialog}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Lagre
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}