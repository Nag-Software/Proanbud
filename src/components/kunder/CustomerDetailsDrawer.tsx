'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Calendar, TrendingUp, FileText, Award, Clock, Edit3, Save, XCircle } from 'lucide-react';
import { Kunde, Tilbud, ColumnDef, TilbudStatus } from '@/lib/types';
import { Card } from '@/components/shared/Card';
import { DataTable } from '@/components/shared/DataTable';
import { updateCustomer, CustomerFormData } from '@/lib/services/customerService';

interface CustomerDetailsDrawerProps {
  customer: Kunde | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated?: () => void;
  onOpenQuoteDrawer?: (quote: Tilbud) => void;
}

// Status pill component for quotes table
const StatusPill: React.FC<{ status: TilbudStatus }> = ({ status }) => {
  const statusStyles = {
    vunnet: 'bg-green-100 text-green-800',
    venter: 'bg-yellow-100 text-yellow-800',
    tapt: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusStyles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export function CustomerDetailsDrawer({ customer, open, onOpenChange, onCustomerUpdated, onOpenQuoteDrawer }: CustomerDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Partial<CustomerFormData>>({});

  // Reset editing state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditedCustomer({});
    }
  }, [open]);

  if (!customer) return null;

  // Define columns for the quotes table
  const quoteColumns: ColumnDef<Tilbud>[] = [
    {
      accessorKey: 'prosjekt',
      header: 'Prosjekt',
    },
    {
      accessorKey: 'jobbtype',
      header: 'Jobbtype',
    },
    {
      accessorKey: 'belop',
      header: 'Beløp',
      cell: ({ row }) => formatCurrency((row.original.belop as number)),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusPill status={row.original.status as TilbudStatus} />,
    },
    {
      accessorKey: 'dato',
      header: 'Dato',
      cell: ({ row }) => formatDate(row.original.dato),
    },
    {
      accessorKey: 'svarfrist',
      header: 'Svarfrist',
      cell: ({ row }) => formatDate(row.original.svarfrist),
    },
  ];

  const handleQuoteClick = (quote: Tilbud) => {
    if (onOpenQuoteDrawer) {
      onOpenQuoteDrawer(quote);
    }
  };

  // Initialize edited customer data when editing starts
  const startEditing = () => {
    if (!customer) return;
    setEditedCustomer({
      navn: customer.navn,
      epost: customer.epost,
      telefon: customer.telefon,
      adresse: customer.addresser?.[0] || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedCustomer({});
  };

  const saveChanges = async () => {
    if (!customer) return;
    try {
      setIsUpdating(true);
      await updateCustomer(customer.id, editedCustomer);
      setIsEditing(false);
      setEditedCustomer({});
      onCustomerUpdated?.();
    } catch (error) {
      console.error('Error updating customer:', error);
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

  const winRate = customer.antallTilbud > 0 ? 
    Math.round((customer.antallVunnet / customer.antallTilbud) * 100) : 0;

  const totalQuoteValue = customer.tilbud?.reduce((sum, tilbud) => sum + tilbud.belop, 0) || 0;
  const wonQuoteValue = customer.tilbud?.filter(t => t.status === 'vunnet')
    .reduce((sum, tilbud) => sum + tilbud.belop, 0) || 0;

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
              <h2 className="text-2xl font-bold text-gray-900">{customer.navn}</h2>
              <p className="text-sm text-gray-600 mt-1">Kundedetaljer</p>
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
            {/* Contact Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Kontaktinformasjon
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedCustomer.epost || ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, epost: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="E-postadresse"
                      />
                    ) : (
                      <span className="text-gray-700">{customer.epost}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedCustomer.telefon || ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, telefon: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Telefonnummer"
                      />
                    ) : (
                      <span className="text-gray-700">{customer.telefon}</span>
                    )}
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-2.5" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedCustomer.adresse || ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, adresse: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Adresse"
                      />
                    ) : (
                      <div className="space-y-1">
                        {customer.addresser && customer.addresser.length > 0 ? (
                          customer.addresser.map((address, index) => (
                            <div key={index} className="text-gray-700">{address}</div>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">Ingen adresse registrert</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Statistics Overview - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <Card>
                <div className="p-4 lg:p-5 text-center">
                  <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg mx-auto mb-2 lg:mb-3">
                    <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                  </div>
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">{customer.antallTilbud}</div>
                  <div className="text-xs lg:text-sm text-gray-600">Totale tilbud</div>
                </div>
              </Card>
              
              <Card>
                <div className="p-4 lg:p-5 text-center">
                  <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg mx-auto mb-2 lg:mb-3">
                    <Award className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                  </div>
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">{customer.antallVunnet}</div>
                  <div className="text-xs lg:text-sm text-gray-600">Vunnede tilbud</div>
                </div>
              </Card>
              
              <Card>
                <div className="p-4 lg:p-5 text-center">
                  <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg mx-auto mb-2 lg:mb-3">
                    <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                  </div>
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">{winRate}%</div>
                  <div className="text-xs lg:text-sm text-gray-600">Treffprosent</div>
                </div>
              </Card>
              
              <Card>
                <div className="p-4 lg:p-5 text-center">
                  <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg mx-auto mb-2 lg:mb-3">
                    <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
                  </div>
                  <div className="text-sm lg:text-sm font-medium text-gray-900">{formatDate(customer.sistAktivitet)}</div>
                  <div className="text-xs lg:text-sm text-gray-600">Sist aktivitet</div>
                </div>
              </Card>
            </div>

            {/* Financial Overview */}
            {totalQuoteValue > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Finansiell oversikt</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Total tilbudsverdi</div>
                      <div className="text-xl font-bold text-gray-900">{formatCurrency(totalQuoteValue)}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600">Vunnet verdi</div>
                      <div className="text-xl font-bold text-green-700">{formatCurrency(wonQuoteValue)}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Customer Quotes Table */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Kundens tilbud ({customer.tilbud?.length || 0})
                </h3>
              </div>
              {customer.tilbud && customer.tilbud.length > 0 ? (
                <DataTable 
                  columns={quoteColumns} 
                  data={customer.tilbud} 
                  enableFiltering 
                  searchPlaceholder="Søk i tilbud..."
                  onRowClick={handleQuoteClick}
                />
              ) : (
                <Card>
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Ingen tilbud funnet</h4>
                    <p className="text-gray-600">
                      Denne kunden har ikke noen registrerte tilbud ennå.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}