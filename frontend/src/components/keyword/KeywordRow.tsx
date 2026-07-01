import { Keyword } from "../../types/keyword";

interface Props {
  keyword: Keyword;
  onToggle: (keyword: Keyword) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function KeywordRow({ keyword, onToggle, onDelete }: Props) {
  return (
    <tr>
      <td align="center">
        <input
          type="checkbox"
          checked={keyword.enabled}
          onChange={() => onToggle(keyword)}
        />
      </td>

      <td>{keyword.keyword}</td>

      <td>{new Date(keyword.created_at).toLocaleDateString()}</td>

      <td align="center">
        <button
          onClick={() => {
            if (confirm("삭제하시겠습니까?")) {
              onDelete(keyword.id);
            }
          }}
        >
          삭제
        </button>
      </td>
    </tr>
  );
}
