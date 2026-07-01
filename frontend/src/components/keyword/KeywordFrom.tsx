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
    <div style={{ marginBottom: 20 }}>
      <input
        value={keyword}
        placeholder="키워드를 입력하세요."
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ marginLeft: 10 }}
      >
        추가
      </button>
    </div>
  );
}
