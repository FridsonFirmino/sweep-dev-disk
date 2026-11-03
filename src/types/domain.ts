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
  completedAt: string;
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

export interface CleanupResult {
  removedArtifactIds: string[];
  reclaimedBytes: number;
  failures: Array<{ artifactId: string; message: string }>;
}
