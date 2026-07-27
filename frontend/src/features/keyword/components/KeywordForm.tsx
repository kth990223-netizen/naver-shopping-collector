import { useState } from "react";

interface KeywordFormProps {
  onAdd: (keywords: string[]) => Promise<void>;
  loading: boolean;
}

export default function KeywordForm({ onAdd, loading }: KeywordFormProps) {
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    const values = text
      .split(/[\n,]+/)
      .map((v) => v.trim())
      .filter(Boolean);

    if (values.length === 0) {
      alert("키워드를 입력하세요.");
      return;
    }

    await onAdd(values);
    setText("");
  };

  return (
    <div className="mb-5 flex gap-2">
      <textarea
        value={text}
        placeholder="키워드를 입력하세요. 여러 개는 줄바꿈이나 쉼표(,)로 구분해서 붙여넣을 수 있습니다."
        onChange={(e) => setText(e.target.value)}
        rows={1}
        className="w-96 resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="h-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        추가
      </button>
    </div>
  );
}
