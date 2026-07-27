import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../shared/layouts/AdminLayout";
import { AuthProvider } from "../features/auth/contexts/AuthProvider";

import DashboardPage from "../features/dashboard/pages/DashboardPage";
import KeywordPage from "../features/keyword/pages/KeywordPage";
import BrandChangePage from "../features/brandChange/pages/BrandChangePage";
import SettingPage from "../features/setting/pages/SettingPage";
import ResultPage from "../features/result/pages/ResultPage";
import LoginPage from "../features/auth/pages/LoginPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="keywords" element={<KeywordPage />} />
          <Route path="results" element={<ResultPage />} />
          {/* brands 라우트는 PostgREST 1000행 캡에 걸려 브랜드 수가 잘려 보이는 문제로 임시 비활성화 (BrandPage.tsx는 보존) */}
          <Route path="brand-changes" element={<BrandChangePage />} />
          <Route path="settings" element={<SettingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
