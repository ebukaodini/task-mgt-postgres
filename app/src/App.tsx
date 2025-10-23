import { Route, Routes } from "react-router-dom";
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Layout from "./components/layouts/Layout";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId/tasks" element={<Tasks />} />
      </Route>
    </Routes>
  );
}

export default App;
