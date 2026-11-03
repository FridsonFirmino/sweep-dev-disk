import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "@/App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("shows the initial overview", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("No projects scanned yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Scan projects" })).toHaveLength(2);
  });

  it("opens settings and changes the theme preference", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Light/ }));
    expect(screen.getByRole("radio", { name: /Light/ })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("shows clearly labelled development fixture results", () => {
    window.history.replaceState({}, "", "/?demo=results");
    render(<App />);
    expect(screen.getByText(/Development demo data/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("notes-app")).toBeInTheDocument();
    window.history.replaceState({}, "", "/");
  });

  it("opens About and displays system and developer information", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "About" }));
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.getByText("System information")).toBeInTheDocument();
    expect(screen.getByText("Fridson Firmino")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/FridsonFirmino",
    );
  });

  it("shows scan errors from the development fixture", async () => {
    window.history.replaceState({}, "", "/?demo=error");
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Scan projects" })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /access to the selected folder was denied/,
    );
    window.history.replaceState({}, "", "/");
  });
});
