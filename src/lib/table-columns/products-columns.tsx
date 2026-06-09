import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { Product } from "@/lib/types"
import { isVaregruppeCode, resolveEfoVaregruppeName } from "@/lib/efo-varegrupper"

const getReadableVaregruppe = (product: Product) => {
  const rawValue = product.varegruppe || product.varekategori || "";
  const resolved = resolveEfoVaregruppeName(rawValue);
  if (resolved) return resolved;

  const rawColumns = Object.values(product.rawColumns || {});
  const nameColumn = rawColumns.find(column => {
    const label = `${column.displayName} ${column.originalName}`.toLowerCase();
    return !isVaregruppeCode(column.value) && label.includes("varegruppe") && (label.includes("navn") || label.includes("tekst"));
  });

  return nameColumn?.value || rawValue;
};

export const getProductColumns = (
  onProductClick: (product: Product) => void,
  onDeleteProduct: (productId: string) => void,
  calculateFinalPrice: (enhetspris: number, påslag: number) => number
): ColumnDef<Product>[] => [
  {
    accessorKey: "produktnavn",
    header: "Produktnavn",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("produktnavn")}</div>
    ),
  },
  {
    accessorKey: "produsent",
    header: "Produsent",
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("produsent") || ""}</div>
    ),
  },
  {
    accessorKey: "varegruppe",
    header: "Varegruppe",
    cell: ({ row }) => {
      return <div className="text-gray-600">{getReadableVaregruppe(row.original)}</div>;
    },
  },
  {
    accessorKey: "nobb",
    header: "NOBB",
    cell: ({ row }) => (
      <div className="text-gray-600 whitespace-nowrap">{row.getValue("nobb") || ""}</div>
    ),
  },
  {
    accessorKey: "ean",
    header: "EAN",
    cell: ({ row }) => (
      <div className="text-gray-600 whitespace-nowrap">{row.getValue("ean") || ""}</div>
    ),
  },
  {
    accessorKey: "enhet",
    header: "Enhet",
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("enhet") || "stk"}</div>
    ),
  },
  {
    accessorKey: "enhetspris",
    header: "Enhetspris",
    cell: ({ row }) => {
      const price = row.getValue("enhetspris") as number
      return (
        <div className="text-right text-gray-600">
          {price.toLocaleString('no-NO')} kr
        </div>
      )
    },
  },
  {
    accessorKey: "påslag",
    header: "Påslag",
    cell: ({ row }) => (
      <div className="text-right text-gray-600">
        {row.getValue("påslag")}%
      </div>
    ),
  },
  {
    id: "prisMedPåslag",
    header: "Pris m/påslag",
    cell: ({ row }) => {
      const product = row.original
      const finalPrice = calculateFinalPrice(product.enhetspris, product.påslag)
      return (
        <div className="text-right font-medium">
          {finalPrice.toLocaleString('no-NO')} kr
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Handlinger",
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteProduct(product.id)
            }}
            className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  },
]