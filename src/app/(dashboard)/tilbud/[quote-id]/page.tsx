'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, User, FileText, Calendar, DollarSign, Briefcase, Clock, Save, ExternalLink, Eye, Download, Trash2, Plus, Send, ArrowLeft, MoreHorizontal } from 'lucide-react';
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


const EDITABLE_QUOTE_STATUSES = new Set(['draft', 'venter', 'avvist']);





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
  const [isUpdating, setIsUpdating] = useState(false);
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
  };  const saveChanges = async () => {
    try {
      setIsUpdating(true);
      // Calculate new total from edited price components
      const calculatedTotal = editedPriceComponents.reduce((sum, c) => sum + (c.amount || 0), 0);

      // Update quote with new price components and recalculated total
      await updateTilbud(currentQuote.id, {
        ...editedQuote,
        prisgrunnlag: editedPriceComponents,
        notater: editedNotes,
        belop: calculatedTotal, // Auto-update total based on components
      });

      // Update local state
      setQuote(prev => prev ? {
        ...prev,
        ...editedQuote,
        prisgrunnlag: editedPriceComponents,
        notater: editedNotes,
        belop: calculatedTotal,
      } : null);

    } catch (error) {
      console.error('Error updating quote:', error);
      alert('Kunne ikke oppdatere tilbud');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add new price component
  const addPriceComponent = () => {
    const newComponent: PriceComponent = {
      id: `comp-${Date.now()}`,
      category: 'materialer',
      name: '',
      description: '',
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
                <Button
                  onClick={saveChanges}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Lagrer...' : 'Lagre'}
                </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Prosjekt</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedQuote.prosjekt || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, prosjekt: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Prosjektnavn"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium text-md leading-relaxed">{quote.prosjekt}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Jobbtype</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedQuote.jobbtype || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, jobbtype: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Jobbtype"
                      />
                    ) : (
                      <p className="text-slate-700 text-lg">{quote.jobbtype}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Totalbeløp</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedQuote.belop || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, belop: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Beløp"
                      />
                    ) : (
                      <p className="text-slate-900 font-bold text-lg text-blue-600">{formatCurrency(quote.belop)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    {isEditing ? (
                      <select
                        value={editedQuote.status || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, status: e.target.value as 'venter' | 'vunnet' | 'tapt' })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  {relatedCustomer && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">📧</span>
                        <span className="text-sm">{relatedCustomer.epost}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">📞</span>
                        <span className="text-sm">{relatedCustomer.telefon}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">📊</span>
                        <span className="text-sm">{relatedCustomer.antallVunnet}/{relatedCustomer.antallTilbud} tilbud vunnet</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">🏢</span>
                        <span className="text-sm">{relatedCustomer.addresser}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
          
          { /* New prisgrunnlag */}
          <GroupedDataTable 
            items={isEditing ? editedPriceComponents : (quote.prisgrunnlag ?? [])}
            editable={isEditing}
            onItemsChange={(updatedComponents) => {
              setEditedPriceComponents(updatedComponents);
              // Also update the quote
              setEditedQuote(prev => ({
                ...prev,
                prisgrunnlag: updatedComponents
              }));
            }}
            onOpenCatalog={() => openProductCatalog('grid')}
            customCategories={customCategories}
            onCustomCategoriesChange={setCustomCategories}
          />

          {/* Old prisgrunnlag - to be removed after update is complete */}
          {/* Price Breakdown */}
          {((isEditing && editedPriceComponents.length > 0) || (!isEditing && quote.prisgrunnlag && quote.prisgrunnlag.length > 0)) && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-slate-600" />
                    </div>
                    <CardTitle>Prisgrunnlag</CardTitle>
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button onClick={() => openProductCatalog('grid')} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Legg til produkt
                      </Button>
                      <Button onClick={addComponent} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Lag produkt
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>

                {isEditing ? (
                  <>
                    {/* Category Management */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
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
                        <div className="flex gap-2 mb-3">
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

                    {/* Interactive Price Components Table */}
                    <div className="overflow-x-auto border border-gray-200">
                      <table className="w-full rounded-md">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 border-b">Kategori</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 border-b min-w-[200px]">Navn</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 border-b">Beskrivelse</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 border-b">Antall</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 border-b">Enhet</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 border-b">Enhetspris</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 border-b">Påslag (%)</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 border-b">Total</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 border-b">Sikkerhet</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 border-b">Handlinger</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editedPriceComponents.map((component) => (
                            <tr key={component.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
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
                              </td>
                              <td className="py-3 px-4 min-w-[200px]">
                                <input
                                  type="text"
                                  value={component.name}
                                  onClick={() => openEditDialog(component, 'name')}
                                  readOnly
                                  className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary cursor-pointer"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={component.description}
                                  onClick={() => openEditDialog(component, 'description')}
                                  readOnly
                                  className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary cursor-pointer"
                                />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <input
                                  type="number"
                                  value={component.quantity || 1}
                                  onChange={(e) => {
                                    const quantity = Number(e.target.value);
                                    updateComponent(component.id, { quantity });
                                  }}
                                  className="w-16 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                  min="0"
                                  step="1"
                                />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <input
                                  type="text"
                                  value={component.unit || ''}
                                  onChange={(e) => updateComponent(component.id, { unit: e.target.value })}
                                  className="w-16 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                  placeholder="stk"
                                />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <input
                                  type="number"
                                  step="10"
                                  value={unitPriceInputs.get(component.id) ?? (component.unitPrice || 0)}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, ''); // Remove commas
                                    // Update the input display value
                                    setUnitPriceInputs(prev => new Map(prev).set(component.id, value));

                                    // Only update component if it's a valid number (not ending with just a dot)
                                    if (value === '' || (!value.endsWith('.'))) {
                                      const unitPrice = parseFloat(value) || 0;
                                      updateComponent(component.id, { unitPrice });
                                    }
                                  }}
                                  className="w-20 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                  min="0"
                                />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <input
                                  type="number"
                                  step="1"
                                  value={component.priceMarkup ?? 0}
                                  onChange={(e) => {
                                    const priceMarkup = Number(e.target.value) || 0;
                                    updateComponent(component.id, { priceMarkup });
                                  }}
                                  className="w-16 px-2 py-1 text-sm border rounded text-right focus:ring-1 focus:ring-primary"
                                  min="0"
                                />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="text-sm font-medium">
                                  kr {component.amount.toLocaleString('nb-NO')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {component.confidence > 0 ? (
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(component.confidence)}`}>
                                    {component.confidence}%
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
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
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t-2 font-bold bg-gray-50">
                            <td colSpan={10} className="py-3 pb-0 px-4">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-green-600">Profitt</span>
                                <span className="font-bold text-md text-green-600">
                                  kr {formatCurrency(editedTotalProfit)}
                                </span>
                              </div>
                            </td>
                          </tr>
                          <tr className=" font-bold bg-gray-50">
                            <td colSpan={10} className="py-3 pb-0 px-4">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Total</span>
                                <span className="font-bold text-lg underline">
                                  kr {formatCurrency(editedPriceComponents.reduce((sum, comp) => sum + comp.amount, 0))}
                                </span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={10} className="py-1 px-4 bg-gray-50">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">MVA (25%)</span>
                                <span className="text-xs text-slate-500">
                                  kr {formatCurrency((editedPriceComponents.reduce((sum, comp) => sum + comp.amount, 0) * 0.25))}
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  // View mode - show read-only table
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">Navn</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 border-b border-slate-200">Antall</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 border-b border-slate-200">Enhetspris</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 border-b border-slate-200">Påslag (%)</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 border-b border-slate-200">Beløp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {quote.prisgrunnlag?.map((component, index) => (
                          <tr key={component.id || index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-slate-900">{component.name}</div>
                                {component.description && (
                                  <div className="text-sm text-slate-600 mt-1">{component.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-900">
                              {component.quantity} {component.unit}
                            </td>
                            <td className="px-6 py-4 text-center text-slate-900">
                              {formatCurrency(component.unitPrice || 0)}
                            </td>
                            <td className="px-6 py-4 text-center text-slate-900">
                              {component.priceMarkup || 0}%
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                              {formatCurrency(component.amount || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr className="border-t-2 font-bold bg-gray-50">
                            <td colSpan={10} className="py-3 pb-0 px-4">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-green-600">Profitt</span>
                                <span className="font-bold text-sm text-green-600">
                                  kr {formatCurrency(totalProfit)}
                                </span>
                              </div>
                            </td>
                          </tr>
                          <tr className=" font-bold bg-gray-50">
                            <td colSpan={10} className="py-3 pb-0 px-4">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-lg underline">
                                  kr {formatCurrency(quote.belop || 0)}
                                </span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={10} className="py-1 px-4 bg-gray-50">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">MVA (25%)</span>
                                <span className="text-xs text-slate-500">
                                  kr {formatCurrency((quote.belop || 0) * 0.25)}
                                </span>
                              </div>
                            </td>
                          </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                  onChange={(e) => setEditedNotes(e.target.value)}
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