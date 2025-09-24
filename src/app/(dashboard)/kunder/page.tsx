"use client"

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { NewCustomerDrawer, CustomerDetailsDrawer } from '@/components/kunder';
import { QuoteDetailsDrawer } from '@/components/tilbud';
import { kundeData, tilbudData } from '@/lib/data';
import { getCustomers } from '@/lib/services/customerService';
import { getTilbud } from '@/lib/services/tilbudService';
import { Kunde, ColumnDef, Tilbud } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'navn',
    header: 'Kunde',
  },
  {
    accessorKey: 'epost',
    header: 'E-post',
  },
  {
    accessorKey: 'telefon',
    header: 'Telefon',
  },
  {
    accessorKey: 'antallTilbud',
    header: 'Antall Tilbud',
  },
  {
    accessorKey: 'antallVunnet',
    header: 'Vunnet',
  },
  {
    accessorKey: 'sistAktivitet',
    header: 'Sist Aktivitet',
  },
];

export default function KunderPage() {
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [isQuoteDetailsOpen, setIsQuoteDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Kunde | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Tilbud | null>(null);
  const [customers, setCustomers] = useState<Kunde[]>([]); // Fallback to static data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customers from Firebase
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      // Load both customers and quotes
      const [firebaseCustomers, firebaseQuotes] = await Promise.all([
        getCustomers(),
        getTilbud()
      ]);
      
      // Connect quotes to customers
      const customersWithQuotes = firebaseCustomers.map(customer => ({
        ...customer,
        tilbud: firebaseQuotes.filter(quote => quote.kundenavn === customer.navn)
      }));
      
      setCustomers(customersWithQuotes);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      
      // Show specific error message
      const errorMessage = err.message || 'Kunne ikke koble til database';
      setError(`${errorMessage} - Viser eksempeldata i stedet.`);
      
      // Keep static data as fallback - connect static quotes to static customers
      const staticCustomersWithQuotes = kundeData.map(customer => ({
        ...customer,
        tilbud: tilbudData.filter(quote => quote.kundenavn === customer.navn)
      }));
      
      setCustomers(staticCustomersWithQuotes);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerCreated = () => {
    // Reload customers after creation
    loadCustomers();
  };

  const handleCustomerClick = (customer: Kunde) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
  };

  const handleQuoteClick = (quote: Tilbud) => {
    setSelectedQuote(quote);
    setIsQuoteDetailsOpen(true);
  };

  return (
    <div>
      <PageHeader title="Alle Kunder">
        <div className="flex gap-2">
          <button 
            onClick={() => setIsNewCustomerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            Ny kunde
          </button>
        </div>
      </PageHeader>
      
      <DataTable 
        columns={columns} 
        data={customers} 
        enableFiltering 
        searchPlaceholder="Søk kunder..."
        onRowClick={handleCustomerClick}
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
        onCustomerUpdated={loadCustomers}
        onOpenQuoteDrawer={handleQuoteClick}
      />
      
      <QuoteDetailsDrawer
        quote={selectedQuote}
        open={isQuoteDetailsOpen}
        onOpenChange={setIsQuoteDetailsOpen}
        customers={customers}
      />
    </div>
  );
}