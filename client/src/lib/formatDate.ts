import { format } from "date-fns"

export const parseDate = (date: Date, parseFormat: string) => {
  return format(new Date(date), parseFormat)
}

export const parseDateAndTime = (date: Date) => {
  return {
    date: format(date, "MMMM dd, yyyy"),
    time: format(date, "hh:mm a"),
  }
}
