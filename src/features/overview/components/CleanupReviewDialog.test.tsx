import { CleanupReviewDialog } from "@/features/overview/components/CleanupReviewDialog";
import type { Artifact, Project } from "@/types/domain";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const project: Project = {
  id: "/projects/demo",
  name: "demo",
  path: "/projects/demo",
  technology: "Node.js",
  lastActivity: "2026-11-04T10:00:00Z",
  artifacts: [],
};

const artifact: Artifact = {
  id: "/projects/demo/node_modules",
  name: "node_modules",
  path: "/projects/demo/node_modules",
  sizeBytes: 2048,
  reclaimableBytes: 2048,
  risk: "low",
};

function renderDialog(overrides: Partial<Parameters<typeof CleanupReviewDialog>[0]> = {}) {
  const onCancel = vi.fn();
  const onSimulate = vi.fn();
  const onConfirm = vi.fn();
  render(
    <CleanupReviewDialog
      project={project}
      artifacts={[artifact]}
      simulating={false}
      cleaning={false}
      simulation={null}
      onCancel={onCancel}
      onSimulate={onSimulate}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );
  return { onCancel, onSimulate, onConfirm };
}

describe("CleanupReviewDialog", () => {
  it("lists paths and offers simulate and confirm actions", () => {
    const { onSimulate, onConfirm } = renderDialog();
    expect(screen.getByRole("heading", { name: "Rever limpeza" })).toBeInTheDocument();
    expect(screen.getByText("/projects/demo/node_modules")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Simular/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar limpeza/ })).toBeInTheDocument();
    expect(onSimulate).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows simulation results and disables confirm when nothing is valid", () => {
    renderDialog({
      simulation: {
        dryRun: true,
        removedArtifactIds: [],
        wouldRemoveArtifactIds: [],
        reclaimedBytes: 0,
        failures: [{ artifactId: artifact.id, code: "cleanup_path_outside_roots" }],
      },
    });
    expect(screen.getByText("inválido")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar limpeza/ })).toBeDisabled();
    expect(screen.getByText(/não passaram na validação/)).toBeInTheDocument();
  });

  it("calls simulate and confirm handlers", async () => {
    const { onSimulate, onConfirm } = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Simular/ }));
    await userEvent.click(screen.getByRole("button", { name: /Confirmar limpeza/ }));
    expect(onSimulate).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
