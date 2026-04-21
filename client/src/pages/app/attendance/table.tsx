import { api } from "@/api"
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
import { useQuery } from "@tanstack/react-query"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"

export type AttendanceLogs = {
  employee: string
  mode: "time-in" | "time-out"
  date: Date
  userID: string
}

export type RawAttendanceLogs = {
  name: string
  user_id: string
  logDate: string
  logType: number
}

export default function AttendanceTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data = [] } = useQuery<AttendanceLogs[]>({
    queryKey: ["data"],
    queryFn: async () => {
      const { data }: { data: RawAttendanceLogs[] } = await api.get(
        "/biometric-device/attendance"
      )

      return data.map((item) => {
        return {
          userID: item.user_id,
          employee: item.name,
          mode: item.logType == 0 ? "time-in" : "time-out",
          date: new Date(item.logDate),
        }
      })
    },
  })

  const columns = useMemo<ColumnDef<AttendanceLogs>[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => {
          return (
            <div>
              <p>{row.original.employee}</p>
              <p className="text-xs font-normal text-[#8A96A3]">
                Employee ID: {row.original.userID}
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: "mode",
        header: "Mode",
        cell: ({ row }) => (
          <p className="text-center">
            {row.original.mode == "time-in" ? "Time In" : "Time Out"}
          </p>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          const dateValue = row.original.date
          const { date, time } = parseDateAndTime(dateValue)
          return (
            <div className="flex flex-row justify-end pe-10">
              <div className="text-center">
                <p>{time}</p>
                <p className="text-xs text-[#8A96A3]">{date}</p>
              </div>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
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
