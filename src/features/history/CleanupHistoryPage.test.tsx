import { CleanupHistoryPage } from "@/features/history/CleanupHistoryPage";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listMock = vi.fn();
const restoreMock = vi.fn();

vi.mock("@/services/projects", () => ({
  listCleanupHistory: (...args: unknown[]) => listMock(...args),
  restoreCleanupEntry: (...args: unknown[]) => restoreMock(...args),
}));

describe("CleanupHistoryPage", () => {
  beforeEach(() => {
    listMock.mockReset();
    restoreMock.mockReset();
  });

  it("shows the empty state when there is no history", async () => {
    listMock.mockResolvedValue([]);
    render(<CleanupHistoryPage />);
    expect(await screen.findByText("Ainda não há limpezas registadas")).toBeInTheDocument();
  });

  it("lists entries and restores when possible", async () => {
    listMock.mockResolvedValue([
      {
        id: "e1",
        finishedAt: "2026-11-04T10:00:00Z",
        projectId: "/home/user/project-a",
        removedArtifactIds: ["/home/user/project-a/node_modules"],
        reclaimedBytes: 1024,
        failureCount: 0,
        restorable: true,
      },
    ]);
    restoreMock.mockResolvedValue(1);

    render(<CleanupHistoryPage />);
    expect(await screen.findByText("project-a")).toBeInTheDocument();
    expect(screen.getByText(/1 artefacto/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Anular/ }));
    await waitFor(() => expect(restoreMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/restaurado a partir do lixo/i)).toBeInTheDocument();
  });

  it("surfaces history load errors", async () => {
    listMock.mockRejectedValue(
      new Error("O serviço de histórico de limpezas não está disponível nesta versão."),
    );
    render(<CleanupHistoryPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/histórico de limpezas/i);
  });
});
