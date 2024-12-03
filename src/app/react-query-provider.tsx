'use client'

import React, { ReactNode, useState } from 'react'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(new QueryClient({
    defaultOptions: {
      queries: {
        // cacheTime: 15 * 60 * 1000, // 15 minutes
        staleTime: 10 * 60 * 1000   // 10 minutes
      },
    }
  }))

  return (
    <QueryClientProvider client={client}>
      <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
    </QueryClientProvider>
  )
}
