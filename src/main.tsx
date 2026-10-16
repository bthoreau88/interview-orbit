import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./styles/tokens.css";
import "./styles/app.css";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./routes/Dashboard";
import { History, NotFound } from "./routes/History";
import { Practice } from "./routes/Practice";
import { Recorder } from "./routes/Recorder";
import { Results } from "./routes/Results";
import { SessionDetail } from "./routes/SessionDetail";
import { DraftSessionProvider } from "./state/DraftSession";
import { SessionRepositoryProvider } from "./state/SessionRepository";

const root = document.getElementById("root");
if (!root) throw new Error("#root element missing");

createRoot(root).render(
  <StrictMode>
    <SessionRepositoryProvider>
      <DraftSessionProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="practice" element={<Practice />} />
              <Route path="record/:promptId" element={<Recorder />} />
              <Route path="results" element={<Results />} />
              <Route path="history" element={<History />} />
              <Route path="history/:sessionId" element={<SessionDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DraftSessionProvider>
    </SessionRepositoryProvider>
  </StrictMode>,
);
