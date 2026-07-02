import KeywordRow from "./KeywordRow";
import type { Keyword } from "../../types/keyword";

interface Props {
  keywords: Keyword[];
  onDelete: (id: string) => Promise<void>;
  onToggle: (keyword: Keyword) => Promise<void>;
}

export default function KeywordTable({ keywords, onDelete, onToggle }: Props) {
  return (
    <table
      border={1}
      cellPadding={10}
      style={{
        width: "100%",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th width="80">사용</th>
          <th>키워드</th>
          <th width="180">등록일</th>
          <th width="100">삭제</th>
        </tr>
      </thead>

      <tbody>
        {keywords.length === 0 ? (
          <tr>
            <td colSpan={4} align="center">
              등록된 키워드가 없습니다.
            </td>
          </tr>
        ) : (
          keywords.map((item) => (
            <KeywordRow
              key={item.id}
              keyword={item}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
