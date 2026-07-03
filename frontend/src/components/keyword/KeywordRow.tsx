import type { Keyword } from "../../types/keyword";

interface Props {
  keyword: Keyword;
  onToggle: (keyword: Keyword) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function KeywordRow({ keyword, onToggle, onDelete }: Props) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={keyword.enabled}
          onChange={() => onToggle(keyword)}
          className="h-4 w-4 accent-blue-600"
        />
      </td>

      <td className="px-4 py-3 text-sm text-slate-800">{keyword.keyword}</td>

      <td className="px-4 py-3 text-center text-sm text-slate-500">
        {new Date(keyword.created_at).toLocaleDateString()}
      </td>

      <td className="px-4 py-3 text-center">
        <button
          onClick={() => {
            if (confirm("삭제하시겠습니까?")) {
              onDelete(keyword.id);
            }
          }}
          className="text-sm font-medium text-red-500 hover:text-red-700"
        >
          삭제
        </button>
      </td>
    </tr>
  );
}
