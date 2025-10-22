import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Tilbud, TilbudStatus } from "@/lib/types"
import { useViewportSize } from "@/hooks/useResponsive"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const StatusPill: React.FC<{ status: TilbudStatus }> = ({ status }) => {
  const statusStyles = {
    draft: 'bg-gray-100 text-gray-800',
    vunnet: 'bg-green-100 text-green-800',
    venter: 'bg-yellow-100 text-yellow-800',
    tapt: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    draft: 'Utkast',
    vunnet: 'Vunnet',
    venter: 'Venter',
    tapt: 'Tapt',
  };

  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
};

const ActionsCell: React.FC<{
  quote: Tilbud;
  handleSendQuote: (quote: Tilbud) => void;
  handleMarkAsWon: (quote: Tilbud) => void;
  handleMarkAsLost: (quote: Tilbud) => void;
  updatingQuotes: Set<string>;
}> = ({ quote, handleSendQuote, handleMarkAsWon, handleMarkAsLost, updatingQuotes }) => {
  const { width } = useViewportSize();
  const isUpdating = updatingQuotes.has(quote.id);
  const status = quote.status;

  if (width < 700) {
    // Mobile view: three-dot menu
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Åpne meny</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === 'draft' ? (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleSendQuote(quote);
              }}
              disabled={isUpdating}
            >
              {isUpdating ? 'Sender...' : 'Send'}
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsWon(quote);
                }}
                disabled={status === 'vunnet' || isUpdating}
              >
                {isUpdating && status !== 'vunnet' ? 'Oppdaterer...' : 'Vunnet'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsLost(quote);
                }}
                disabled={status === 'tapt' || isUpdating}
              >
                {isUpdating && status !== 'tapt' ? 'Oppdaterer...' : 'Tapt'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop view: inline buttons
  return (
    <div className="flex gap-2">
      {status === 'draft' ? (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleSendQuote(quote);
          }}
          disabled={isUpdating}
          className="text-blue-600 border-blue-300 py-0 h-7 hover:bg-blue-50 disabled:opacity-50"
        >
          {isUpdating ? '...' : 'Send'}
        </Button>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkAsWon(quote);
            }}
            disabled={status === 'vunnet' || isUpdating}
            className="text-green-600 py-0 h-7 border-green-300 cursor-pointer hover:text-green-600 hover:bg-green-50 disabled:opacity-50"
          >
            {isUpdating && status !== 'vunnet' ? '...' : 'Vunnet'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkAsLost(quote);
            }}
            disabled={status === 'tapt' || isUpdating}
            className="text-red-600 border-red-300 py-0 h-7 cursor-pointer hover:bg-red-50 hover:text-red disabled:opacity-50"
          >
            {isUpdating && status !== 'tapt' ? '...' : 'Tapt'}
          </Button>
        </>
      )}
    </div>
  );
};

export const getQuoteColumns = (
  handleSendQuote: (quote: Tilbud) => void,
  handleMarkAsWon: (quote: Tilbud) => void,
  handleMarkAsLost: (quote: Tilbud) => void,
  updatingQuotes: Set<string>
): ColumnDef<Tilbud>[] => [
  {
    accessorKey: "kundenavn",
    header: "Kunde",
    cell: ({ row }) => (
      <div className="font-medium min-w-[80px]">{row.getValue("kundenavn")}</div>
    ),
  },
  {
    accessorKey: "prosjekt",
    header: "Prosjekt",
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("prosjekt")}</div>
    ),
  },
  {
    accessorKey: "jobbtype",
    header: "Jobbtype",
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("jobbtype")}</div>
    ),
  },
  {
    accessorKey: "belop",
    header: "Beløp",
    cell: ({ row }) => {
      const amount = row.getValue("belop") as number
      return (
        <div className="text-left font-medium">
          {amount.toLocaleString('nb-NO')} kr
        </div>
      )
    },
  },
  {
    accessorKey: "profit",
    header: "Profitt",
    cell: ({ row }) => {
      const quote = row.original
      const totalProfit = (quote.prisgrunnlag || []).reduce((sum, c) => {
        const amount = c.amount || 0;
        const markupPercent = c.priceMarkup || 0;
        // Calculate base cost: amount / (1 + markup%)
        const baseCost = markupPercent > 0 ? amount / (1 + markupPercent / 100) : amount;
        // Profit = final amount - base cost
        const profit = amount - baseCost;
        return sum + profit;
      }, 0);
      const customerPrice = quote.belop || 0;
      const profitMargin = customerPrice > 0 ? (totalProfit / customerPrice) * 100 : 0;

      return (
        <div className={`font-medium ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {totalProfit.toFixed(1)} kr {customerPrice > 0 && (
            <span className="text-xs text-gray-500">({profitMargin.toFixed(1)}%)</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusPill status={row.original.status as TilbudStatus} />,
  },
  {
    accessorKey: "dato",
    header: "Dato",
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("dato")}</div>
    ),
  },
  {
    id: "actions",
    header: "Handlinger",
    cell: ({ row }) => (
      <ActionsCell
        quote={row.original}
        handleSendQuote={handleSendQuote}
        handleMarkAsWon={handleMarkAsWon}
        handleMarkAsLost={handleMarkAsLost}
        updatingQuotes={updatingQuotes}
      />
    ),
  },
]