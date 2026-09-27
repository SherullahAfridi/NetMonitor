import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Network from "./pages/Network";
import Alerts from "./pages/Alerts";
import ThreatDetection from "./pages/ThreatDetection";
import Events from "./pages/Events";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/network"
            element={<Network />}
          />

          <Route
            path="/assets"
            element={<Assets />}
          />

          <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/threats"
            element={<ThreatDetection />}
          />

          <Route
            path="/events"
            element={<Events />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;