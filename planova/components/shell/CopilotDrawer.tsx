"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { SimulatedAIIndicator } from "@/components/ui/SimulatedAIIndicator";
import {
  Sparkle,
  X,
  PaperPlaneTilt,
  ArrowRight,
  Info,
  CircleNotch,
} from "@phosphor-icons/react";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  citations?: { label: string; href: string }[];
  followUps?: string[];
  whyShown?: string;
}

export function CopilotDrawer() {
  const router = useRouter();
  const { copilotOpen, setCopilotOpen, organisationId } = useSessionStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const initialMessages: Message[] = [
    {
      id: "msg-init",
      sender: "copilot",
      text: "Hello! I am your PLANOVA Copilot. I analyze project health, risk exposure, and resource capacity across your portfolio. What would you like to review?",
      followUps: [
        "Why is Aurora at risk?",
        "What needs attention this week?",
        "Summarise my critical risks",
        "Who is overallocated?",
      ],
      whyShown: "Session initialized for demo inspection.",
    },
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  if (!copilotOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate smart matching against demo dataset
    setTimeout(() => {
      setLoading(false);
      const q = query.toLowerCase();

      let reply: Message;

      if (q.includes("aurora") || q.includes("why is aurora")) {
        reply = {
          id: `c-${Date.now()}`,
          sender: "copilot",
          text: "Aurora Customer Experience Modernisation is marked **At Risk (Amber)** due to two critical dependencies:\n1. **RAID-AUR-01**: Third-party biometric auth HSM response latency exceeds the 450ms SLA (current: 460ms).\n2. **Task Delayed**: Biometric Identity Gateway milestone slipped by 14 days, impacting scheduled UAT.\n\nChange Request **CR-AUR-001** has been drafted with an adaptive timeout proxy to restore schedule health.",
          citations: [
            { label: "RAID-AUR-01 (Score: 20)", href: "/governance/raid/raid-aur-1" },
            { label: "Task AUR-103: Biometric Auth", href: "/projects/proj-aurora/tasks/proj-aurora-t3" },
            { label: "Change CR-AUR-001 (Ready)", href: "/changes/chg-aur-01" },
          ],
          followUps: ["Review Change Request CR-AUR-001", "Who is overallocated?", "Show Aurora pulse"],
          whyShown: "Matched project 'Aurora' and active risk RAID-AUR-01.",
        };
      } else if (q.includes("attention") || q.includes("this week")) {
        reply = {
          id: `c-${Date.now()}`,
          sender: "copilot",
          text: "Here are the top 3 items requiring your attention across Meridian:\n• **Approval Waiting**: CR-AUR-001 is awaiting Governance Approver decision (due in 2 days).\n• **Critical Risk Review**: RAID-NIM-01 (Arjun Mehta overallocated at 140%) is due for review tomorrow.\n• **Budget Exception**: Atlas Finance Transformation has an unapproved AED 380,000 contractor rate variance.",
          citations: [
            { label: "Decision Inbox (1 Pending)", href: "/approvals" },
            { label: "RAID-NIM-01 (Arjun Mehta)", href: "/governance/raid/raid-nim-1" },
            { label: "Atlas Budget Variance", href: "/financials" },
          ],
          followUps: ["Review pending approvals", "Inspect capacity heatmap"],
          whyShown: "Aggregated items with deadlines within the next 48 hours.",
        };
      } else if (q.includes("overallocated") || q.includes("capacity")) {
        reply = {
          id: `c-${Date.now()}`,
          sender: "copilot",
          text: "**Arjun Mehta (Lead Cloud Architect)** is currently overallocated at **140% capacity**:\n• 65% assigned on Aurora Customer Experience Modernisation\n• 75% assigned on Nimbus Cloud Migration\n\nThis allocation conflict is causing code review bottlenecks in Aurora Sprint 6. Resource Manager Daniel Kim has a pending reallocation request.",
          citations: [
            { label: "Arjun Mehta Profile", href: "/resources/people?search=Arjun" },
            { label: "Capacity Heatmap", href: "/resources" },
            { label: "RAID-NIM-01 Risk Record", href: "/governance/raid/raid-nim-1" },
          ],
          followUps: ["Open Capacity Planner", "View Nimbus allocations"],
          whyShown: "Capacity calculation exceeds 100% threshold for user 'u-arjun'.",
        };
      } else if (q.includes("critical") || q.includes("risk")) {
        reply = {
          id: `c-${Date.now()}`,
          sender: "copilot",
          text: "There are currently **4 Critical RAID items** across the active portfolio:\n1. **RAID-AUR-01**: Biometric HSM Latency (Score: 20, Exposure: AED 350,000)\n2. **RAID-ATL-01**: External SAP Advisory Cost Variance (Score: 25, Exposure: AED 380,000)\n3. **RAID-NIM-01**: Architect Overcapacity Contention (Score: 20, Exposure: AED 200,000)\n4. **RAID-APX-01**: Security Pen-Test Certificate Delay (Score: 25, Exposure: AED 250,000)",
          citations: [
            { label: "Open RAID Matrix", href: "/governance" },
            { label: "RAID-ATL-01 Detail", href: "/governance/raid/raid-atl-1" },
          ],
          followUps: ["Why is Aurora at risk?", "Who is overallocated?"],
          whyShown: "Items filtered by Severity = 'Critical'.",
        };
      } else {
        reply = {
          id: `c-${Date.now()}`,
          sender: "copilot",
          text: `I simulated an analysis for "${query}". In this demo environment, try one of our recommended prompts below to explore verified seeded project intelligence.`,
          followUps: [
            "Why is Aurora at risk?",
            "What needs attention this week?",
            "Summarise my critical risks",
            "Who is overallocated?",
          ],
          whyShown: "Fallback query response for demo simulation.",
        };
      }

      setMessages((prev) => [...prev, reply]);
    }, 450);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[var(--surface)] border-l border-[var(--surface-border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-16 px-5 border-b border-[var(--surface-border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Sparkle weight="fill" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
              <span>PLANOVA Copilot</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300">
                Demo
              </span>
            </div>
            <div className="text-[10px] text-[var(--muted)]">Contextual Project Intelligence</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCopilotOpen(false)}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
          aria-label="Close Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[var(--primary)] text-white font-medium"
                  : "bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-[var(--foreground)] space-y-2.5"
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {msg.sender === "copilot" && (
                <>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-[var(--surface-border)] space-y-1.5">
                      <div className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                        Source Evidence Links
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setCopilotOpen(false);
                              router.push(c.href);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-[11px] font-medium text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
                          >
                            <Info className="w-3 h-3" />
                            <span>{c.label}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <SimulatedAIIndicator
                    whyShown={msg.whyShown}
                    compact
                    className="mt-1"
                  />
                </>
              )}
            </div>

            {/* Follow-up chips */}
            {msg.followUps && msg.followUps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                {msg.followUps.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-[var(--foreground)] hover:border-[var(--primary)] transition-all shadow-2xs"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] bg-[var(--surface-elevated)] p-3 rounded-2xl w-fit">
            <CircleNotch className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
            <span>Analyzing project graph & risk matrix...</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-[var(--surface-border)] bg-[var(--surface)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot about risk, health, or people..."
            className="flex-1 h-10 px-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--background)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-10 w-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center hover:bg-[var(--primary-hover)] disabled:opacity-40 transition-colors shrink-0"
            aria-label="Send query"
          >
            <PaperPlaneTilt className="w-4 h-4" />
          </button>
        </form>
        <div className="text-[10px] text-center text-[var(--muted)] mt-2">
          Demonstration AI simulation with deterministic citations. No external LLM called.
        </div>
      </div>
    </div>
  );
}
