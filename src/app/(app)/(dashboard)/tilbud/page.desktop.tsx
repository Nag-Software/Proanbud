'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { NewQuoteDrawer } from '@/components/tilbud';
import { CustomerDetailsDrawer, NewCustomerDrawer } from '@/components/kunder';
import { getTilbud, updateTilbud } from '@/lib/services/tilbudService';
import { getCustomers } from '@/lib/services/customerService';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Tilbud, TilbudStatus, Kunde } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { AccessRestrictedBanner } from '@/components/subscription/AccessRestrictedBanner';
import { getQuoteColumns } from '@/lib/table-columns/quotes-columns';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

export default function TilbudPage() {

  const router = useRouter();
  const isMobile = useIsMobile();
  const { checkQuoteLimit, showUpgradeDialog, loading: limitsLoading } = useSubscriptionLimits();
  const { hasAccess, hasTrialAccess, isLimited } = useSubscriptionAccess();
  const { subscription, refreshUsage } = useSubscription();

  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Kunde | null>(null);
  const [tilbuds, setTilbuds] = useState<Tilbud[]>([]);
  const [customers, setCustomers] = useState<Kunde[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [updatingQuotes, setUpdatingQuotes] = useState<Set<string>>(new Set());
  const [editingQuote, setEditingQuote] = useState<Tilbud | null>(null);

  function check_if_new_quote_ready() {
    // Check if user has access first (but allow trial users)
    if (!hasTrialAccess) {
      alert('Du har ikke lenger tilgang til å opprette nye tilbud. Oppgrader abonnementet for å fortsette.');
      return;
    }

    // Check subscription limits
    const limitCheck = checkQuoteLimit();
    if (!limitCheck.canProceed) {
      if (limitCheck.upgradeRequired) {
        showUpgradeDialog(limitCheck.message!);
      } else {
        alert(limitCheck.message);
      }
      return;
    }

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

  const handleTilbudCreated = async () => {
    // Data will automatically update via real-time listeners
    // Refresh usage data to update subscription limits
    await refreshUsage();
  };

  const handleQuoteClick = (quote: Tilbud) => {
    router.push(`/tilbud/${quote.id}`);
  };

  const handleOpenCustomerDrawer = (customer: Kunde) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
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
    <div className="w-full min-h-full px-3 lg:px-6 pt-4 pb-3 lg:pb-6">
      <PageHeader title="Alle Tilbud" />

      <AccessRestrictedBanner 
        title="Begrenset tilgang til tilbudsfunksjon"
        message="Du kan se eksisterende tilbud, men kan ikke opprette nye uten aktiv abonnement."
      />
      
      <DataTable 
        columns={getQuoteColumns(handleSendQuote, handleMarkAsWon, handleMarkAsLost, updatingQuotes)} 
        data={tilbuds} 
        searchKey="kundenavn"
        searchPlaceholder="Søk tilbud..."
        onRowClick={handleQuoteClick}
        rightContent={
          <button 
            onClick={() => check_if_new_quote_ready()}
            disabled={(isLimited && !hasTrialAccess) || !checkQuoteLimit().canProceed || limitsLoading}
            className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg transition-colors ${
              (isLimited && !hasTrialAccess) || !checkQuoteLimit().canProceed || limitsLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <PlusCircle className="h-5 w-5" />
            Nytt Tilbud
          </button>
        }
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