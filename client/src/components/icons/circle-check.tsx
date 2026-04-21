import { cn } from "@/lib/utils"
import type { Icon } from "@/types/icon"

export default function CircleCheck(props: Icon) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || "24"}
      height={props.height || "24"}
      viewBox="0 0 24 24"
      fill={props.fill || "none"}
      stroke={props.stroke || "currentColor"}
      strokeWidth={props.strokeWidth || "2"}
      strokeLinecap={props.strokeLinecap || "round"}
      strokeLinejoin={props.strokeLinejoin || "round"}
      className={cn(
        "icon icon-tabler icons-tabler-outline icon-tabler-circle-check",
        props.className
      )}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
    </svg>
  )
}
