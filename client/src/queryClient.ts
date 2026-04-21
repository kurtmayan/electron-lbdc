import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 6000,
      gcTime: 1000 * 60 * 30,
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
})
