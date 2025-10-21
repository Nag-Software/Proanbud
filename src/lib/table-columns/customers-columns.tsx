import { ColumnDef } from "@tanstack/react-table"
import { Kunde } from "@/lib/types"

export const getCustomerColumns = (): ColumnDef<Kunde>[] => [
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
]