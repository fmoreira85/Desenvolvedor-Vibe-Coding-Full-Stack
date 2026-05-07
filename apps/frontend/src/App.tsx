import { Navigate, Route, Routes } from "react-router-dom";

import { RouteGuards } from "./components/auth/RouteGuards";
import { AppShell } from "./components/layout/AppShell";
import { AuthPage } from "./pages/AuthPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage } from "./pages/LeadsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WorkspacePage } from "./pages/WorkspacePage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <RouteGuards.PublicOnly>
            <AuthPage />
          </RouteGuards.PublicOnly>
        }
      />

      <Route
        path="/workspaces"
        element={
          <RouteGuards.Authenticated>
            <WorkspacePage />
          </RouteGuards.Authenticated>
        }
      />

      <Route
        path="/"
        element={
          <RouteGuards.WorkspaceSelected>
            <AppShell />
          </RouteGuards.WorkspaceSelected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
