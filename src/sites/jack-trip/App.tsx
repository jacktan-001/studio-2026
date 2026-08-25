import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Itinerary from "./pages/Itinerary";
import Expense from "./pages/Expense";
import Guide from "./pages/Guide";
import Members from "./pages/Members";
import Packing from "./pages/Packing";
import Vote from "./pages/Vote";
import MapPage from "./pages/MapPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trip" element={<Itinerary />} />
        <Route path="/expense" element={<Expense />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/members" element={<Members />} />
        <Route path="/list" element={<Packing />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
