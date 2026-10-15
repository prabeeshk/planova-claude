"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/formatting/format";
import type { LeaveRequest, User } from "@/lib/domain/types";
import {
  Calendar as CalendarIcon,
  CaretLeft,
  CaretRight,
  Lock,
  Sun,
  User as UserIcon,
  AirplaneTilt,
  CheckCircle,
  Funnel,
  Briefcase,
} from "@phosphor-icons/react";

const HOLIDAYS: { date: string; name: string }[] = [
  { date: "2026-11-30", name: "Commemoration / Martyr's Day" },
  { date: "2026-12-02", name: "UAE National Day (Day 1)" },
  { date: "2026-12-03", name: "UAE National Day (Day 2)" },
  { date: "2027-01-01", name: "New Year's Day" },
];

export default function WorkforceCalendarPage() {
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const canApproveLeave = can(session, "leave.approve");

  // Calendar anchor: Current month October 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed (9 = October)
  const [selectedPersonId, setSelectedPersonId] = useState<string>("ALL");

  const { data: leaveRes } = useQuery({
    queryKey: ["leaveRequests", organisationId],
    queryFn: () => apiClient.getLeaveRequests(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const leaveRequests = leaveRes?.data || [];
  const people = peopleRes?.data || [];

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const setToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9); // October 2026 (DEMO_TODAY)
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    return { totalDays, firstDayIndex };
  }, [currentYear, currentMonth]);

  // Filtered people
  const filteredPeople = useMemo(() => {
    if (selectedPersonId === "ALL") return people;
    return people.filter((p) => p.id === selectedPersonId);
  }, [people, selectedPersonId]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/workforce/leave" className="hover:text-foreground transition-colors">
              Leave
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Team Availability Calendar</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CalendarIcon className="h-7 w-7 text-indigo-500" />
            Team Availability & Absence Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monthly schedule of planned absence, corporate statutory holidays, and team capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/workforce/leave">
            <Button variant="outline" size="sm">
              <AirplaneTilt className="h-4 w-4 mr-1.5" />
              Manage Requests
            </Button>
          </Link>
          <Link href="/resources/capacity">
            <Button variant="outline" size="sm">
              <Briefcase className="h-4 w-4 mr-1.5" />
              Workforce Capacity
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar: Navigation & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
              <CaretLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
              <CaretRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-base font-bold text-foreground min-w-[160px]">
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <Button variant="ghost" size="sm" onClick={setToday} className="text-xs h-8">
            Today
          </Button>
        </div>

        {/* Filter and Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <Funnel className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="ALL">All Team Members ({people.length})</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500/80 border border-indigo-400" />
              <span>Annual Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-purple-500/80 border border-purple-400" />
              <span>Study / Training</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/80 border border-amber-400" />
              <span>Public Holiday</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Month Calendar Grid */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold py-2.5 bg-muted/30 text-muted-foreground">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border min-h-[500px]">
          {/* Empty prefix slots */}
          {Array.from({ length: daysInMonth.firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-muted/10 p-2 min-h-[90px]" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth.totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
              dayNum
            ).padStart(2, "0")}`;

            // Check if public holiday
            const holiday = HOLIDAYS.find((h) => h.date === dateStr);

            // Check absences on this day
            const absencesOnDay = leaveRequests.filter((r) => {
              if (selectedPersonId !== "ALL" && r.userId !== selectedPersonId) return false;
              return dateStr >= r.startDate && dateStr <= r.endDate && r.status === "Approved";
            });

            const isToday = dateStr === "2026-10-14";

            return (
              <div
                key={dateStr}
                className={`p-2 min-h-[95px] flex flex-col justify-between transition-colors ${
                  isToday ? "bg-indigo-500/5 ring-1 ring-inset ring-indigo-500" : "hover:bg-muted/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-medium rounded-full h-5 w-5 flex items-center justify-center ${
                      isToday
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {holiday && (
                    <span title={holiday.name}>
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1 flex-1">
                  {holiday && (
                    <div className="text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 truncate">
                      {holiday.name}
                    </div>
                  )}

                  {absencesOnDay.map((abs) => {
                    const person = people.find((p) => p.id === abs.userId);
                    const isSelf = abs.userId === session.userId;
                    const canSeeReason = isSelf || canApproveLeave;

                    const colorClass =
                      abs.type === "Annual"
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                        : abs.type === "Study"
                        ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30";

                    return (
                      <div
                        key={abs.id}
                        className={`text-[10px] font-medium rounded px-1.5 py-0.5 border flex items-center justify-between gap-1 group relative ${colorClass}`}
                      >
                        <span className="truncate">{person?.name.split(" ")[0]} ({abs.type})</span>
                        {!canSeeReason && <Lock className="h-2.5 w-2.5 text-muted-foreground/60 shrink-0" />}

                        {/* Tooltip on hover */}
                        <div className="hidden group-hover:block absolute bottom-full left-0 z-20 w-48 p-2 rounded-lg bg-popover text-popover-foreground border border-border shadow-xl text-[11px] space-y-1 pointer-events-none">
                          <strong className="block text-foreground">{person?.name}</strong>
                          <span className="text-muted-foreground block">
                            {formatDate(abs.startDate)} - {formatDate(abs.endDate)}
                          </span>
                          <span className="text-muted-foreground/90 italic block pt-0.5 border-t border-border">
                            {canSeeReason ? abs.reason : "[Private Reason Hidden]"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Roster List of Active Absences */}
      <Card className="p-5 border-border bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <AirplaneTilt className="h-4 w-4 text-indigo-500" />
          <span>Scheduled Absence Periods</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {leaveRequests
            .filter((r) => r.status === "Approved")
            .map((req) => {
              const person = people.find((p) => p.id === req.userId);
              const isSelf = req.userId === session.userId;
              const canSeeReason = isSelf || canApproveLeave;

              return (
                <div
                  key={req.id}
                  className="p-3 bg-muted/30 rounded-lg border border-border text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{person?.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {req.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-border/50">
                    {canSeeReason ? req.reason : "[Private Reason Hidden]"}
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}
