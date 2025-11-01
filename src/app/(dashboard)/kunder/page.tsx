"use client"

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { NewCustomerDrawer, CustomerDetailsDrawer } from '@/components/kunder';
import { getCustomers, deleteCustomer } from '@/lib/services/customerService';
import { getTilbud } from '@/lib/services/tilbudService';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Kunde, Tilbud } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { AccessRestrictedBanner } from '@/components/subscription/AccessRestrictedBanner';
import { getCustomerColumns } from '@/lib/table-columns/customers-columns';
import { useRouter } from 'next/navigation';

export default function KunderPage() {
  const router = useRouter();
  const { checkCustomerLimit, showUpgradeDialog, loading: limitsLoading } = useSubscriptionLimits();
  const { hasAccess, hasTrialAccess, isLimited } = useSubscriptionAccess();
  const { refreshUsage } = useSubscription();
  
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Kunde | null>(null);
  const [customers, setCustomers] = useState<Kunde[]>([]); // Fallback to static data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up real-time listeners for customers and quotes
  useEffect(() => {
    let customersUnsubscribe: (() => void) | null = null;
    let quotesUnsubscribe: (() => void) | null = null;

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

        // Set up listener for customers
        const customersRef = ref(db, `users/${userId}/kunder`);
        customersUnsubscribe = onValue(customersRef, (customersSnapshot) => {
          try {
            let firebaseCustomers: Kunde[] = [];
            if (customersSnapshot.exists()) {
              const customerData = customersSnapshot.val() as Record<string, any>;
              firebaseCustomers = Object.entries(customerData)
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
                  tilbud: [] // Will be populated when quotes are loaded
                }));
            }

            // Update customers state (quotes will be added when quotes listener fires)
            setCustomers(prevCustomers => {
              // Merge with existing quotes data if available
              return firebaseCustomers.map(customer => ({
                ...customer,
                tilbud: prevCustomers.find(c => c.id === customer.id)?.tilbud || []
              }));
            });

            setIsLoading(false);
          } catch (error) {
            console.error('Error processing customers:', error);
            setError('Kunne ikke behandle kunder');
            setIsLoading(false);
          }
        }, (error) => {
          console.error('Firebase customers listener error:', error);
          setError('Kunne ikke lytte til kunder');
          setIsLoading(false);
        });

        // Set up listener for quotes
        const quotesRef = ref(db, `users/${userId}/tilbud`);
        quotesUnsubscribe = onValue(quotesRef, (quotesSnapshot) => {
          try {
            let firebaseQuotes: Tilbud[] = [];
            if (quotesSnapshot.exists()) {
              const quoteData = quotesSnapshot.val() as Record<string, any>;
              firebaseQuotes = Object.entries(quoteData)
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
            }

            // Update customers with quotes
            setCustomers(prevCustomers => {
              return prevCustomers.map(customer => ({
                ...customer,
                tilbud: firebaseQuotes.filter(quote => quote.kundenavn === customer.navn)
              }));
            });
          } catch (error) {
            console.error('Error processing quotes:', error);
          }
        }, (error) => {
          console.error('Firebase quotes listener error:', error);
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
      if (customersUnsubscribe) {
        customersUnsubscribe();
      }
      if (quotesUnsubscribe) {
        quotesUnsubscribe();
      }
    };
  }, []);

  const handleCustomerCreated = async () => {
    // Data will automatically update via real-time listeners
    // Refresh usage data to update subscription limits
    await refreshUsage();
  };

  const handleCustomerClick = (customer: Kunde) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
  };

  const handleQuoteClick = (quote: Tilbud) => {
    router.push(`/tilbud/${quote.id}`);
  };

  const handleNewCustomer = () => {
    // Check if user has access first (but allow trial users)
    if (!hasTrialAccess) {
      alert('Du har ikke lenger tilgang til å opprette nye kunder. Oppgrader abonnementet for å fortsette.');
      return;
    }

    // Check subscription limits
    const limitCheck = checkCustomerLimit();
    if (!limitCheck.canProceed) {
      if (limitCheck.upgradeRequired) {
        showUpgradeDialog(limitCheck.message!);
      } else {
        alert(limitCheck.message);
      }
      return;
    }
    
    setIsNewCustomerOpen(true);
  };

  const handleEditCustomer = (customer: Kunde) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
  };

  const handleDeleteCustomer = async (customer: Kunde) => {
    if (confirm(`Er du sikker på at du vil slette kunden "${customer.navn}"?`)) {
      try {
        await deleteCustomer(customer.id);
        // The real-time listener will automatically update the UI
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Kunne ikke slette kunden. Prøv igjen.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Laster kunder...</p>
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
      <PageHeader title="Alle Kunder" />

      <AccessRestrictedBanner 
        title="Begrenset tilgang til kundefunksjon"
        message="Du kan se eksisterende kunder, men kan ikke opprette nye uten aktiv abonnement."
      />
      
      <DataTable
        columns={getCustomerColumns(handleEditCustomer, handleDeleteCustomer)}
        data={customers}
        searchKey="navn"
        searchPlaceholder="Søk kunder..."
        onRowClick={handleCustomerClick}
        rightContent={
          <button   
            onClick={handleNewCustomer}
            disabled={(isLimited && !hasTrialAccess) || !checkCustomerLimit().canProceed || limitsLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              (isLimited && !hasTrialAccess) || !checkCustomerLimit().canProceed || limitsLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <PlusCircle className="h-5 w-5" />
            Ny kunde
          </button>
        }
      />
      
      <NewCustomerDrawer 
        open={isNewCustomerOpen} 
        onOpenChange={setIsNewCustomerOpen}
        onCustomerCreated={handleCustomerCreated}
      />
      
      <CustomerDetailsDrawer
        customer={selectedCustomer}
        open={isCustomerDetailsOpen}
        onOpenChange={setIsCustomerDetailsOpen}
        onOpenQuoteDrawer={handleQuoteClick}
      />
    </div>
  );
}