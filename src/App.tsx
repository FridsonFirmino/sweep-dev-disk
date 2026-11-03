import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { AboutPage } from "@/features/about/AboutPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";

function App() {
  const [page, setPage] = useState<AppPage>("overview");
  const { preference, setPreference } = useTheme();

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
