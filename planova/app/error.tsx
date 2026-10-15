"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Warning, ArrowsClockwise, House } from "@phosphor-icons/react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debug tracking
    console.error("Global Error Caught by Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
          <Warning size={36} weight="duotone" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase font-bold tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            Runtime Error Handled
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Something Went Wrong
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected client exception occurred. Your local mock records and optimistic changes remain preserved.
          </p>
          {error.digest && (
            <span className="block font-mono text-[11px] text-muted-foreground/80 bg-muted/50 p-2 rounded border border-border">
              Digest: {error.digest}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="primary" onClick={() => reset()} className="w-full sm:w-auto">
            <ArrowsClockwise className="h-4 w-4 mr-1.5" />
            Try Again
          </Button>
          <Link href="/home" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <House className="h-4 w-4 mr-1.5" />
              Workspace Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
