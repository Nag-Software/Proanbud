'use client';

import { act, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  X,
} from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { Kunde, Tilbud } from '@/lib/types';
import { updateCustomer, type CustomerFormData } from '@/lib/services/customerService';
import { getTilbud } from '@/lib/services/tilbudService';
import { cn } from '@/lib/utils';

interface CustomerDetailsDrawerProps {
  customer: Kunde | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated?: () => void;
  onOpenQuoteDrawer?: (quote: Tilbud) => void;
}

type EditableField = 'navn' | 'epost' | 'telefon' | 'addresser' | 'notater';
type SavingState = 'idle' | 'saving' | 'saved' | 'error';

interface EditableFormState {
  navn: string;
  epost: string;
  telefon: string;
  addresser: string;
  notater: string;
}

const AUTOSAVE_DELAY = 700;
const editableFields: EditableField[] = ['navn', 'epost', 'telefon', 'addresser', 'notater'];
const statusColors: Record<string, string> = {
  vunnet: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  venter: 'bg-[#fff9c2] text-amber-700 border-amber-100',
  tapt: 'bg-rose-50 text-rose-700 border-rose-100',
  draft: 'bg-slate-50 text-slate-600 border-slate-100',
};
const statusPieColors: Record<string, string> = {
  vunnet: '#21ca5fff', // Green
  venter: '#ffdf0fff', // Yellow
  tapt: '#ef4444',   // Red
  draft: '#94a3b8',  // Gray
};

