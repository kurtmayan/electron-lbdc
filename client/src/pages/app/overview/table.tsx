import { api } from "@/api"
import CircleCheck from "@/components/icons/circle-check"
import CircleExclamation from "@/components/icons/circle-exclamation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { parseDateAndTime } from "@/lib/formatDate"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"

type ActivityLog = {
  dateAndTime: Date
  status: "success" | "failed"
  recordSynced: number
}

type SyncRecord = {
  id: string
  date_created: string
  attendance_record: AttendanceRecord[]
}

type AttendanceRecord = {
  employee_name: string
  punch: 0 | 1
  employee_id: string
  id: string
  log_date: string
  sync_record_id: string
}

export default function OverviewTable() {
  const { data = [] } = useQuery<ActivityLog[]>({
    queryKey: ["sync-log"],
    queryFn: async () => {
      const { data }: { data: SyncRecord[] } = await api.get("/sync/all")
      return data
        .map((item) => {
          return {
            dateAndTime: new Date(item.date_created),
            status: "success" as const,
            recordSynced: item.attendance_record.length,
          }
        })
        .sort((a, b) => b.dateAndTime.getTime() - a.dateAndTime.getTime())
    },
  })

  const columns = useMemo<ColumnDef<ActivityLog>[]>(
    () => [
      {
        accessorKey: "dateAndTime",
        header: "Date and Time",
        cell: ({ row }) => {
          const { dateAndTime } = row.original
          const { time, date } = parseDateAndTime(dateAndTime)
          return (
            <div className="ps-20">
              <p>{time}</p>
              <p className="text-xs text-[#8A96A3]">{date}</p>
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          const success = status === "success"
          const failed = status === "failed"

          const Icon = success
            ? CircleCheck
            : failed
              ? CircleExclamation
              : CircleExclamation

          return (
            <div className="flex justify-center">
              <Badge
                className={cn(
                  "capitalize",
                  success
                    ? "bg-[#D4FDE7] text-[#00662D]"
                    : failed
                      ? "bg-[#FFE1E2] text-[#A8000F]"
                      : "text-black"
                )}
              >
                <Icon />
                {status}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "recordSynced",
        header: "Record Synced",
        cell: ({ row }) => (
          <div className="flex flex-row justify-end pe-20">
            <div className="w-[20%]">
              <p className="text-center">{row.original.recordSynced}</p>
            </div>
          </div>
        ),
      },
    ],
    []
  )

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="bg-white px-6 py-5">
      <p className="mb-3 text-[16px] font-semibold">Sync Activity Log</p>
      <Table>
        <TableHeader className="bg-muted/75">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-0 border-none">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="not-first:text-center first:ps-20 last:pe-20 last:text-end"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center font-bold"
              >
                No Data Available!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Separator className="my-5" />
      <div className="flex items-center justify-between">
        <p>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button
            variant={"outline"}
            className="rounded-xl"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant={"outline"}
            className="rounded-xl"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
