import { ColumnDef } from "@tanstack/react-table"
import { Kunde } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"

export const getCustomerColumns = (
  onEditCustomer?: (customer: Kunde) => void,
  onDeleteCustomer?: (customer: Kunde) => void
): ColumnDef<Kunde>[] => [
  {
    accessorKey: "navn",
    header: "Kunde",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("navn")}</div>
    ),
  },
  {
    accessorKey: "epost",
    header: "E-post",
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("epost")}</div>
    ),
  },
  {
    accessorKey: "telefon",
    header: "Telefon",
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("telefon") || ""}</div>
    ),
  },
  {
    accessorKey: "antallTilbud",
    header: "Antall Tilbud",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("antallTilbud") || 0}</div>
    ),
  },
  {
    accessorKey: "antallVunnet",
    header: "Vunnet",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("antallVunnet") || 0}</div>
    ),
  },
  {
    accessorKey: "sistAktivitet",
    header: "Sist Aktivitet",
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("sistAktivitet")}</div>
    ),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Åpne meny</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditCustomer?.(customer)}>
                <Edit className="mr-2 h-4 w-4" />
                Rediger
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteCustomer?.(customer)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Slett
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]