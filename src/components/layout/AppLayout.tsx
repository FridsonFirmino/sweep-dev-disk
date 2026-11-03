import { CircleUserRound, HardDrive, LayoutDashboard, Settings } from "lucide-react";
import type { ReactNode } from "react";

export type AppPage = "overview" | "settings" | "about";

interface AppLayoutProps {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  children: ReactNode;
}

export function AppLayout({ page, onNavigate, children }: AppLayoutProps) {
  return (
    <div className="flex h-dvh min-w-[900px] overflow-hidden bg-background font-sans text-foreground">
      <aside className="flex h-full w-[208px] shrink-0 flex-col border-r border-border bg-sidebar px-3 py-4">
        <div className="mb-8 flex h-9 items-center gap-2.5 px-2">
          <HardDrive className="size-6 text-primary" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight">SweepDevDisk</span>
        </div>
        <nav aria-label="Navegação principal" className="flex flex-col gap-1">
          <NavItem
            active={page === "overview"}
            icon={<LayoutDashboard className="size-4" />}
            label="Visão geral"
            onClick={() => onNavigate("overview")}
          />
          {/* <div className="my-1" /> */}
          <NavItem
            active={page === "settings"}
            icon={<Settings className="size-4" />}
            label="Definições"
            onClick={() => onNavigate("settings")}
          />
          <NavItem
            active={page === "about"}
            icon={<CircleUserRound className="size-4" />}
            label="Acerca de"
            onClick={() => onNavigate("about")}
          />
        </nav>
        <div className="mt-auto border-t border-border pt-3">
          <p className="px-2 pb-1 pt-4 text-[11px] text-muted">Versão 0.1.0</p>
        </div>
      </aside>
      <main className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`flex h-9 items-center gap-3 rounded-md px-2.5 text-left text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        active
          ? "bg-selected font-medium text-foreground"
          : "text-secondary hover:bg-hover hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
