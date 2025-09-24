'use client';

import React, { useState, useEffect } from 'react';
import { X, User, FileText, Calendar, DollarSign, Briefcase, Clock, Edit3, Save, XCircle, ExternalLink, Eye, Download } from 'lucide-react';
import { Tilbud, Kunde } from '@/lib/types';
import { Card } from '@/components/shared/Card';
import { updateTilbud, TilbudFormData } from '@/lib/services/tilbudService';

interface QuoteDetailsDrawerProps {
  quote: Tilbud | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuoteUpdated?: () => void;
  onOpenCustomerDrawer?: (customer: Kunde) => void;
  customers?: Kunde[];
}

export function QuoteDetailsDrawer({ 
  quote, 
  open, 
  onOpenChange, 
  onQuoteUpdated, 
  onOpenCustomerDrawer,
  customers = []
}: QuoteDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedQuote, setEditedQuote] = useState<Partial<TilbudFormData>>({});

  // Reset editing state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditedQuote({});
    }
  }, [open]);

  if (!quote) return null;

  // Find the customer for this quote
  const relatedCustomer = customers.find(customer => customer.navn === quote.kundenavn);

  // Initialize edited quote data when editing starts
  const startEditing = () => {
    setEditedQuote({
      kundenavn: quote.kundenavn,
      prosjekt: quote.prosjekt,
      jobbtype: quote.jobbtype,
      belop: quote.belop,
      status: quote.status,
      dato: quote.dato,
      svarfrist: quote.svarfrist,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedQuote({});
  };

  const saveChanges = async () => {
    try {
      setIsUpdating(true);
      await updateTilbud(quote.id, editedQuote);
      quote = editedQuote as Tilbud; // Update local quote reference
      setIsEditing(false);
      setEditedQuote({});
      onQuoteUpdated?.();
    } catch (error) {
      console.error('Error updating quote:', error);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
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
      <div className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
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
                <button
                  onClick={startEditing}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Edit3 className="h-5 w-5 text-blue-600" />
                </button>
              )}
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
                          Tilbud_{quote.prosjekt.replace(/\s+/g, '_')}_{quote.dato.replace(/-/g, '')}.pdf
                        </div>
                        <div className="text-sm text-gray-600">PDF Dokument</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                        Forhåndsvis
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
    </>
  );
}