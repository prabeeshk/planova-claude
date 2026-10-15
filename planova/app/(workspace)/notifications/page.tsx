"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/formatting/format";
import type { Notification } from "@/lib/domain/types";
import {
  Bell,
  CheckCircle,
  Warning,
  WarningCircle,
  Info,
  ArrowRight,
  Checks,
  Check,
  Funnel,
} from "@phosphor-icons/react";

export default function NotificationsPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterRead, setFilterRead] = useState<"ALL" | "UNREAD">("ALL");
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set(["notif-03", "notif-04", "notif-05"]));

  const { data: notifRes, isLoading } = useQuery({
    queryKey: ["notifications", organisationId],
    queryFn: () => apiClient.getNotifications(),
  });

  const notifications = notifRes?.data || [];

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const isRead = n.read || localReadIds.has(n.id);
      if (filterRead === "UNREAD" && isRead) return false;
      if (filterSeverity !== "ALL" && n.severity !== filterSeverity) return false;
      return true;
    });
  }, [notifications, filterSeverity, filterRead, localReadIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && !localReadIds.has(n.id)).length;
  }, [notifications, localReadIds]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setLocalReadIds(allIds);
  };

  const markAsRead = (id: string) => {
    setLocalReadIds((prev) => new Set([...prev, id]));
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case "critical":
        return <WarningCircle className="h-5 w-5 text-rose-500 shrink-0" weight="fill" />;
      case "warning":
        return <Warning className="h-5 w-5 text-amber-500 shrink-0" weight="fill" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" weight="fill" />;
      default:
        return <Info className="h-5 w-5 text-indigo-400 shrink-0" weight="fill" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/work" className="hover:text-foreground transition-colors">
              My Work
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Activity Notifications</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-indigo-500" />
            Notifications & Signal Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Governance requests, quorum decisions, capacity overruns, and CAB release updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Checks className="h-4 w-4 mr-1.5" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setFilterRead("ALL")}
              className={`px-3 py-1 rounded-md transition-all font-medium ${
                filterRead === "ALL"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setFilterRead("UNREAD")}
              className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                filterRead === "UNREAD"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="h-4 px-1.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Funnel className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-muted-foreground">
          Showing {filteredNotifications.length} items
        </span>
      </div>

      {/* Notifications List */}
      <Card className="border-border bg-card overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <span>No notifications match your active filter.</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notif) => {
              const isRead = notif.read || localReadIds.has(notif.id);

              return (
                <div
                  key={notif.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                    isRead ? "bg-card hover:bg-muted/10 opacity-80" : "bg-muted/20 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(notif.severity)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-foreground">{notif.title}</h4>
                        {!isRead && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground font-medium uppercase px-1.5 py-0.2 rounded bg-muted">
                          {notif.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{notif.body}</p>
                      <span className="text-[11px] font-mono text-muted-foreground/80 block pt-0.5">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-muted-foreground hover:text-foreground"
                        onClick={() => markAsRead(notif.id)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    <Link href={notif.href}>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        <span>View</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
