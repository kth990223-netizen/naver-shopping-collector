export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">총 키워드</h2>
          <p className="mt-3 text-3xl font-bold">0</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">총 브랜드</h2>
          <p className="mt-3 text-3xl font-bold">0</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">오늘 수집</h2>
          <p className="mt-3 text-3xl font-bold">0</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">최근 수집</h2>
          <p className="mt-3 text-lg font-semibold">-</p>
        </div>
      </div>
    </>
  );
}
