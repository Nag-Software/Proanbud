'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Kunde, ColumnDef } from '@/lib/types';
import { getCustomers } from '@/lib/services/customerService';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

const customersColumns: ColumnDef<Kunde>[] = [
  {
    accessorKey: 'navn',
    header: 'Navn',
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
    cell: (info) => info.getValue() as number,
  },
  {
    accessorKey: 'antallVunnet',
    header: 'Vunnet',
    cell: (info) => info.getValue() as number,
  },
  {
    accessorKey: 'sistAktivitet',
    header: 'Sist Aktivitet',
  },
];

export const CustomersDataTable = () => {
  const [customers, setCustomers] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);

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
          <CardTitle className="text-base sm:text-lg">Siste Kunder</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg min-h-[200px] flex items-center justify-center">
            <span className="text-gray-500 text-sm">Laster kunder...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">Siste Kunder</h3>
      </div>
      <div className="flex-1 min-h-0">
        <DataTable
          columns={customersColumns}
          data={customers}
          searchPlaceholder="Søk i kunder..."
          enableFiltering={true}
          responsive={true}
          compactOnMobile={true}
          maxHeight="100%"
        />
      </div>
    </div>
  );
};