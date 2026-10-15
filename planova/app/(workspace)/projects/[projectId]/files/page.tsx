"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/formatting/format";
import { toast } from "sonner";
import {
  FileText,
  UploadSimple,
  Eye,
  FilePdf,
  FileCode,
  FileXls,
  ShieldCheck,
  CheckCircle,
} from "@phosphor-icons/react";

interface MockFile {
  id: string;
  name: string;
  type: "pdf" | "spreadsheet" | "code" | "doc";
  classification: "Public" | "Internal" | "Confidential" | "Restricted";
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
}

export default function ProjectFilesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [files, setFiles] = useState<MockFile[]>([
    {
      id: "f-01",
      name: "Project_Charter_Baseline_v1.0.pdf",
      type: "pdf",
      classification: "Confidential",
      sizeKb: 1420,
      uploadedAt: "2026-09-01T10:00:00Z",
      uploadedBy: "Fatima Al-Mansoor",
    },
    {
      id: "f-02",
      name: "UAE_Central_Bank_Security_Compliance_Matrix.xlsx",
      type: "spreadsheet",
      classification: "Restricted",
      sizeKb: 840,
      uploadedAt: "2026-09-18T14:30:00Z",
      uploadedBy: "Tariq Vance",
    },
    {
      id: "f-03",
      name: "Core_Banking_HSM_Latency_Benchmark_Results.pdf",
      type: "pdf",
      classification: "Internal",
      sizeKb: 2150,
      uploadedAt: "2026-10-04T09:15:00Z",
      uploadedBy: "Arjun Mehta",
    },
    {
      id: "f-04",
      name: "OpenAPI_v3_Integration_Contract_Draft.json",
      type: "code",
      classification: "Internal",
      sizeKb: 320,
      uploadedAt: "2026-10-10T16:45:00Z",
      uploadedBy: "Elena Rostova",
    },
  ]);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MockFile | null>(null);
  const [fileName, setFileName] = useState("");
  const [classification, setClassification] = useState<"Public" | "Internal" | "Confidential" | "Restricted">("Internal");

  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const project = projectRes?.data;

  const handleSimulatedUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    const newDoc: MockFile = {
      id: `f-${Date.now()}`,
      name: fileName.trim(),
      type: fileName.endsWith(".xlsx") || fileName.endsWith(".csv") ? "spreadsheet" : fileName.endsWith(".pdf") ? "pdf" : "doc",
      classification,
      sizeKb: Math.floor(Math.random() * 2000) + 120,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Current Session",
    };

    setFiles([newDoc, ...files]);
    toast.success(`Metadata recorded for "${newDoc.name}"`);
    setUploadModalOpen(false);
    setFileName("");
  };

  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Classified Project Documents
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--surface-raised)] text-[var(--muted)]">
                {files.length} documents
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Classified document references and attachment metadata registered to this delivery governance boundary.
            </p>
          </div>

          <Button onClick={() => setUploadModalOpen(true)}>
            <UploadSimple className="w-4 h-4 mr-1.5" />
            Register Document
          </Button>
        </div>

        {/* Notice on simulation */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/40 p-3.5 flex items-center justify-between text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Metadata catalog preview: Real file content storage requires enterprise blob storage integration in future phase.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--foreground)]">
            Phase 1 Contract
          </span>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className="p-5 flex flex-col justify-between space-y-4 hover:border-[var(--color-brand)]/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center shrink-0">
                    {file.type === "pdf" ? (
                      <FilePdf className="w-5 h-5 text-red-500" />
                    ) : file.type === "spreadsheet" ? (
                      <FileXls className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <FileCode className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      file.classification === "Restricted"
                        ? "bg-red-500/15 text-red-600"
                        : file.classification === "Confidential"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-blue-500/15 text-blue-600"
                    }`}
                  >
                    {file.classification}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-2">
                    {file.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {(file.sizeKb / 1024).toFixed(2)} MB · Uploaded by {file.uploadedBy}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  {formatDateTime(file.uploadedAt)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(file)}
                  className="gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Simulated Upload Modal */}
      <Modal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        title="Register Document Reference"
        description="Select a file from your system. PLANOVA records filename, classification, and metadata into the project ledger."
      >
        <form onSubmit={handleSimulatedUpload} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Document Name / Path <span className="text-red-500">*</span>
            </label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. Architecture_Decision_Record_042.pdf"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Security Classification</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as any)}
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            >
              <option value="Internal">Internal</option>
              <option value="Confidential">Confidential</option>
              <option value="Restricted">Restricted (UAE Central Bank / PCI-DSS)</option>
              <option value="Public">Public</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewFile && (
        <Modal
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          title={`Document Metadata — ${previewFile.name}`}
          description="Classified delivery artefact record."
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Classification</span>
                <span className="font-bold text-[var(--foreground)]">{previewFile.classification}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">File Size</span>
                <span className="font-mono text-[var(--foreground)]">{previewFile.sizeKb} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Recorded By</span>
                <span className="text-[var(--foreground)]">{previewFile.uploadedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Timestamp</span>
                <span className="font-mono text-[var(--foreground)]">{formatDateTime(previewFile.uploadedAt)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-blue-700 dark:text-blue-300">
              <p>
                In production, this document is encrypted at rest with enterprise customer-managed keys (CMEK) and integrated with enterprise DLP scanners.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
