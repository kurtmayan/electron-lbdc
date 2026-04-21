import { Button } from "@/components/ui/button"
import { IconRefresh } from "@tabler/icons-react"
import AttendanceTable from "./table"
import { queryClient } from "@/queryClient"

export default function Attendance() {
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["data"] })
  }

  return (
    <div className="bg-white p-5">
      <div className="mb-5 flex flex-row items-center justify-between">
        <p className="text-[16px] font-semibold">Recent Time Logs</p>
        <Button size={"icon"} onClick={handleRefresh}>
          <IconRefresh />
        </Button>
      </div>
      <AttendanceTable />
    </div>
  )
}
