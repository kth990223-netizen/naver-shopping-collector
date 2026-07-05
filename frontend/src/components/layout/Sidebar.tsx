import { NavLink } from "react-router-dom";

const menus = [
  { name: "📊 대시보드", path: "/" },
  { name: "🔍 키워드 관리", path: "/keywords" },
  { name: "📈 브랜드 변동", path: "/brand-changes" },
  { name: "📦 수집 결과", path: "/results" },
  { name: "🏷 브랜드 관리", path: "/brands" },
  { name: "⚙ 설정", path: "/settings" },
];

export default function Sidebar() {
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
    </aside>
  );
}
