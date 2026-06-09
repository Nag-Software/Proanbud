'use client';

import { useEffect, useState } from 'react';
import { Upload, Trash2, FileSpreadsheet, Package, Files } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PriceListImportDialog } from '@/components/katalog/PriceListImportDialog';
import { getPriceLists, deletePriceList } from '@/lib/services/catalogService';
import { PriceList } from '@/lib/types';

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat('nb-NO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));

export default function PrisfilPage() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getPriceLists();
      setPriceLists(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalProducts = priceLists.reduce((sum, pl) => sum + (pl.rowCount || 0), 0);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePriceList(id);
      await load();
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const confirmTarget = priceLists.find(pl => pl.id === confirmDeleteId);

  return (
    <div className="w-full min-h-full px-3 lg:px-6 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prisfiler</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Last opp prisfiler som brukes av AI-tilbudsgeneratoren.
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Last opp prisfil
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                  Prisfiler
                </p>
                {loading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{priceLists.length}</p>
                )}
              </div>
              <Files className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                  Produkter totalt
                </p>
                {loading ? (
                  <Skeleton className="h-7 w-14" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {totalProducts.toLocaleString('nb-NO')}
                  </p>
                )}
              </div>
              <Package className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : priceLists.length === 0 ? (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <FileSpreadsheet className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle className="text-base mb-1">Ingen prisfiler lastet opp</CardTitle>
            <CardDescription className="max-w-xs mb-5">
              Last opp CSV- eller Excel-filer med produkter og priser. Disse brukes automatisk i
              AI-tilbudsgeneratoren.
            </CardDescription>
            <Button onClick={() => setImportOpen(true)} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Last opp prisfil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {priceLists.map(pl => (
            <Card key={pl.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="py-0">
                <div className="flex items-center gap-4 py-4">
                  <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{pl.navn}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Lastet opp {formatDate(pl.opprettet)}
                    </p>
                  </div>

                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {pl.rowCount.toLocaleString('nb-NO')} produkter
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmDeleteId(pl.id)}
                    disabled={deletingId === pl.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Import dialog */}
      <PriceListImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={load}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={open => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett prisfil</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette{' '}
              <span className="font-medium text-gray-900">
                &ldquo;{confirmTarget?.navn}&rdquo;
              </span>
              ? Dette fjerner {confirmTarget?.rowCount?.toLocaleString('nb-NO')} produkter
              permanent og kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              disabled={deletingId !== null}
            >
              {deletingId ? 'Sletter…' : 'Slett prisfil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
