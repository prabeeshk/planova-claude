"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useSessionStore } from "@/stores/useSessionStore";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            gcTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const theme = useSessionStore((s) => s.theme);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        theme={theme}
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            borderRadius: "14px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
