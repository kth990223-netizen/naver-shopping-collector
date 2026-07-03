import { useState } from "react";

interface KeywordFormProps {
  onAdd: (keyword: string) => Promise<void>;
  loading: boolean;
}

export default function KeywordForm({ onAdd, loading }: KeywordFormProps) {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = async () => {
    const value = keyword.trim();

    if (!value) {
      alert("키워드를 입력하세요.");
      return;
    }

    await onAdd(value);
    setKeyword("");
  };

  return (
    <div className="mb-5 flex gap-2">
      <input
        value={keyword}
        placeholder="키워드를 입력하세요."
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
        className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        추가
      </button>
    </div>
  );
}
