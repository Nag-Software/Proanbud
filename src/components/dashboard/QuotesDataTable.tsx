'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Tilbud, ColumnDef } from '@/lib/types';
import { getTilbud } from '@/lib/services/tilbudService';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

const quotesColumns: ColumnDef<Tilbud>[] = [
  {
    accessorKey: 'kundenavn',
    header: 'Kunde',
  },
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
    cell: (info) => `${(info.getValue() as number).toLocaleString('nb-NO')} kr`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue() as string;
      const statusColors = {
        venter: 'bg-yellow-100 text-yellow-800',
        vunnet: 'bg-green-100 text-green-800',
        tapt: 'bg-red-100 text-red-800',
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'dato',
    header: 'Dato',
  },
];

export const QuotesDataTable = () => {
  const [quotes, setQuotes] = useState<Tilbud[]>([]);
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
        const tilbudRef = ref(db, `users/${userId}/tilbud`);

        unsubscribe = onValue(tilbudRef, (snapshot) => {
          try {
            if (!snapshot.exists()) {
              setQuotes([]);
              setLoading(false);
              return;
            }

            const tilbudData = snapshot.val() as Record<string, any>;
            const allQuotes: Tilbud[] = Object.entries(tilbudData)
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

            // Take only the first 10 for dashboard display
            setQuotes(allQuotes.slice(0, 10));
            setLoading(false);
          } catch (error) {
            console.error('Error processing quotes:', error);
            setLoading(false);
          }
        }, (error) => {
          console.error('Firebase quotes listener error:', error);
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
          <CardTitle className="text-base sm:text-lg">Siste Tilbud</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg min-h-[200px] flex items-center justify-center">
            <span className="text-gray-500 text-sm">Laster tilbud...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">Siste Tilbud</h3>
      </div>
      <div className="flex-1 min-h-0">
        <DataTable
          columns={quotesColumns}
          data={quotes}
          searchPlaceholder="Søk i tilbud..."
          enableFiltering={true}
          responsive={true}
          compactOnMobile={true}
          maxHeight="100%"
        />
      </div>
    </div>
  );
};