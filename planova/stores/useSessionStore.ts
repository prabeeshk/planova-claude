import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type PersonaId,
  type RoleCode,
  type Session,
  PERSONAS,
  sessionFor,
} from "@/lib/access/permissions";
import { apiClient } from "@/lib/mock-api/client";
import { MockApiClient } from "@/lib/mock-api/client";
import type { FaultInjectionConfig } from "@/lib/mock-api/types";

interface SessionStoreState {
  personaId: PersonaId;
  organisationId: string;
  theme: "light" | "dark";
  density: "comfortable" | "compact";
  copilotOpen: boolean;
  commandPaletteOpen: boolean;
  activeProjectId: string | null;

  // Fault injector state
  faultConfig: FaultInjectionConfig;

  // Actions
  setPersona: (personaId: PersonaId) => void;
  setOrganisation: (orgId: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setDensity: (density: "comfortable" | "compact") => void;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveProjectId: (projectId: string | null) => void;
  setFaultConfig: (config: Partial<FaultInjectionConfig>) => void;
  resetAllSeedData: () => void;
}

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
      personaId: "pm",
      organisationId: "org-meridian",
      theme: "light",
      density: "comfortable",
      copilotOpen: false,
      commandPaletteOpen: false,
      activeProjectId: "proj-aurora",

      faultConfig: MockApiClient.getFaultConfig(),

      setPersona: (personaId) => {
        const orgId = get().organisationId;
        const newSession = sessionFor(personaId, orgId);
        apiClient.setContext(orgId, newSession.userId);
        set({ personaId });
      },

      setOrganisation: (organisationId) => {
        const personaId = get().personaId;
        const newSession = sessionFor(personaId, organisationId);
        apiClient.setContext(organisationId, newSession.userId);
        set({ organisationId, activeProjectId: null });
      },

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },

      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        get().setTheme(next);
      },

      setDensity: (density) => set({ density }),
      setCopilotOpen: (copilotOpen) => set({ copilotOpen }),
      toggleCopilot: () => set((state) => ({ copilotOpen: !state.copilotOpen })),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setActiveProjectId: (activeProjectId) => set({ activeProjectId }),

      setFaultConfig: (config) => {
        MockApiClient.setFaultConfig(config);
        set({ faultConfig: MockApiClient.getFaultConfig() });
      },

      resetAllSeedData: () => {
        MockApiClient.resetAllData();
      },
    }),
    {
      name: "planova_session_store_v1",
      partialize: (state) => ({
        personaId: state.personaId,
        organisationId: state.organisationId,
        theme: state.theme,
        density: state.density,
      }),
    }
  )
);

export function useCurrentSession(): Session {
  const personaId = useSessionStore((s) => s.personaId);
  const organisationId = useSessionStore((s) => s.organisationId);
  return sessionFor(personaId, organisationId);
}
