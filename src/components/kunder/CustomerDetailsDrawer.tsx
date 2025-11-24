'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
const pieColors = ['#22c55e', '#fbee77ff', '#f97316', '#a855f7', '#e11d48'];

export function CustomerDetailsDrawer({
  customer,
  open,
  onOpenChange,
  onCustomerUpdated,
  onOpenQuoteDrawer,
}: CustomerDetailsDrawerProps) {
  const formInitialState = useMemo(() => createFormState(customer), [customer]);
  const [formState, setFormState] = useState<EditableFormState>(formInitialState);
  const [fieldStatus, setFieldStatus] = useState<Record<EditableField, SavingState>>(createStatusState());
  const [fieldErrors, setFieldErrors] = useState<Record<EditableField, string | null>>(createErrorState());
  const debounceRefs = useRef<Partial<Record<EditableField, ReturnType<typeof setTimeout>>>>({});
  const savedSnapshotRef = useRef<EditableFormState>(formInitialState);

  // Sync when customer changes
  useEffect(() => {
    setFormState(formInitialState);
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

  const quotes = useMemo(() => customer?.tilbud ?? [], [customer]);
  const winRate = useMemo(() => calcWinRate(customer), [customer]);
  const totalQuoteValue = useMemo(() => calcTotalValue(quotes), [quotes]);
  const averageQuoteValue = useMemo(() => calcAverageValue(quotes), [quotes]);
  const quoteTrendData = useMemo(() => buildTrendData(quotes), [quotes]);
  const statusDistribution = useMemo(() => buildStatusDistribution(quotes), [quotes]);
  const quoteColumns = useMemo<ColumnDef<Tilbud>[]>(() => buildQuoteColumns(), []);

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
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="z-[120] w-full max-w-3xl" data-dashboard>
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Velg en kunde for å vise detaljer
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="z-[120] w-full max-w-4xl p-0" data-dashboard>
        <SheetHeader className="border-b bg-muted/30 px-6 py-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <SheetTitle className="text-2xl font-semibold">{customer.navn}</SheetTitle>
              <SheetDescription>
                Sist aktivitet {formatLongDate(customer.sistAktivitet)} · {customer.antallTilbud} tilbud totalt
              </SheetDescription>
            </div>
            <Badge variant="outline" className="text-xs uppercase tracking-wide">
              {customer.id}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-6rem)] px-6 py-6">
          <div className="space-y-6 pb-10">
            <Card>
              <CardHeader>
                <CardTitle>Kontaktinformasjon</CardTitle>
                <CardDescription>Alle felt autolagres etter hvert tastetrykk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
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
              totalQuotes={customer.antallTilbud}
              wonQuotes={customer.antallVunnet}
              totalValue={totalQuoteValue}
              avgValue={averageQuoteValue}
              lastActivity={customer.sistAktivitet}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Verdi over tid</CardTitle>
                  <CardDescription>Summen av utsendte og vunnet beløp.</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {quoteTrendData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={quoteTrendData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
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
                        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => formatYAxis(value)} />
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
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
                <CardHeader>
                  <CardTitle>Statusfordeling</CardTitle>
                  <CardDescription>Fordeling av kundens tilknyttede tilbud.</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {statusDistribution.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDistribution} dataKey="value" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={4}>
                          {statusDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value, name) => [`${value} stk`, name as string]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Ingen tilbud registrert" />
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Kundens tilbud</CardTitle>
                    <CardDescription>Alle tilknyttede tilbud og status.</CardDescription>
                  </div>
                  <Badge variant="secondary">{quotes.length} registrert</Badge>
                </div>
              </CardHeader>
              <CardContent className="-mx-2">
                {quotes.length ? (
                  <DataTable
                    columns={quoteColumns}
                    data={quotes}
                    searchKey="prosjekt"
                    searchPlaceholder="Søk i prosjekter eller jobbtype..."
                    onRowClick={handleQuoteClick}
                  />
                ) : (
                  <EmptyState message="Denne kunden har ingen tilbud ennå" />
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
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
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </Label>
      <AutosaveIndicator state={state} error={error} />
    </div>
    <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Oppdater ${label.toLowerCase()}`} />
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
    <div className="flex items-center justify-between gap-2">
      <div>
        <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </Label>
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </div>
      <AutosaveIndicator state={state} error={error} />
    </div>
    <Textarea id={id} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Skriv ${label.toLowerCase()}`} />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const AutosaveIndicator = ({ state, error }: { state: SavingState; error?: string | null }) => {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Lagres...
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Lagret
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3.5 w-3.5" />
        {error || 'Feil'}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">Autolagring</span>;
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
    { label: 'Vunnet', value: wonQuotes.toString(), helper: 'Signerte tilbud' },
    { label: 'Treffprosent', value: `${winRate}%`, helper: 'Vunnet / sendt' },
    { label: 'Total verdi', value: formatCurrency(totalValue), helper: 'Utsendte tilbud' },
    { label: 'Snittverdi', value: formatCurrency(avgValue), helper: 'Per tilbud' },
    { label: 'Sist aktivitet', value: formatLongDate(lastActivity), helper: '' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-dashed">
          <CardHeader className="space-y-1">
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl">{stat.value}</CardTitle>
            {stat.helper && <p className="text-xs text-muted-foreground">{stat.helper}</p>}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
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
      <div className="space-y-1">
        <p className="font-medium text-sm">{row.original.prosjekt}</p>
        <p className="text-xs text-muted-foreground">{row.original.jobbtype}</p>
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
    cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.belop)}</span>,
  },
  {
    accessorKey: 'dato',
    header: 'Sendt',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatShortDate(row.original.dato)}</span>,
  },
  {
    accessorKey: 'svarfrist',
    header: 'Svarfrist',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatShortDate(row.original.svarfrist)}</span>,
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
  if (!customer || !customer.antallTilbud) return 0;
  return Math.round((customer.antallVunnet / customer.antallTilbud) * 100);
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