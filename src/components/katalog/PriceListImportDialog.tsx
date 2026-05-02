'use client';

import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Upload, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { importPriceListProducts } from '@/lib/services/catalogService';
import { PriceListColumnMapping, PriceListColumnRole, PriceListImportRow } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PriceListImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => Promise<void> | void;
}

const COLUMN_ROLES: { value: PriceListColumnRole; label: string }[] = [
  { value: 'ignore', label: 'Ignorer' },
  { value: 'produkt', label: 'Produkt' },
  { value: 'varekategori', label: 'Varekategori' },
  { value: 'veilPris', label: 'Veil.pris' },
  { value: 'rabatt', label: 'Rabatt' },
  { value: 'minPris', label: 'Min pris' },
  { value: 'ean', label: 'EAN' },
  { value: 'nobb', label: 'NOBB' },
  { value: 'produsent', label: 'Produsent' },
  { value: 'enhet', label: 'Enhet' },
  { value: 'beskrivelse', label: 'Beskrivelse' },
];

const inferRole = (header: string): PriceListColumnRole => {
  const normalized = header.toLowerCase().replace(/[\s._-]/g, '');
  if (['produkt', 'produktnavn', 'varenavn', 'navn', 'vare'].includes(normalized)) return 'produkt';
  if (['varekategori', 'kategori', 'gruppe', 'produktkategori'].includes(normalized)) return 'varekategori';
  if (['veilpris', 'veiledendepris', 'listepris', 'pris'].includes(normalized)) return 'veilPris';
  if (['rabatt', 'rabattprosent', 'discount'].includes(normalized)) return 'rabatt';
  if (['minpris', 'nettopris', 'innpris', 'kostpris'].includes(normalized)) return 'minPris';
  if (['ean', 'gtin'].includes(normalized)) return 'ean';
  if (['nobb', 'nobbnummer', 'nobbnr'].includes(normalized)) return 'nobb';
  if (['produsent', 'leverandor', 'leverandør', 'merke'].includes(normalized)) return 'produsent';
  if (['enhet', 'unit', 'mengdeenhet'].includes(normalized)) return 'enhet';
  if (['beskrivelse', 'description', 'tekst'].includes(normalized)) return 'beskrivelse';
  return 'ignore';
};

const parseCsvLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const detectDelimiter = (text: string) => {
  const firstLine = text.split(/\r?\n/).find(line => line.trim()) || '';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  if (tabCount > semicolonCount && tabCount > commaCount) return '\t';
  return semicolonCount >= commaCount ? ';' : ',';
};

const parseCsv = (text: string): { columns: PriceListColumnMapping[]; rows: PriceListImportRow[] } => {
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const headers = parseCsvLine(lines[0] || '', delimiter);
  const columns = headers.map((header, index) => ({
    index,
    originalName: header || `Kolonne ${index + 1}`,
    displayName: header || `Kolonne ${index + 1}`,
    role: inferRole(header),
  }));
  const rows = lines.slice(1).map(line => ({ values: parseCsvLine(line, delimiter) }));

  return { columns, rows };
};

