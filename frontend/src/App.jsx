import { Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FlowBuilder from "./pages/FlowBuilder";
import Devices from "./pages/Devices";
import { useEffect } from 'react';
import { alerts$ } from './rule-engine/pipeline.js';

function App() {
  useEffect(() => {
    const subscription = alerts$.subscribe((alert) => {
      console.log(alert);
    });

    return () => subscription.unsubscribe();
  }, []);
  return (
    <>
      <nav>
        <Link to="/">Dashboard</Link>{" "}
        <Link to="/flow-builder">Flow Builder</Link>{" "}
        <Link to="/devices">Devices</Link>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/flow-builder" element={<FlowBuilder />} />
          <Route path="/devices" element={<Devices />} />
        </Routes>
      </main>
    </>
  );
}

export default App;