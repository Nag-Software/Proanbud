'use client';

import React, { useState, useEffect } from 'react';
import { X, User, FileText, Calendar, DollarSign, Briefcase, Clock, Edit3, Save, XCircle, ExternalLink, Eye, Download, Trash2, Plus, Play, RotateCcw, Send } from 'lucide-react';
import { Tilbud, Kunde, BusinessSettings, PriceComponent } from '@/lib/types';
import { Card } from '@/components/shared/Card';
import { updateTilbud, deleteTilbud, TilbudFormData } from '@/lib/services/tilbudService';
import { getBusinessSettings } from '@/lib/services/businessService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


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

interface QuoteDetailsDrawerProps {
  quote: Tilbud | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuoteUpdated?: () => void;
  onOpenCustomerDrawer?: (customer: Kunde) => void;
  customers?: Kunde[];
  onEditQuote?: (quote: Tilbud) => void;
}

export function QuoteDetailsDrawer({ 
  quote, 
  open, 
  onOpenChange, 
  onQuoteUpdated, 
  onOpenCustomerDrawer,
  customers = [],
  onEditQuote
}: QuoteDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedQuote, setEditedQuote] = useState<Partial<TilbudFormData>>({});
  const [editedPriceComponents, setEditedPriceComponents] = useState<PriceComponent[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Reset editing state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditedQuote({});
    }
  }, [open]);

  // Set selected template based on quote
  useEffect(() => {
    if (quote?.template) {
      setSelectedTemplate(quote.template);
    } else {
      setSelectedTemplate('modern');
    }
  }, [quote]);

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

  // Email cooldown timer
  useEffect(() => {
    if (emailCooldown > 0) {
      const timer = setTimeout(() => {
        setEmailCooldown(emailCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCooldown]);

  if (!quote) return null;

  // At this point, quote is guaranteed to be non-null
  const currentQuote = quote;

  // Find the customer for this quote
  const relatedCustomer = customers.find(customer => customer.navn === currentQuote.kundenavn);

  // Initialize edited quote data when editing starts
  const startEditing = () => {
    setEditedQuote({
      kundenavn: currentQuote.kundenavn,
      prosjekt: currentQuote.prosjekt,
      jobbtype: currentQuote.jobbtype,
      belop: currentQuote.belop,
      status: currentQuote.status,
      dato: currentQuote.dato,
      svarfrist: currentQuote.svarfrist,
      template: currentQuote.template || 'modern',
    });
    // Deep copy of price components for editing
    setEditedPriceComponents(currentQuote.prisgrunnlag ? JSON.parse(JSON.stringify(currentQuote.prisgrunnlag)) : []);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedQuote({});
    setEditedPriceComponents([]);
  };

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

      const baseUrl = "https://proanbud.no"; //window.location.origin
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

  const saveChanges = async () => {
    try {
      setIsUpdating(true);
      // Calculate new total from edited price components
      const calculatedTotal = editedPriceComponents.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      // Update quote with new price components and recalculated total
      await updateTilbud(currentQuote.id, {
        ...editedQuote,
        prisgrunnlag: editedPriceComponents,
        belop: calculatedTotal, // Auto-update total based on components
      });
      setIsEditing(false);
      setEditedQuote({});
      setEditedPriceComponents([]);
      onQuoteUpdated?.();
    } catch (error) {
      console.error('Error updating quote:', error);
      // You could add a toast notification here
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tapt':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'venter':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleOpenCustomerDrawer = () => {
    if (relatedCustomer && onOpenCustomerDrawer) {
      onOpenCustomerDrawer(relatedCustomer);
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

  const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength - 3) + '...';
  };

  const handleTemplateChange = async (template: string) => {
    setSelectedTemplate(template);
    if (isEditing) {
      setEditedQuote(prev => ({ ...prev, template }));
    }
    setIsLoadingTemplate(true);
    try {
      const templateContent = await downloadTemplate(template);
      setTemplateHtml(templateContent);
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handlePreview = async () => {
    setIsLoadingTemplate(true);
    try {
      const template = await downloadTemplate(selectedTemplate);
      setTemplateHtml(template);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error loading template for preview:', error);
      // You could show an error message to the user here
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const generatePreviewHtml = () => {
    let html = templateHtml;

    // Replace quote placeholders
    html = html.replace(/\{\{quote\.prosjekt\}\}/g, quote.prosjekt);
    html = html.replace(/\{\{quote\.id\}\}/g, quote.id.slice(-6).toUpperCase());
    html = html.replace(/\{\{quote\.dato\}\}/g, formatDate(quote.dato));
    html = html.replace(/\{\{quote\.svarfrist\}\}/g, formatDate(quote.svarfrist));
    html = html.replace(/\{\{quote\.status\}\}/g, getStatusText(quote.status));
    html = html.replace(/\{\{quote\.kundenavn\}\}/g, quote.kundenavn);
    html = html.replace(/\{\{quote\.jobbtype\}\}/g, quote.jobbtype);
    html = html.replace(/\{\{quote\.belop\}\}/g, formatCurrency(quote.belop));

    // Handle quote.beskrivelse (description) - support both simple placeholder and block form
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const nl2br = (text: string) => {
      if (!text) return '';
      // First escape to avoid injecting unsafe HTML, then replace newlines with <br/>
      return escapeHtml(text).replace(/\r?\n/g, '<br/>');
    };

    // Replace block form: {{#quote.beskrivelse}}...{{/quote.beskrivelse}} with the description (converted)
    html = html.replace(/\{\{#quote\.beskrivelse\}\}[\s\S]*?\{\{\/quote\.beskrivelse\}\}/g, nl2br(quote.beskrivelse || ''));

    // Replace simple placeholder if present
    html = html.replace(/\{\{quote\.beskrivelse\}\}/g, nl2br(quote.beskrivelse || ''));

    // Render price components into table rows for {{quote.prisgrunnlag}}
    const renderPrisgrunnlag = (components?: PriceComponent[]) => {
      if (!components || components.length === 0) return '';
      return components.map((c) => {
        const name = escapeHtml(c.name || '');
        const desc = escapeHtml(c.description || '');
        const qty = c.quantity != null ? `${c.quantity}${c.unit ? ' ' + escapeHtml(c.unit) : ''}` : '';
        const unitPrice = c.unitPrice != null ? formatCurrency(c.unitPrice) : '';
        const amount = formatCurrency(c.amount || 0);

        return `
          <tr>
            <td style="padding:12px;border-right:1px solid #e5e7eb;vertical-align:top;">
              <div style="font-weight:600;color:#374151;">${name}</div>
              ${desc ? `<div style="color:#6b7280;font-size:0.9rem;margin-top:6px;">${desc}</div>` : ''}
            </td>
            <td style="padding:12px;text-align:center;border-right:1px solid #e5e7eb;vertical-align:top;">${qty}</td>
            <td style="padding:12px;text-align:center;border-right:1px solid #e5e7eb;vertical-align:top;">${unitPrice}</td>
            <td style="padding:12px;text-align:right;vertical-align:top;">${amount}</td>
          </tr>
        `;
      }).join('');
    };

    html = html.replace(/\{\{quote\.prisgrunnlag\}\}/g, renderPrisgrunnlag(quote.prisgrunnlag));

    // Replace customer placeholders
    if (relatedCustomer) {
      html = html.replace(/\{\{customer\.epost\}\}/g, relatedCustomer.epost);
      html = html.replace(/\{\{customer\.telefon\}\}/g, relatedCustomer.telefon);
    } else {
      html = html.replace(/\{\{customer\.epost\}\}/g, 'Ikke tilgjengelig');
      html = html.replace(/\{\{customer\.telefon\}\}/g, 'Ikke tilgjengelig');
    }

    // Replace business placeholders
    if (businessSettings) {
      html = html.replace(/\{\{business\.name\}\}/g, businessSettings.companyName || 'Bedriftsnavn');
      html = html.replace(/\{\{business\.orgnr\}\}/g, businessSettings.organizationNumber || 'Org.nr');
      html = html.replace(/\{\{business\.address\}\}/g, businessSettings.address || '');
      html = html.replace(/\{\{business\.postalCode\}\}/g, businessSettings.postalCode || '');
      html = html.replace(/\{\{business\.city\}\}/g, businessSettings.city || '');
      html = html.replace(/\{\{business\.phone\}\}/g, businessSettings.phone || '');
      html = html.replace(/\{\{business\.email\}\}/g, businessSettings.email || '');
      html = html.replace(/\{\{business\.website\}\}/g, businessSettings.website || '');
      html = html.replace(/\{\{business\.logoUrl\}\}/g, businessSettings.logoUrl || '');
      html = html.replace(/\{\{business\.bankAccount\}\}/g, businessSettings.bankAccount || '');
    } else {
      html = html.replace(/\{\{business\.name\}\}/g, 'Bedriftsnavn');
      html = html.replace(/\{\{business\.orgnr\}\}/g, 'Org.nr');
      html = html.replace(/\{\{business\.address\}\}/g, '');
      html = html.replace(/\{\{business\.postalCode\}\}/g, '');
      html = html.replace(/\{\{business\.city\}\}/g, '');
      html = html.replace(/\{\{business\.phone\}\}/g, '');
      html = html.replace(/\{\{business\.email\}\}/g, '');
      html = html.replace(/\{\{business\.website\}\}/g, '');
      html = html.replace(/\{\{business\.logoUrl\}\}/g, '');
      html = html.replace(/\{\{business\.bankAccount\}\}/g, '');
    }

    return html;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => onOpenChange(false)}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{quote.prosjekt}</h2>
              <p className="text-sm text-gray-600 mt-1">Tilbudsdetaljer</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={cancelEditing}
                    disabled={isUpdating}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={isUpdating}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="h-5 w-5 text-green-600" />
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  {quote?.status === 'draft' && onEditQuote && (
                    <button
                      onClick={() => onEditQuote(quote)}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Fortsett redigering"
                    >
                      <Play className="h-5 w-5 text-purple-600" />
                    </button>
                  )}
                  {/* Send tilbud på nytt button with cooldown */}
                  {relatedCustomer && quote?.status !== 'draft' && (
                    <button
                      onClick={handleResendEmail}
                      disabled={emailCooldown > 0 || isSendingEmail}
                      className="px-3 py-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title={emailCooldown > 0 ? `Vent ${emailCooldown} sekunder` : 'Send tilbud på nytt'}
                    >
                      <Send className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {isSendingEmail ? 'Sender...' : 'Send tilbud'}
                        {emailCooldown > 0 && ` (${emailCooldown}s)`}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={startEditing}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-5 w-5 text-blue-600" />
                  </button>
                </div>
              )}
              {/* Delete button */}
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Slett tilbud"
                disabled={isDeleting}
              >
                <Trash2 className="h-5 w-5 text-red-600" />
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quote Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Tilbudsinformasjon
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prosjekt</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedQuote.prosjekt || ''}
                          onChange={(e) => setEditedQuote({ ...editedQuote, prosjekt: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Prosjektnavn"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{quote.prosjekt}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jobbtype</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedQuote.jobbtype || ''}
                          onChange={(e) => setEditedQuote({ ...editedQuote, jobbtype: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Jobbtype"
                        />
                      ) : (
                        <p className="text-gray-900">{quote.jobbtype}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Beløp</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedQuote.belop || ''}
                          onChange={(e) => setEditedQuote({ ...editedQuote, belop: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Beløp"
                        />
                      ) : (
                        <p className="text-gray-900 font-semibold text-lg">{formatCurrency(quote.belop)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      {isEditing ? (
                        <select
                          value={editedQuote.status || ''}
                          onChange={(e) => setEditedQuote({ ...editedQuote, status: e.target.value as 'venter' | 'vunnet' | 'tapt' })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="venter">Venter</option>
                          <option value="vunnet">Vunnet</option>
                          <option value="tapt">Tapt</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(quote.status)}`}>
                          {getStatusText(quote.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Kundeinformasjon
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-lg">{quote.kundenavn}</p>
                    {relatedCustomer && (
                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                        <p>📧 {relatedCustomer.epost}</p>
                        <p>📞 {relatedCustomer.telefon}</p>
                        <p>📊 {relatedCustomer.antallVunnet}/{relatedCustomer.antallTilbud} tilbud vunnet</p>
                      </div>
                    )}
                  </div>
                  {relatedCustomer && onOpenCustomerDrawer && (
                    <button
                      onClick={handleOpenCustomerDrawer}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Se kunde
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Price Breakdown */}
            {((isEditing && editedPriceComponents.length > 0) || (!isEditing && quote.prisgrunnlag && quote.prisgrunnlag.length > 0)) && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Prisgrunnlag
                    </h3>
                    {isEditing && (
                      <button
                        onClick={addPriceComponent}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Legg til komponent
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {isEditing ? (
                      // Edit mode - show editable fields
                      editedPriceComponents.map((component, index) => (
                        <div key={component.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Name */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Navn</label>
                              <input
                                type="text"
                                value={component.name}
                                onChange={(e) => updatePriceComponent(index, 'name', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Komponentnavn"
                              />
                            </div>
                            
                            {/* Category */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Kategori</label>
                              <select
                                value={component.category}
                                onChange={(e) => updatePriceComponent(index, 'category', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="materialer">Materialer</option>
                                <option value="arbeid">Arbeid</option>
                                <option value="transport">Transport</option>
                                <option value="utstyr">Utstyr</option>
                                <option value="margin">Margin</option>
                                <option value="annet">Annet</option>
                              </select>
                            </div>
                            
                            {/* Description */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Beskrivelse</label>
                              <textarea
                                value={component.description}
                                onChange={(e) => updatePriceComponent(index, 'description', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Beskrivelse av komponenten"
                                rows={2}
                              />
                            </div>
                            
                            {/* Quantity */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Antall</label>
                              <input
                                type="number"
                                value={component.quantity || 0}
                                onChange={(e) => updatePriceComponent(index, 'quantity', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            
                            {/* Unit */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Enhet</label>
                              <input
                                type="text"
                                value={component.unit || ''}
                                onChange={(e) => updatePriceComponent(index, 'unit', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="stk, m², timer"
                              />
                            </div>
                            
                            {/* Unit Price */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Enhetspris (kr)</label>
                              <input
                                type="number"
                                value={component.unitPrice || 0}
                                onChange={(e) => updatePriceComponent(index, 'unitPrice', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            
                            {/* Total Amount */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Totalt beløp (kr)</label>
                              <input
                                type="number"
                                value={component.amount || 0}
                                onChange={(e) => updatePriceComponent(index, 'amount', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            
                            {/* Price Markup */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Prispåslag (%)</label>
                              <input
                                type="number"
                                value={component.priceMarkup || 0}
                                onChange={(e) => updatePriceComponent(index, 'priceMarkup', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.1"
                              />
                            </div>
                            
                            {/* Material Markup */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Materialpåslag (%)</label>
                              <input
                                type="number"
                                value={component.materialMarkup || 0}
                                onChange={(e) => updatePriceComponent(index, 'materialMarkup', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                          
                          {/* Delete button */}
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => deletePriceComponent(index)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Slett
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      // View mode - show read-only display
                      quote.prisgrunnlag?.map((component, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
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
                      ))
                    )}
                    
                    <div className="border-t pt-3 mt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Kundepris (Total)</span>
                        <span className="font-bold text-lg text-gray-900">
                          {isEditing 
                            ? formatCurrency(editedPriceComponents.reduce((sum, c) => sum + (c.amount || 0), 0))
                            : formatCurrency(customerPrice)
                          }
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Totale kostnader (sum priskomponenter)</span>
                          <span className="font-medium text-gray-900">
                            {isEditing
                              ? formatCurrency(editedPriceComponents.reduce((sum, c) => sum + (c.amount || 0), 0))
                              : formatCurrency(totalComponentCost)
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                          <span>Profitt</span>
                          <span className={`font-medium ${
                            isEditing 
                              ? (0 >= 0 ? 'text-green-700' : 'text-red-700')
                              : (totalProfit >= 0 ? 'text-green-700' : 'text-red-700')
                          }`}>
                            {isEditing 
                              ? `${formatCurrency(0)} (0.0%)`
                              : `${formatCurrency(totalProfit)} ${customerPrice > 0 ? `(${profitMargin.toFixed(1)}%)` : ''}`
                            }
                          </span>
                        </div>
                        {isEditing && (
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Tips: Total beløp vil automatisk oppdateres basert på summen av alle komponenter
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Timeline Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Datoer
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tilbudsdato</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedQuote.dato || ''}
                          onChange={(e) => setEditedQuote({ ...editedQuote, dato: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{formatDate(quote.dato)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Svarfrist</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedQuote.svarfrist || ''}
                          onChange={(e) => setEditedQuote({ ...editedQuote, svarfrist: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{formatDate(quote.svarfrist)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Tidsfrister
                  </h3>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      daysUntilDeadline <= 0 ? 'text-red-600' : 
                      daysUntilDeadline <= 7 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {daysUntilDeadline <= 0 ? 'Utløpt' : `${daysUntilDeadline} dager`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {daysUntilDeadline <= 0 ? 'til svarfrist' : 'til svarfrist'}
                    </div>
                    {daysUntilDeadline <= 7 && daysUntilDeadline > 0 && (
                      <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Snart utløp!
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* PDF Preview */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  Tilbudsdokument
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {truncateFilename(`Tilbud_${quote.prosjekt.replace(/\s+/g, '_')}_${quote.dato.replace(/-/g, '')}.pdf`)}
                        </div>
                        <div className="text-sm text-gray-600">PDF Dokument</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handlePreview}
                        disabled={isLoadingTemplate}
                        className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Eye className="h-4 w-4" />
                        {isLoadingTemplate ? 'Laster...' : 'Forhåndsvis'}
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Download className="h-4 w-4" />
                        Last ned
                      </button>
                    </div>
                  </div>
                  
                  {/* PDF Preview Container */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <div className="h-96 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-red-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">PDF Forhåndsvisning</h4>
                        <p className="text-gray-600 mb-4 max-w-sm">
                          Klikk "Forhåndsvis" for å se tilbudsdokumentet, eller "Last ned" for å laste ned PDF-filen.
                        </p>
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Prosjekt: {quote.prosjekt}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Kunde: {quote.kundenavn}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Beløp: {formatCurrency(quote.belop)}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>Status: {getStatusText(quote.status)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    💡 Tips: Du kan generere nye PDF-dokumenter basert på oppdaterte tilbudsdata
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tilbudsforhåndsvisning - {quote.prosjekt}</DialogTitle>
          </DialogHeader>

          {/* Template Selector */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Velg mal:</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleTemplateChange('modern')}
                disabled={isLoadingTemplate}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplate === 'modern'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Moderne
              </button>
              <button
                onClick={() => handleTemplateChange('classic')}
                disabled={isLoadingTemplate}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplate === 'classic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Klassisk
              </button>
              <button
                onClick={() => handleTemplateChange('minimal')}
                disabled={isLoadingTemplate}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplate === 'minimal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Minimal
              </button>
            </div>
            {isLoadingTemplate && (
              <p className="text-xs text-gray-500 mt-2">Laster mal...</p>
            )}
          </div>

          <div className="mt-4">
            <div
              className="bg-white border rounded-lg shadow-sm"
              dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Slett tilbud</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-sm text-gray-700 mb-4">Er du sikker på at du vil slette tilbudet <strong>{quote.prosjekt}</strong>? Denne handlingen kan ikke reverseres.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                disabled={isDeleting}
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteTilbud(quote.id);
                    setIsDeleteConfirmOpen(false);
                    setIsDeleting(false);
                    onOpenChange(false);
                    onQuoteUpdated?.();
                  } catch (error) {
                    console.error('Feil ved sletting av tilbud:', error);
                    setIsDeleting(false);
                    // Optionally show a toast here
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Sletter...' : 'Slett'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}