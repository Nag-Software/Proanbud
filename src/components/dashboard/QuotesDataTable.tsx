'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Tilbud } from '@/lib/types';
import { getTilbud } from '@/lib/services/tilbudService';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { getQuoteColumns } from '@/lib/table-columns/quotes-columns';
import { DataTable } from '@/components/ui/data-table'

export const QuotesDataTable = ({
  handleSendQuote,
  handleMarkAsWon,
  handleMarkAsLost,
  updatingQuotes,
  onRowClick,
  onHeightChange
}: {
  handleSendQuote: (quote: Tilbud) => void;
  handleMarkAsWon: (quote: Tilbud) => void;
  handleMarkAsLost: (quote: Tilbud) => void;
  updatingQuotes: Set<string>;
  onRowClick?: (quote: Tilbud) => void;
  onHeightChange?: (height: number) => void;
}) => {
  const [quotes, setQuotes] = useState<Tilbud[]>([]);
  const [loading, setLoading] = useState(true);

  const quotesColumns = getQuoteColumns(handleSendQuote, handleMarkAsWon, handleMarkAsLost, updatingQuotes);

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
        <CardTitle className="text-base m-auto md:text-md text-left">Dine Tilbud</CardTitle>
      </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex items-center justify-center">
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg min-h-0 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Laster tilbud...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-base m-auto md:text-md text-left">Dine Tilbud</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <DataTable
          columns={quotesColumns}
          data={quotes}
          searchKey="kundenavn"
          searchPlaceholder="Søk i tilbud..."
          onRowClick={onRowClick}
          onHeightChange={handleDataTableHeightChange}
        />
      </CardContent>
    </Card>
  )
};