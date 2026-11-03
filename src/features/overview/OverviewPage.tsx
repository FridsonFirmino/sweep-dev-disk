import { useMemo, useRef, useState } from "react";
import { CleanupReviewDialog } from "@/features/overview/components/CleanupReviewDialog";
import { EmptyState } from "@/features/overview/components/EmptyState";
import { OverviewHeader } from "@/features/overview/components/OverviewHeader";
import {
  CleanupSuccessNotice,
  DemoNotice,
  ErrorNotice,
} from "@/features/overview/components/OverviewNotices";
import { ProjectDetails } from "@/features/overview/components/ProjectDetails";
import { ProjectList } from "@/features/overview/components/ProjectList";
import { ScanProgressView } from "@/features/overview/components/ScanProgressView";
import { ScanSummary } from "@/features/overview/components/ScanSummary";
import { cancelScan, cleanArtifacts, getInitialProjects, scanProjects } from "@/services/projects";
import type { Artifact, CleanupResult, Project, ScanProgress } from "@/types/domain";

type ScanState = "idle" | "scanning";

export function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>(getInitialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
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
    setSelectedArtifactIds([]);
    setScanState("scanning");
    setProgress(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const result = await scanProjects(setProgress, controller.signal);
      setProjects(result.projects);
      setSelectedProjectId(null);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setError(
          cause instanceof Error ? cause.message : "The project scan could not be completed.",
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
      // The backend may not implement cancellation in this build yet.
    }
    setScanState("idle");
    setProgress(null);
  }

  function toggleArtifact(artifact: Artifact) {
    setSelectedArtifactIds((current) =>
      current.includes(artifact.id)
        ? current.filter((id) => id !== artifact.id)
        : [...current, artifact.id],
    );
  }

  async function confirmCleanup() {
    if (!selectedProject) return;
    setError(null);
    try {
      const result = await cleanArtifacts({
        projectId: selectedProject.id,
        artifactIds: selectedArtifactIds,
      });
      setCleanupResult(result);
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
      setError(cause instanceof Error ? cause.message : "The cleanup could not be completed.");
      setReviewOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-8">
      <OverviewHeader
        scanning={scanState === "scanning"}
        hasProjects={projects.length > 0}
        onScan={startScan}
        onCancel={stopScan}
      />
      <DemoNotice />
      {error && <ErrorNotice message={error} onDismiss={() => setError(null)} />}
      {cleanupResult && <CleanupSuccessNotice result={cleanupResult} />}
      {scanState === "scanning" && <ScanProgressView progress={progress} />}

      {projects.length > 0 ? (
        <>
          <ScanSummary projects={projects} />
          <div
            className={`grid gap-6 pt-6 ${selectedProject ? "grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1"}`}
          >
            <ProjectList
              projects={orderedProjects}
              selectedProjectId={selectedProjectId}
              onSelect={(projectId) => {
                setSelectedProjectId(projectId);
                setSelectedArtifactIds([]);
              }}
            />
            {selectedProject && (
              <ProjectDetails
                project={selectedProject}
                selectedIds={selectedArtifactIds}
                onToggle={toggleArtifact}
                onReview={() => setReviewOpen(true)}
              />
            )}
          </div>
        </>
      ) : scanState === "idle" && !error ? (
        <EmptyState onScan={startScan} />
      ) : null}

      {reviewOpen && selectedProject && (
        <CleanupReviewDialog
          project={selectedProject}
          artifacts={selectedArtifacts}
          onCancel={() => setReviewOpen(false)}
          onConfirm={confirmCleanup}
        />
      )}
    </div>
  );
}
