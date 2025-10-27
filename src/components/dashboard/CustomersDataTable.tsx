'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Kunde } from '@/lib/types';
import { getCustomers } from '@/lib/services/customerService';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { getCustomerColumns } from '@/lib/table-columns/customers-columns';

export const CustomersDataTable = ({
  onEditCustomer,
  onDeleteCustomer,
  onRowClick,
  onHeightChange
}: {
  onEditCustomer?: (customer: Kunde) => void;
  onDeleteCustomer?: (customer: Kunde) => void;
  onRowClick?: (customer: Kunde) => void;
  onHeightChange?: (height: number) => void;
}) => {
  const [customers, setCustomers] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle height changes from DataTable
  const handleDataTableHeightChange = (height: number) => {
    if (onHeightChange) {
      // Add header height only - padding is handled by dashboard
      const headerHeight = 56; // CardHeader height
      const totalHeight = height + headerHeight;
      onHeightChange(totalHeight);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupRealtimeListener = async () => {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        setLoading(true);
        const userId = auth.currentUser.uid;
        const customersRef = ref(db, `users/${userId}/kunder`);

        unsubscribe = onValue(customersRef, (snapshot) => {
          try {
            if (!snapshot.exists()) {
              setCustomers([]);
              setLoading(false);
              return;
            }

            const customerData = snapshot.val() as Record<string, any>;
            const allCustomers: Kunde[] = Object.entries(customerData)
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

            // Take only the first 10 for dashboard display
            setCustomers(allCustomers.slice(0, 10));
            setLoading(false);
          } catch (error) {
            console.error('Error processing customers:', error);
            setLoading(false);
          }
        }, (error) => {
          console.error('Firebase customers listener error:', error);
          setLoading(false);
        });

      } catch (error) {
        console.error('Error setting up real-time listener:', error);
        setLoading(false);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
        <CardTitle className="text-base m-auto md:text-md text-left">Dine Kunder</CardTitle>
      </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex items-center justify-center">
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg min-h-[200px] flex items-center justify-center">
            <span className="text-gray-500 text-sm">Laster kunder...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-base m-auto md:text-md text-left">Dine Kunder</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <DataTable
          columns={getCustomerColumns(onEditCustomer, onDeleteCustomer)}
          data={customers}
          searchKey="navn"
          searchPlaceholder="Søk i kunder..."
          onRowClick={onRowClick}
          onHeightChange={handleDataTableHeightChange}
        />
      </CardContent>
    </Card>
  );
};