import { api } from "@/api"
import Sync from "@/components/icons/sync"
import { Button } from "@/components/ui/button"
import { queryClient } from "@/queryClient"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

export default function StoreInfo() {
  const { data } = useQuery({
    queryKey: ["connectivity"],
    queryFn: async () => {
      const { data } = await api.get("/biometric-device/health-check")
      return data
    },
  })

  const handleSync = async () => {
    try {
      toast.promise(
        async () => {
          await api.get("/sync/create")
          queryClient.invalidateQueries({ queryKey: ["sync-log"] })
        },

        {
          loading: "Loading...",
          success: () => {
            return <p className="text-[#40A676]">Sync Successful!</p>
          },
          error: () => {
            return <p className="text-[#DF5160]">Sync Error!</p>
          },
          position: "top-center",
        }
      )
    } catch (e) {
      console.log(e)
    }
    //
  }

  return (
    <div className="mb-5 flex flex-row justify-between bg-white p-5">
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-bold">HOEW</p>
        <p>
          <span className="text-[#8A96A3]">Location:</span> Head Office Eastwood
        </p>
        <div className="flex flex-row gap-5">
          <div>
            <p className="text-[#1F1F1F80]">Device Model</p>
            <p>ZKTeco K40</p>
          </div>
          <div>
            <p className="text-[#1F1F1F80]">Status</p>
            {data && (
              <p
                className={`${data.status == "ok" ? "text-green-500" : "text-red-500"}`}
              >
                {data.status == "ok" ? "Connected" : "Disconnected"}
              </p>
            )}
          </div>
        </div>
      </div>
      <Button size={"lg"} onClick={handleSync}>
        <Sync className="size-5" />
        Sync to O-BDC
      </Button>
    </div>
  )
}
