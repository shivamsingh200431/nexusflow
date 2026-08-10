import { Link, Route, Routes } from "react-router-dom";

function Dashboard() {
  return <h1>Dashboard</h1>;
}

function FlowBuilder() {
  return <h1>Flow Builder</h1>;
}

function Devices() {
  return <h1>Devices</h1>;
}

function App() {
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