import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/devices";
import FlowBuilder from "./pages/FlowBuilder";
import { AlertsProvider } from "./alerts/AlertsProvider.jsx";
import "./App.css";

function App() {
  return (
    <AlertsProvider>
      <>
        <nav className="app-toplevel-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>

          <NavLink to="/flow-builder">
            Flow Builder
          </NavLink>

          <NavLink to="/devices">
            Devices
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/flow-builder" element={<FlowBuilder />} />
          <Route path="/devices" element={<Devices />} />
        </Routes>
      </>
    </AlertsProvider>
  );
}

export default App;
