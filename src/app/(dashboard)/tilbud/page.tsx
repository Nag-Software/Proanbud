'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { NewQuoteDrawer, QuoteDetailsDrawer } from '@/components/tilbud';
import { CustomerDetailsDrawer, NewCustomerDrawer } from '@/components/kunder';
import { getTilbud, updateTilbud } from '@/lib/services/tilbudService';
import { getCustomers } from '@/lib/services/customerService';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Tilbud, TilbudStatus, ColumnDef, Kunde } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {useRouter} from 'next/navigation';

const StatusPill: React.FC<{ status: TilbudStatus }> = ({ status }) => {
  const statusStyles = {
    draft: 'bg-gray-100 text-gray-800',
    vunnet: 'bg-green-100 text-green-800',
    venter: 'bg-yellow-100 text-yellow-800',
    tapt: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    draft: 'Utkast',
    vunnet: 'Vunnet',
    venter: 'Venter',
    tapt: 'Tapt',
  };

  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
};

export default function TilbudPage() {

  const router = useRouter();

  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [isQuoteDetailsOpen, setIsQuoteDetailsOpen] = useState(false);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Tilbud | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Kunde | null>(null);
  const [tilbuds, setTilbuds] = useState<Tilbud[]>([]);
  const [customers, setCustomers] = useState<Kunde[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [updatingQuotes, setUpdatingQuotes] = useState<Set<string>>(new Set());
  const [editingQuote, setEditingQuote] = useState<Tilbud | null>(null);

  function check_if_new_quote_ready() {
    console.log(customers.length)
    if(customers.length > 0) {
      setIsNewQuoteOpen(true);
    } else {
      setAlertDialogOpen(true);
    }
  }

  // Set up real-time listeners for tilbuds and customers
  useEffect(() => {
    let tilbudsUnsubscribe: (() => void) | null = null;
    let customersUnsubscribe: (() => void) | null = null;

    const setupRealtimeListeners = async () => {
      try {
        // Wait for auth to be ready
        if (!auth.currentUser) {
          setError('Bruker ikke autentisert');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        const userId = auth.currentUser.uid;

        // Set up listener for tilbuds
        const tilbudsRef = ref(db, `users/${userId}/tilbud`);
        tilbudsUnsubscribe = onValue(tilbudsRef, (tilbudsSnapshot) => {
          try {
            if (!tilbudsSnapshot.exists()) {
              setTilbuds([]);
              setIsLoading(false);
              return;
            }

            const tilbudData = tilbudsSnapshot.val() as Record<string, any>;
            const firebaseTilbuds: Tilbud[] = Object.entries(tilbudData)
              .sort(([, a], [, b]) => (b.oppdatert || b.opprettet) - (a.oppdatert || a.opprettet))
              .map(([key, data]) => ({
                id: key,
                kundenavn: data.kundenavn,
                prosjekt: data.prosjekt,
                jobbtype: data.jobbtype,
                belop: data.belop,
                status: data.status,
                dato: data.dato,
                svarfrist: data.svarfrist,
                prisgrunnlag: data.prisgrunnlag || [],
                template: data.template
              }));

            setTilbuds(firebaseTilbuds);
            setIsLoading(false);
          } catch (error) {
            console.error('Error processing tilbuds:', error);
            setError('Kunne ikke behandle tilbud');
            setIsLoading(false);
          }
        }, (error) => {
          console.error('Firebase tilbuds listener error:', error);
          setError('Kunne ikke lytte til tilbud');
          setIsLoading(false);
        });

        // Set up listener for customers
        const customersRef = ref(db, `users/${userId}/kunder`);
        customersUnsubscribe = onValue(customersRef, (customersSnapshot) => {
          try {
            if (!customersSnapshot.exists()) {
              setCustomers([]);
              return;
            }

            const customerData = customersSnapshot.val() as Record<string, any>;
            const firebaseCustomers: Kunde[] = Object.entries(customerData)
              .sort(([, a], [, b]) => (b.oppdatert || b.opprettet) - (a.oppdatert || a.opprettet))
              .map(([key, data]) => ({
                id: key,
                navn: data.navn,
                epost: data.epost,
                telefon: data.telefon,
                antallTilbud: data.antallTilbud || 0,
                antallVunnet: data.antallVunnet || 0,
                sistAktivitet: new Date(data.sistAktivitet).toISOString().split('T')[0],
                addresser: data.addresser || [],
                tilbud: []
              }));

            setCustomers(firebaseCustomers);
          } catch (error) {
            console.error('Error processing customers:', error);
          }
        }, (error) => {
          console.error('Firebase customers listener error:', error);
        });

      } catch (error) {
        console.error('Error setting up real-time listeners:', error);
        setError(error instanceof Error ? error.message : 'Kunne ikke sette opp sanntidsoppdatering');
        setIsLoading(false);
      }
    };

    setupRealtimeListeners();

    // Cleanup function
    return () => {
      if (tilbudsUnsubscribe) {
        tilbudsUnsubscribe();
      }
      if (customersUnsubscribe) {
        customersUnsubscribe();
      }
    };
  }, []);

  const handleTilbudCreated = () => {
    // Data will automatically update via real-time listeners
  };

  const handleQuoteClick = (quote: Tilbud) => {
    setSelectedQuote(quote);
    setIsQuoteDetailsOpen(true);
  };

  const handleOpenCustomerDrawer = (customer: Kunde) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
  };

  const handleEditQuote = (quote: Tilbud) => {
    setEditingQuote(quote);
    setIsQuoteDetailsOpen(false);
    setIsNewQuoteOpen(true);
  };

  const handleMarkAsWon = async (quote: Tilbud) => {
    const quoteId = quote.id;
    
    // Optimistic update
    setUpdatingQuotes(prev => new Set(prev).add(quoteId));
    setTilbuds(prev => prev.map(t => 
      t.id === quoteId ? { ...t, status: 'vunnet' as TilbudStatus } : t
    ));

    try {
      await updateTilbud(quoteId, { status: 'vunnet' });
      // Keep the optimistic update since it succeeded
    } catch (error) {
      console.error('Error marking quote as won:', error);
      // Revert optimistic update on failure
      setTilbuds(prev => prev.map(t => 
        t.id === quoteId ? { ...t, status: 'venter' as TilbudStatus } : t
      ));
    } finally {
      setUpdatingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(quoteId);
        return newSet;
      });
    }
  };

  const handleMarkAsLost = async (quote: Tilbud) => {
    const quoteId = quote.id;
    
    // Optimistic update
    setUpdatingQuotes(prev => new Set(prev).add(quoteId));
    setTilbuds(prev => prev.map(t => 
      t.id === quoteId ? { ...t, status: 'tapt' as TilbudStatus } : t
    ));

    try {
      await updateTilbud(quoteId, { status: 'tapt' });
      // Keep the optimistic update since it succeeded
    } catch (error) {
      console.error('Error marking quote as lost:', error);
      // Revert optimistic update on failure
      setTilbuds(prev => prev.map(t => 
        t.id === quoteId ? { ...t, status: 'venter' as TilbudStatus } : t
      ));
    } finally {
      setUpdatingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(quoteId);
        return newSet;
      });
    }
  };

  const handleSendQuote = async (quote: Tilbud) => {
    const quoteId = quote.id;
    
    // Optimistic update
    setUpdatingQuotes(prev => new Set(prev).add(quoteId));
    setTilbuds(prev => prev.map(t => 
      t.id === quoteId ? { ...t, status: 'venter' as TilbudStatus } : t
    ));

    try {
      await updateTilbud(quoteId, { status: 'venter' });
      // Keep the optimistic update since it succeeded
    } catch (error) {
      console.error('Error sending quote:', error);
      // Revert optimistic update on failure
      setTilbuds(prev => prev.map(t => 
        t.id === quoteId ? { ...t, status: 'draft' as TilbudStatus } : t
      ));
    } finally {
      setUpdatingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(quoteId);
        return newSet;
      });
    }
  };

  const columns: ColumnDef<Tilbud>[] = [
    {
      accessorKey: 'kundenavn',
      header: 'Kunde',
    },
    {
      accessorKey: 'prosjekt',
      header: 'Prosjekt',
    },
    {
      accessorKey: 'belop',
      header: 'Beløp',
      cell: ({ row }) => `${(row.original.belop as number).toLocaleString('nb-NO')} kr`,
    },
    {
      accessorKey: 'profit',
      header: 'Profitt',
      cell: ({ row }) => {
        const r = row.original as Tilbud;
        const totalProfit = (r.prisgrunnlag || []).reduce((sum, c) => {
          const amount = c.amount || 0;
          const markupPercent = c.priceMarkup || 0;
          // Calculate base cost: amount / (1 + markup%)
          const baseCost = markupPercent > 0 ? amount / (1 + markupPercent / 100) : amount;
          // Profit = final amount - base cost
          const profit = amount - baseCost;
          return sum + profit;
        }, 0);
        const customerPrice = r.belop || 0;
        const profitMargin = customerPrice > 0 ? (totalProfit / customerPrice) * 100 : 0;

        return (
          <span className={`font-medium ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {totalProfit.toFixed(1).toLocaleString('nb-NO')} kr {customerPrice > 0 && (
              <span className="text-xs text-gray-500">({profitMargin.toFixed(1)}%)</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusPill status={row.original.status as TilbudStatus} />,
    },
    {
      accessorKey: 'dato',
      header: 'Dato',
    },
    {
      accessorKey: 'actions',
      header: 'Handlinger',
      cell: ({ row }) => {
        const isUpdating = updatingQuotes.has(row.original.id);
        const status = row.original.status;
        
        return (
          <div className="flex gap-2">
            {status === 'draft' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendQuote(row.original);
                }}
                disabled={isUpdating}
                className="text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50"
              >
                {isUpdating ? '...' : 'Send'}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsWon(row.original);
                  }}
                  disabled={status === 'vunnet' || isUpdating}
                  className="text-green-600 border-green-300 hover:bg-green-50 disabled:opacity-50"
                >
                  {isUpdating && status !== 'vunnet' ? '...' : 'Vunnet'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsLost(row.original);
                  }}
                  disabled={status === 'tapt' || isUpdating}
                  className="text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50"
                >
                  {isUpdating && status !== 'tapt' ? '...' : 'Tapt'}
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Last siden på nytt for å prøve igjen</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Alle Tilbud">
        <button 
          onClick={() => check_if_new_quote_ready()}
          className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          Nytt Tilbud
        </button>
      </PageHeader>
      
      <DataTable 
        columns={columns} 
        data={tilbuds} 
        enableFiltering 
        searchPlaceholder="Søk tilbud..."
        onRowClick={handleQuoteClick}
      />
      
      <NewQuoteDrawer 
        open={isNewQuoteOpen} 
        onOpenChange={(open) => {
          setIsNewQuoteOpen(open);
          if (!open) {
            setEditingQuote(null);
          }
        }}
        onTilbudCreated={handleTilbudCreated}
        editingQuote={editingQuote}
      />
      
      <QuoteDetailsDrawer
        quote={selectedQuote}
        open={isQuoteDetailsOpen}
        onOpenChange={setIsQuoteDetailsOpen}
        onQuoteUpdated={handleTilbudCreated}
        onOpenCustomerDrawer={handleOpenCustomerDrawer}
        customers={customers}
        onEditQuote={handleEditQuote}
      />
      
      <CustomerDetailsDrawer
        customer={selectedCustomer}
        open={isCustomerDetailsOpen}
        onOpenChange={setIsCustomerDetailsOpen}
      />

      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Du har ingen kunder.</AlertDialogTitle>
            <AlertDialogDescription>
              Du må opprette en kunde før du kan opprette et tilbud.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertDialogOpen(false)}>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() =>  router.push('/kunder')}>Ny Kunde</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}