export function CustomerDetailsDrawer({
  customer,
  open,
  onOpenChange,
  onCustomerUpdated,
  onOpenQuoteDrawer,
}: CustomerDetailsDrawerProps) {
  const formInitialState = useMemo(() => createFormState(customer), [customer]);
  const [formState, setFormState] = useState<EditableFormState>(formInitialState);
  const [fallbackQuotes, setFallbackQuotes] = useState<Tilbud[]>([]);
  const [fieldStatus, setFieldStatus] = useState<Record<EditableField, SavingState>>(createStatusState());
  const [fieldErrors, setFieldErrors] = useState<Record<EditableField, string | null>>(createErrorState());
  const debounceRefs = useRef<Partial<Record<EditableField, ReturnType<typeof setTimeout>>>>({});
  const savedSnapshotRef = useRef<EditableFormState>(formInitialState);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Sync when customer changes
  useEffect(() => {
    setFormState(formInitialState);
    setFallbackQuotes([]);
    savedSnapshotRef.current = formInitialState;
    setFieldStatus(createStatusState());
    setFieldErrors(createErrorState());
    clearAllTimers(debounceRefs.current);
  }, [formInitialState]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers(debounceRefs.current);
    };
  }, []);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // focus close button for a11y when opened
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const quotes = useMemo(() => (customer?.tilbud?.length ? customer.tilbud : fallbackQuotes), [customer, fallbackQuotes]);
  // Derive counts from actual quotes to avoid inconsistencies with stored counters
  const wonCount = useMemo(() => quotes.filter((q) => q.status === 'vunnet').length, [quotes]);
  const totalCount = quotes.length;
  const winRate = useMemo(() => calcWinRateFromCounts(wonCount, totalCount), [wonCount, totalCount]);
  const totalQuoteValue = useMemo(() => calcTotalValue(quotes), [quotes]);
  const averageQuoteValue = useMemo(() => calcAverageValue(quotes), [quotes]);
  const quoteTrendData = useMemo(() => buildTrendData(quotes), [quotes]);
  const statusDistribution = useMemo(() => buildStatusDistribution(quotes), [quotes]);
  const quoteColumns = useMemo<ColumnDef<Tilbud>[]>(() => buildQuoteColumns(), []);

  // Fallback: fetch quotes for this customer if none are attached (e.g. dashboard quick view)
  useEffect(() => {
    if (!customer || !open) return;
    if (customer.tilbud?.length) return;

    let isCancelled = false;

    const loadQuotes = async () => {
      try {
        const allQuotes = await getTilbud();
        const customerQuotes = allQuotes.filter((quote) => quote.kundenavn === customer.navn);
        if (!isCancelled) {
          setFallbackQuotes(customerQuotes);
        }
      } catch (error) {
        console.error('Klarte ikke hente tilbud for kunden', error);
      }
    };

    void loadQuotes();

    return () => {
      isCancelled = true;
    };
  }, [customer, open]);

  const handleFieldChange = (field: EditableField, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));

    if (value === savedSnapshotRef.current[field]) {
      setFieldStatus((prev) => ({ ...prev, [field]: 'idle' }));
      return;
    }

    setFieldStatus((prev) => ({ ...prev, [field]: 'saving' }));
    if (debounceRefs.current[field]) {
      clearTimeout(debounceRefs.current[field]!);
    }
    debounceRefs.current[field] = setTimeout(() => {
      void persistField(field, value);
    }, AUTOSAVE_DELAY);
  };

  const persistField = async (field: EditableField, value: string) => {
    if (!customer) return;
    try {
      const payload = buildPayload(field, value);
      await updateCustomer(customer.id, payload);
      savedSnapshotRef.current = { ...savedSnapshotRef.current, [field]: value };
      setFieldStatus((prev) => ({ ...prev, [field]: 'saved' }));
      onCustomerUpdated?.();
      setTimeout(() => {
        setFieldStatus((prev) => ({ ...prev, [field]: 'idle' }));
      }, 1200);
    } catch (error) {
      console.error('Customer autosave failed', error);
      setFieldStatus((prev) => ({ ...prev, [field]: 'error' }));
      setFieldErrors((prev) => ({ ...prev, [field]: 'Kunne ikke lagre endringen' }));
    }
  };

  const handleQuoteClick = (quote: Tilbud) => {
    onOpenQuoteDrawer?.(quote);
  };

  if (!customer) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[1400] bg-white flex flex-col" role="dialog" aria-modal="true" data-dashboard>
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <button aria-label="Lukk" onClick={() => onOpenChange(false)} className="p-3 -ml-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <X className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Ingen kunde valgt</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Velg en kunde for å vise detaljer</p>
        </div>
      </div>
    );
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1400] bg-white flex flex-col" role="dialog" aria-modal="true" data-dashboard>
      <header className="sticky top-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">{customer.navn}</h2>
          <p className="text-xs text-muted-foreground">
            Sist aktivitet {formatLongDate(customer.sistAktivitet)} · {totalCount} tilbud totalt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button ref={closeButtonRef} aria-label="Lukk" onClick={() => onOpenChange(false)} className="p-3 rounded-md hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6 max-w-[900px] mx-auto pb-6">
          <div className="space-y-6 pb-10">
            <Card>
              <CardHeader className="space-y-3 sm:space-y-4 p-4">
                <CardTitle className="text-lg sm:text-xl">Kontaktinformasjon</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Alle felt autolagres etter hvert tastetrykk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-4">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                  <EditableInput
                    id="customer-name"
                    icon={<User className="h-4 w-4" />}
                    label="Navn"
                    value={formState.navn}
                    state={fieldStatus.navn}
                    error={fieldErrors.navn}
                    onChange={(value) => handleFieldChange('navn', value)}
                  />
                  <EditableInput
                    id="customer-email"
                    icon={<Mail className="h-4 w-4" />}
                    label="E-post"
                    type="email"
                    value={formState.epost}
                    state={fieldStatus.epost}
                    error={fieldErrors.epost}
                    onChange={(value) => handleFieldChange('epost', value)}
                  />
                  <EditableInput
                    id="customer-phone"
                    icon={<Phone className="h-4 w-4" />}
                    label="Telefon"
                    type="tel"
                    value={formState.telefon}
                    state={fieldStatus.telefon}
                    error={fieldErrors.telefon}
                    onChange={(value) => handleFieldChange('telefon', value)}
                  />
                  <EditableTextarea
                    id="customer-addresses"
                    icon={<MapPin className="h-4 w-4" />}
                    label="Adresser"
                    helper="En adresse per linje."
                    value={formState.addresser}
                    state={fieldStatus.addresser}
                    error={fieldErrors.addresser}
                    onChange={(value) => handleFieldChange('addresser', value)}
                  />
                </div>
                <EditableTextarea
                  id="customer-notes"
                  icon={<Sparkles className="h-4 w-4" />}
                  label="Notater"
                  helper="Del intern innsikt, preferanser eller annet som er nyttig."
                  value={formState.notater}
                  state={fieldStatus.notater}
                  error={fieldErrors.notater}
                  rows={4}
                  onChange={(value) => handleFieldChange('notater', value)}
                />
              </CardContent>
            </Card>

            <StatsGrid
              winRate={winRate}
              totalQuotes={totalCount}
              wonQuotes={wonCount}
              totalValue={totalQuoteValue}
              avgValue={averageQuoteValue}
              lastActivity={customer.sistAktivitet}
            />

            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg sm:text-xl">Verdi over tid</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Summen av utsendte og vunnet beløp.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 sm:h-64 p-4">
                  {quoteTrendData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={quoteTrendData} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="quoteValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="wonValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} angle={-45} textAnchor="end" height={60} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          width={40}
                          tickFormatter={(value) => String(formatYAxis(Number(value)))}
                        />
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="verdi" stroke="#2563eb" fill="url(#quoteValue)" strokeWidth={2} />
                        <Area type="monotone" dataKey="vunnet" stroke="#16a34a" fill="url(#wonValue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Ingen historikk enda" />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg sm:text-xl">Statusfordeling</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Fordeling av kundens tilknyttede tilbud.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 p-4">
                  {statusDistribution.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDistribution} dataKey="value" nameKey="label" innerRadius={45} outerRadius={75} paddingAngle={4} label>
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={statusPieColors[entry.status] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value, name) => [`${value} stk`, name as string]} contentStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Ingen tilbud registrert" />
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="space-y-3 sm:space-y-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-xl">Kundens tilbud</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Alle tilknyttede tilbud og status.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="w-fit text-xs">{quotes.length} registrert</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {quotes.length ? (
                  <div className="p-4">
                    <DataTable
                      columns={quoteColumns}
                      data={quotes}
                      searchKey="prosjekt"
                      searchPlaceholder="Søk i prosjekter..."
                      onRowClick={handleQuoteClick}
                    />
                  </div>
                ) : (
                  <EmptyState message="Denne kunden har ingen tilbud ennå" />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const EditableInput = ({
  id,
  label,
  icon,
  type = 'text',
  value,
  state,
  error,
  onChange,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  type?: string;
  value: string;
  state: SavingState;
  error: string | null;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-1 sm:gap-2">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
        <span className="shrink-0 text-muted-foreground">{icon}</span>
        <span className="truncate">{label}</span>
      </Label>
      <div className="shrink-0">
        <AutosaveIndicator state={state} error={error} />
      </div>
    </div>
    <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Oppdater ${label.toLowerCase()}`} className="text-sm" />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const EditableTextarea = ({
  id,
  label,
  icon,
  helper,
  value,
  state,
  error,
  rows = 3,
  onChange,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  helper?: string;
  value: string;
  state: SavingState;
  error: string | null;
  rows?: number;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-1 sm:gap-2">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
          <span className="shrink-0 text-muted-foreground">{icon}</span>
          <span className="truncate">{label}</span>
        </Label>
        {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
      </div>
      <div className="shrink-0">
        <AutosaveIndicator state={state} error={error} />
      </div>
    </div>
    <Textarea id={id} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Skriv ${label.toLowerCase()}`} className="text-sm resize-none" />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const AutosaveIndicator = ({ state, error }: { state: SavingState; error?: string | null }) => {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
        <span className="hidden sm:inline">Lagres...</span>
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap text-xs text-emerald-600">
        <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">Lagret</span>
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap text-xs text-destructive">
        <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">{error || 'Feil'}</span>
      </span>
    );
  }
  return <span className="hidden text-xs text-muted-foreground sm:inline">Autolagring</span>;
};

const StatsGrid = ({
  winRate,
  totalQuotes,
  wonQuotes,
  totalValue,
  avgValue,
  lastActivity,
}: {
  winRate: number;
  totalQuotes: number;
  wonQuotes: number;
  totalValue: number;
  avgValue: number;
  lastActivity: string;
}) => {
  const stats = [
    { label: 'Totale tilbud', value: totalQuotes.toString(), helper: 'Historiske og aktive' },
    { label: 'Vunnet', value: Math.max(0, wonQuotes).toString(), helper: 'Signerte tilbud' },
    { label: 'Treffprosent', value: `${winRate}%`, helper: 'Vunnet / sendt' },
    { label: 'Total verdi', value: formatCurrency(totalValue), helper: 'Utsendte tilbud' },
    { label: 'Snittverdi', value: formatCurrency(avgValue), helper: 'Per tilbud' },
    { label: 'Sist aktivitet', value: formatLongDate(lastActivity), helper: '' },
  ];

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-dashed">
          <CardHeader className="space-y-1 p-4">
            <CardDescription className="line-clamp-2 text-xs">{stat.label}</CardDescription>
            <CardTitle className="truncate text-md sm:text-2xl">{stat.value}</CardTitle>
            {stat.helper && <p className="line-clamp-2 text-xs text-muted-foreground">{stat.helper}</p>}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-[160px] w-full flex-col py-10 items-center justify-center rounded-xl border border-gray-300 border-dashed text-sm text-muted-foreground">
    {message}
  </div>
);

const QuoteStatusBadge = ({ status }: { status: Tilbud['status'] }) => (
  <Badge variant="outline" className={cn('text-xs capitalize', statusColors[status] || 'bg-muted text-muted-foreground')}>
    {formatStatusLabel(status)}
  </Badge>
);

const buildQuoteColumns = (): ColumnDef<Tilbud>[] => [
  {
    accessorKey: 'prosjekt',
    header: 'Prosjekt',
    cell: ({ row }) => (
      <div className="space-y-0.5 sm:space-y-1">
        <p className="font-medium text-xs sm:text-sm line-clamp-1">{row.original.prosjekt}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{row.original.jobbtype}</p>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <QuoteStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'belop',
    header: 'Beløp',
    cell: ({ row }) => <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{formatCurrency(row.original.belop)}</span>,
  },
  {
    accessorKey: 'sendt',
    header: 'Sendt',
    cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">{formatShortDate(row.original.dato)}</span>,
  },
  {
    accessorKey: 'svarfrist',
    header: 'Frist',
    cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatShortDate(row.original.svarfrist)}</span>,
  },
];

const buildPayload = (field: EditableField, value: string): Partial<CustomerFormData> => {
  if (field === 'addresser') {
    return { addresser: parseAddressList(value) };
  }
  if (field === 'notater') {
    return { notater: value };
  }
  return { [field]: value };
};

const buildTrendData = (quotes: Tilbud[]) => {
  if (!quotes.length) return [];
  return [...quotes]
    .filter((quote) => quote.dato)
    .sort((a, b) => new Date(a.dato).getTime() - new Date(b.dato).getTime())
    .map((quote) => ({
      date: formatShortDate(quote.dato),
      verdi: quote.belop,
      vunnet: quote.status === 'vunnet' ? quote.belop : 0,
    }));
};

const buildStatusDistribution = (quotes: Tilbud[]) => {
  if (!quotes.length) return [];
  const counts: Record<string, number> = {};
  quotes.forEach((quote) => {
    counts[quote.status] = (counts[quote.status] || 0) + 1;
  });
  return Object.entries(counts).map(([status, value]) => ({
    label: formatStatusLabel(status),
    value,
    status,
  }));
};

const createFormState = (customer?: Kunde | null): EditableFormState => ({
  navn: customer?.navn ?? '',
  epost: customer?.epost ?? '',
  telefon: customer?.telefon ?? '',
  addresser: (customer?.addresser ?? []).join('\n'),
  notater: customer?.notater ?? '',
});

const createStatusState = (): Record<EditableField, SavingState> =>
  editableFields.reduce((acc, field) => ({ ...acc, [field]: 'idle' }), {} as Record<EditableField, SavingState>);

const createErrorState = (): Record<EditableField, string | null> =>
  editableFields.reduce((acc, field) => ({ ...acc, [field]: null }), {} as Record<EditableField, string | null>);

const parseAddressList = (value: string): string[] =>
  value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const calcWinRate = (customer?: Kunde | null) => {
  if (!customer) return 0;
  const total = Math.max(0, customer.antallTilbud || 0);
  if (total === 0) return 0;
  const won = Math.max(0, customer.antallVunnet || 0);
  return Math.round((won / total) * 100);
};

// Calculate win rate directly from counts (preferred for UI that derives from quotes)
const calcWinRateFromCounts = (won: number, total: number) => {
  const t = Math.max(0, total || 0);
  if (t === 0) return 0;
  const w = Math.max(0, won || 0);
  return Math.round((w / t) * 100);
};

const calcTotalValue = (quotes: Tilbud[]) => quotes.reduce((sum, quote) => sum + (quote.belop || 0), 0);

const calcAverageValue = (quotes: Tilbud[]) => {
  if (!quotes.length) return 0;
  return Math.round(calcTotalValue(quotes) / quotes.length);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: 0 }).format(value || 0);

const formatShortDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('nb-NO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const formatLongDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('nb-NO', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
};

const formatStatusLabel = (status: string) => {
  switch (status) {
    case 'vunnet':
      return 'Vunnet';
    case 'tapt':
      return 'Tapt';
    case 'venter':
      return 'Venter';
    case 'draft':
      return 'Kladd';
    default:
      return status;
  }
};

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value;
};

const clearAllTimers = (timers: Partial<Record<EditableField, ReturnType<typeof setTimeout>>>) => {
  Object.values(timers).forEach((timer) => {
    if (timer) {
      clearTimeout(timer);
    }
  });
};