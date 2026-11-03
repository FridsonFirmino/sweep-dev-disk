import App from "@/App";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("shows the initial overview", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Visão geral" })).toBeInTheDocument();
    expect(screen.getByText("Ainda não foram analisados projectos")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Analisar projectos" })).toHaveLength(2);
  });

  it("opens settings and changes the theme preference", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Definições" }));
    expect(screen.getByRole("heading", { name: "Definições" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Claro/ }));
    expect(screen.getByRole("radio", { name: /Claro/ })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("shows clearly labelled development fixture results", () => {
    window.history.replaceState({}, "", "/?demo=results");
    render(<App />);
    expect(screen.getByText(/Dados de demonstração/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Projectos" })).toBeInTheDocument();
    expect(screen.getByText("notes-app")).toBeInTheDocument();
    window.history.replaceState({}, "", "/");
  });

  it("opens About and displays system and developer information", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Acerca de" }));
    expect(screen.getByRole("heading", { name: "Acerca de" })).toBeInTheDocument();
    expect(screen.getByText("Informações do sistema")).toBeInTheDocument();
    expect(screen.getByText("Fridson Firmino")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/FridsonFirmino",
    );
  });

  it("shows scan errors from the development fixture", async () => {
    window.history.replaceState({}, "", "/?demo=error");
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Analisar projectos" })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /o acesso à pasta seleccionada foi recusado/,
    );
    window.history.replaceState({}, "", "/");
  });
});
