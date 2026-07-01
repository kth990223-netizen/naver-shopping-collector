import { Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";

import DashboardPage from "./pages/DashboardPage";
import KeywordPage from "./pages/KeywordPage";
import CollectPage from "./pages/CollectPage";
import BrandPage from "./pages/BrandPage";
import SettingPage from "./pages/SettingPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="keywords" element={<KeywordPage />} />
        <Route path="collect" element={<CollectPage />} />
        <Route path="brands" element={<BrandPage />} />
        <Route path="settings" element={<SettingPage />} />
      </Route>
    </Routes>
  );
}

export default App;