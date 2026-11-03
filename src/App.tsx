import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { AboutPage } from "@/features/about/AboutPage";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";

function App() {
  const [page, setPage] = useState<AppPage>("overview");
  const { preference, setPreference } = useTheme();

  useEffect(() => {
    const bootScreen = document.getElementById("boot-screen");
    if (!bootScreen) return;

    const timeout = window.setTimeout(() => bootScreen.remove(), 3500);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AppLayout page={page} onNavigate={setPage}>
      {page === "overview" ? (
        <OverviewPage />
      ) : page === "settings" ? (
        <SettingsPage preference={preference} onPreferenceChange={setPreference} />
      ) : (
        <AboutPage />
      )}
    </AppLayout>
  );
}

export default App;
