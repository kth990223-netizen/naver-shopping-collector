import { Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import { AuthProvider } from "./contexts/AuthContext";

import DashboardPage from "./pages/DashboardPage";
import KeywordPage from "./pages/KeywordPage";
import BrandPage from "./pages/BrandPage";
import BrandChangePage from "./pages/BrandChangePage";
import SettingPage from "./pages/SettingPage";
import ResultPage from "./pages/ResultPage";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="keywords" element={<KeywordPage />} />
          <Route path="results" element={<ResultPage />} />
          <Route path="brands" element={<BrandPage />} />
          <Route path="brand-changes" element={<BrandChangePage />} />
          <Route path="settings" element={<SettingPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
