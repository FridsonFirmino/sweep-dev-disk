import { CleanupReviewDialog } from "@/features/overview/components/CleanupReviewDialog";
import { EmptyState } from "@/features/overview/components/EmptyState";
import { OverviewHeader } from "@/features/overview/components/OverviewHeader";
import {
  CleanupSuccessNotice,
  ErrorNotice,
  ScanWarningsNotice,
} from "@/features/overview/components/OverviewNotices";
import { ProjectDetails } from "@/features/overview/components/ProjectDetails";
import { ProjectList } from "@/features/overview/components/ProjectList";
import { ScanProgressView } from "@/features/overview/components/ScanProgressView";
import { ScanSummary } from "@/features/overview/components/ScanSummary";
import { readSettingsPreferences } from "@/features/settings/settings-preferences";
import { cancelScan, cleanArtifacts, scanProjects } from "@/services/projects";
import type {
  Artifact,
  CleanupRequest,
  CleanupResult,
  DiskSpace,
  Project,
  ScanProgress,
  ScanWarning,
} from "@/types/domain";
import { useMemo, useRef, useState } from "react";

type ScanState = "idle" | "scanning";

export function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [scannedDisks, setScannedDisks] = useState<DiskSpace[] | null>(null);
  const [scanWarnings, setScanWarnings] = useState<ScanWarning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [simulation, setSimulation] = useState<CleanupResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const orderedProjects = useMemo(
    () =>
      [...projects].sort(
        (left, right) => +new Date(right.lastActivity) - +new Date(left.lastActivity),
      ),
    [projects],
  );
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedArtifacts =
    selectedProject?.artifacts.filter((artifact) => selectedArtifactIds.includes(artifact.id)) ??
    [];

  async function startScan() {
    setError(null);
    setCleanupResult(null);
    setSimulation(null);
    setScanWarnings([]);
    setScannedDisks(null);
    setSelectedArtifactIds([]);
    setScanState("scanning");
    setProgress(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const result = await scanProjects(readSettingsPreferences(), setProgress, controller.signal);
      setProjects(result.projects);
      setScannedDisks(result.disks);
      setSelectedProjectId(null);
      setScanWarnings(result.warnings);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível concluir a análise dos projectos.",
        );
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      setScanState("idle");
      setProgress(null);
    }
  }

  async function stopScan() {
    controllerRef.current?.abort();
    try {
      await cancelScan();
    } catch {
      // Keep the interface responsive if cancellation itself fails.
    }
  }

  function toggleArtifact(artifact: Artifact) {
    setSimulation(null);
    setSelectedArtifactIds((current) =>
      current.includes(artifact.id)
        ? current.filter((id) => id !== artifact.id)
        : [...current, artifact.id],
    );
  }

  function cleanupRequest(dryRun: boolean): CleanupRequest {
    const preferences = readSettingsPreferences();
    return {
      selection: {
        projectId: selectedProject?.id ?? "",
        artifactIds: selectedArtifactIds,
      },
      projectDirectories: preferences.projectDirectories,
      excludedDirectories: preferences.excludedDirectories,
      dryRun,
    };
  }

  async function simulateCleanup() {
    if (!selectedProject || selectedArtifactIds.length === 0) return;
    setError(null);
    setSimulating(true);
    try {
      const result = await cleanArtifacts(cleanupRequest(true));
      setSimulation(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível simular a limpeza.");
      setSimulation(null);
    } finally {
      setSimulating(false);
    }
  }

  async function confirmCleanup() {
    if (!selectedProject) return;
    setError(null);
    setCleaning(true);
    try {
      const result = await cleanArtifacts(cleanupRequest(false));
      setCleanupResult(result);
      setSimulation(null);
      setProjects((current) =>
        current.map((project) =>
          project.id === selectedProject.id
            ? {
                ...project,
                artifacts: project.artifacts.filter(
                  (artifact) => !result.removedArtifactIds.includes(artifact.id),
                ),
              }
            : project,
        ),
      );
      setSelectedArtifactIds([]);
      setReviewOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a limpeza.");
      setReviewOpen(false);
      setSimulation(null);
    } finally {
      setCleaning(false);
    }
  }

  function closeReview() {
    if (simulating || cleaning) return;
    setReviewOpen(false);
    setSimulation(null);
  }

  return (
    <div className="mx-auto max-w-360 px-8 py-8">
      <OverviewHeader
        scanning={scanState === "scanning"}
        hasProjects={projects.length > 0}
        onScan={startScan}
        onCancel={stopScan}
      />
      {error && <ErrorNotice message={error} onDismiss={() => setError(null)} />}
      {scanWarnings.length > 0 && <ScanWarningsNotice warnings={scanWarnings} />}
      {cleanupResult && <CleanupSuccessNotice result={cleanupResult} />}
      {scannedDisks && <ScanSummary projects={projects} disks={scannedDisks} />}
      {scanState === "scanning" && <ScanProgressView progress={progress} />}

      {projects.length > 0 ? (
        <>
          <div
            className={`grid min-w-0 grid-cols-1 gap-6 pt-6 ${selectedProject ? "2xl:grid-cols-[minmax(0,1fr)_320px]" : ""}`}
          >
            {selectedProject && (
              <div className="2xl:order-2">
                <ProjectDetails
                  project={selectedProject}
                  selectedIds={selectedArtifactIds}
                  onToggle={toggleArtifact}
                  onReview={() => {
                    setSimulation(null);
                    setReviewOpen(true);
                  }}
                />
              </div>
            )}
            <div className="min-w-0 2xl:order-1">
              <ProjectList
                projects={orderedProjects}
                selectedProjectId={selectedProjectId}
                onSelect={(projectId) => {
                  setSelectedProjectId(projectId);
                  setSelectedArtifactIds([]);
                  setSimulation(null);
                }}
              />
            </div>
          </div>
        </>
      ) : scanState === "idle" && !error ? (
        <EmptyState onScan={startScan} />
      ) : null}

      {reviewOpen && selectedProject && (
        <CleanupReviewDialog
          project={selectedProject}
          artifacts={selectedArtifacts}
          simulating={simulating}
          cleaning={cleaning}
          simulation={simulation}
          onCancel={closeReview}
          onSimulate={simulateCleanup}
          onConfirm={confirmCleanup}
        />
      )}
    </div>
  );
}
