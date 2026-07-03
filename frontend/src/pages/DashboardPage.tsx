import { useDashboardStats } from "../hooks/useDashboardStats";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  const lastCollected =
    data?.lastCollectedAt && data?.lastCollectedKeyword
      ? `${data.lastCollectedKeyword} · ${new Date(data.lastCollectedAt).toLocaleString()}`
      : "-";

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">총 키워드</h2>
          <p className="mt-3 text-3xl font-bold">
            {isLoading ? "-" : data?.totalKeywords ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">총 브랜드</h2>
          <p className="mt-3 text-3xl font-bold">
            {isLoading ? "-" : data?.totalBrands ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">오늘 수집</h2>
          <p className="mt-3 text-3xl font-bold">
            {isLoading ? "-" : data?.todayCollectedCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">최근 수집</h2>
          <p className="mt-3 text-lg font-semibold">
            {isLoading ? "-" : lastCollected}
          </p>
        </div>
      </div>
    </>
  );
}
