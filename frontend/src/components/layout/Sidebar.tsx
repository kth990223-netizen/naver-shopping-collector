import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const menus = [
  { name: "📊 대시보드", path: "/" },
  { name: "🔍 키워드 관리", path: "/keywords" },
  { name: "📈 브랜드 변동", path: "/brand-changes" },
  { name: "📦 수집 결과", path: "/results" },
  { name: "⚙ 설정", path: "/settings" },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">Naver Shopping Collector</h1>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            end={menu.path === "/"}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 transition ${
                isActive ? "bg-blue-600" : "hover:bg-slate-800"
              }`
            }
          >
            {menu.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 p-4 text-sm">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-slate-300" title={user.email}>
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="shrink-0 text-slate-400 hover:text-white"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="block text-slate-400 hover:text-white">
            로그인 (조회는 로그인 없이 가능)
          </NavLink>
        )}
      </div>
    </aside>
  );
}
