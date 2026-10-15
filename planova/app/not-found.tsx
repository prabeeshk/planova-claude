"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { WarningCircle, House, MagnifyingGlass, FolderSimple } from "@phosphor-icons/react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
          <WarningCircle size={36} weight="duotone" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase font-bold tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            HTTP 404 Not Found
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Entity or Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The requested subsurface route, project identifier, or governance record could not be resolved in the
            active enterprise context.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/home" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              <House className="h-4 w-4 mr-1.5" />
              Workspace Home
            </Button>
          </Link>
          <Link href="/search" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <MagnifyingGlass className="h-4 w-4 mr-1.5" />
              Search Registry
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
