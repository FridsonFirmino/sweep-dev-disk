export type ArtifactRisk = "low" | "medium" | "high";

export interface Artifact {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  reclaimableBytes: number;
  risk: ArtifactRisk;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  technology: string;
  lastActivity: string;
  artifacts: Artifact[];
}

export interface ScanResult {
  projects: Project[];
  disks: DiskSpace[];
  completedAt: string;
  warnings: ScanWarning[];
}

export interface DiskSpace {
  mountPath: string;
  totalBytes: number;
  availableBytes: number;
}

export interface ScanOptions {
  projectDirectories: string[];
  excludedDirectories: string[];
  followSymbolicLinks: boolean;
  scanHiddenDirectories: boolean;
}

export interface ScanWarning {
  code: string;
  path?: string;
}

export interface ScanProgress {
  currentPath: string;
  projectsFound: number;
  artifactsFound: number;
  completed?: number;
  total?: number;
}

export interface CleanupSelection {
  projectId: string;
  artifactIds: string[];
}

export interface CleanupRequest {
  selection: CleanupSelection;
  projectDirectories: string[];
  excludedDirectories: string[];
  dryRun: boolean;
}

export interface CleanupFailure {
  artifactId: string;
  code: string;
  message?: string;
}

export interface CleanupResult {
  dryRun: boolean;
  removedArtifactIds: string[];
  wouldRemoveArtifactIds: string[];
  reclaimedBytes: number;
  failures: CleanupFailure[];
}

export interface CleanupHistoryEntry {
  id: string;
  finishedAt: string;
  projectId: string;
  removedArtifactIds: string[];
  reclaimedBytes: number;
  failureCount: number;
  restorable: boolean;
}
