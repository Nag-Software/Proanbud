'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { NewQuoteDrawer, QuoteDetailsDrawer } from '@/components/tilbud';
import { CustomerDetailsDrawer, NewCustomerDrawer } from '@/components/kunder';
import { tilbudData } from '@/lib/data';
import { getTilbud } from '@/lib/services/tilbudService';
import { getCustomers } from '@/lib/services/customerService';
import { Tilbud, TilbudStatus, ColumnDef, Kunde } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import {useRouter} from 'next/navigation';

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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusPill status={row.original.status as TilbudStatus} />,
  },
  {
    accessorKey: 'dato',
    header: 'Dato',
  },
];

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

  function check_if_new_quote_ready() {
    console.log(customers.length)
    if(customers.length > 0) {
      setIsNewQuoteOpen(true);
    } else {
      setAlertDialogOpen(true);
    }
  }

  // Load tilbuds and customers from Firebase
  useEffect(() => {
    loadTilbuds();
    loadCustomers();
  }, []);

  const loadTilbuds = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const firebaseTilbuds = await getTilbud();
      
      setTilbuds(firebaseTilbuds);
    } catch (err: any) {
      console.error('Error loading tilbuds:', err);
      
      // Show specific error message
      const errorMessage = err.message || 'Kunne ikke koble til database';
      setError(`${errorMessage} - Viser eksempeldata i stedet.`);
      
      // Keep static data as fallback
      setTilbuds(tilbudData);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const customerList = await getCustomers();
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleTilbudCreated = () => {
    // Reload tilbuds after creation
    loadTilbuds();
  };

  const handleQuoteClick = (quote: Tilbud) => {
    setSelectedQuote(quote);
    setIsQuoteDetailsOpen(true);
  };

  const handleOpenCustomerDrawer = (customer: Kunde) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
  };

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
        onOpenChange={setIsNewQuoteOpen}
        onTilbudCreated={handleTilbudCreated}
      />
      
      <QuoteDetailsDrawer
        quote={selectedQuote}
        open={isQuoteDetailsOpen}
        onOpenChange={setIsQuoteDetailsOpen}
        onQuoteUpdated={handleTilbudCreated}
        onOpenCustomerDrawer={handleOpenCustomerDrawer}
        customers={customers}
      />
      
      <CustomerDetailsDrawer
        customer={selectedCustomer}
        open={isCustomerDetailsOpen}
        onOpenChange={setIsCustomerDetailsOpen}
        onCustomerUpdated={loadCustomers}
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