export const PriceListImportDialog: React.FC<PriceListImportDialogProps> = ({ open, onOpenChange, onImported }) => {
  const [priceListName, setPriceListName] = useState('');
  const [columns, setColumns] = useState<PriceListColumnMapping[]>([]);
  const [rows, setRows] = useState<PriceListImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const sampleRows = rows.slice(0, 2);
  const mappedProductColumn = columns.some(column => column.role === 'produkt');
  const mappedPriceColumn = columns.some(column => ['minPris', 'veilPris'].includes(column.role));

  const roleCounts = useMemo(() => {
    return columns.reduce<Record<string, number>>((acc, column) => {
      acc[column.role] = (acc[column.role] || 0) + 1;
      return acc;
    }, {});
  }, [columns]);

  const resetState = () => {
    setPriceListName('');
    setColumns([]);
    setRows([]);
    setFileName('');
    setError('');
    setIsImporting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) resetState();
  };

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    setError('');
    setFileName(file.name);
    setPriceListName(file.name.replace(/\.csv$/i, ''));

    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.columns.length === 0 || parsed.rows.length === 0) {
        throw new Error('CSV-filen mangler kolonner eller rader.');
      }
      setColumns(parsed.columns);
      setRows(parsed.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lese CSV-filen.');
    }
  };

  const updateColumn = (index: number, updates: Partial<PriceListColumnMapping>) => {
    setColumns(prev => prev.map(column => (column.index === index ? { ...column, ...updates } : column)));
  };

  const handleImport = async () => {
    if (!mappedProductColumn) {
      setError('Velg hvilken kolonne som er Produkt.');
      return;
    }
    if (!mappedPriceColumn) {
      setError('Velg minst en priskolonne: Veil.pris eller Min pris.');
      return;
    }

    setIsImporting(true);
    setError('');
    try {
      await importPriceListProducts(priceListName, columns, rows);
      await onImported();
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import feilet.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden z-[700]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Legg til CSV-prisliste
          </DialogTitle>
          <DialogDescription>
            Last inn en materialprisliste, navngi kolonnene og velg hva hver kolonne betyr før import.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-1 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-900">Velg CSV-fil</span>
              <span className="text-xs text-gray-500 mt-1">Semikolon, komma og tab støttes</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files?.[0])}
              />
            </label>

            <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
              <div>
                <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Prislistenavn</label>
                <Input
                  value={priceListName}
                  onChange={(event) => setPriceListName(event.target.value)}
                  placeholder="Materialer 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-white border p-3">
                  <div className="text-gray-500 text-xs">Rader</div>
                  <div className="font-semibold">{rows.length}</div>
                </div>
                <div className="rounded-md bg-white border p-3">
                  <div className="text-gray-500 text-xs">Kolonner</div>
                  <div className="font-semibold">{columns.length}</div>
                </div>
              </div>
              {fileName && <div className="text-xs text-gray-500 truncate">{fileName}</div>}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {columns.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {COLUMN_ROLES.filter(role => role.value !== 'ignore').map(role => (
                  <span
                    key={role.value}
                    className={cn(
                      'rounded-full border px-2.5 py-1',
                      roleCounts[role.value] ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white text-gray-500 border-gray-200'
                    )}
                  >
                    {role.label}: {roleCounts[role.value] || 0}
                  </span>
                ))}
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-[minmax(180px,1.2fr)_180px_minmax(220px,1fr)_minmax(220px,1fr)] bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                  <div className="p-3">Navn/kategori</div>
                  <div className="p-3">Kolonnetype</div>
                  <div className="p-3">Rad 1</div>
                  <div className="p-3">Rad 2</div>
                </div>
                <div className="max-h-[360px] overflow-auto divide-y">
                  {columns.map(column => (
                    <div key={column.index} className="grid grid-cols-[minmax(180px,1.2fr)_180px_minmax(220px,1fr)_minmax(220px,1fr)] items-center bg-white">
                      <div className="p-3 space-y-1">
                        <Input
                          value={column.displayName}
                          onChange={(event) => updateColumn(column.index, { displayName: event.target.value })}
                          className="h-9"
                        />
                        <div className="text-xs text-gray-400 truncate">Original: {column.originalName}</div>
                      </div>
                      <div className="p-3">
                        <Select
                          value={column.role}
                          onValueChange={(value) => updateColumn(column.index, { role: value as PriceListColumnRole })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[900]">
                            {COLUMN_ROLES.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="p-3 text-sm text-gray-700 truncate" title={sampleRows[0]?.values[column.index] || ''}>
                        {sampleRows[0]?.values[column.index] || '-'}
                      </div>
                      <div className="p-3 text-sm text-gray-700 truncate" title={sampleRows[1]?.values[column.index] || ''}>
                        {sampleRows[1]?.values[column.index] || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
            Avbryt
          </Button>
          <Button onClick={handleImport} disabled={isImporting || columns.length === 0} className="gap-2">
            <Check className="h-4 w-4" />
            {isImporting ? 'Importerer...' : 'Importer prisliste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};