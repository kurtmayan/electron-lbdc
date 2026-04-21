import { parseDate } from "@/lib/formatDate"

export default function TopBar() {
  const currentDate = parseDate(new Date(), "MMMM dd, yyyy")
  return (
    <div className="items mb-5 flex flex-row justify-between">
      <div>
        <p className="text-2xl font-bold">Attendance Overview</p>
        <p className="font-light text-[#8A96A3]">
          Summary of local store biometric records.
        </p>
      </div>
      <p className="text-2xl font-bold">{currentDate}</p>
    </div>
  )
}
