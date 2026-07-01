import { useEffect, useState } from "react";
import {
  addKeyword,
  deleteKeyword,
  getKeywords,
  updateKeywordEnabled,
} from "../services/keywordService";
import { Keyword } from "../types/keyword";

export default function KeywordPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadKeywords() {
    try {
      const list = await getKeywords();
      setKeywords(list);
    } catch (err) {
      console.error(err);
      alert("키워드 조회 실패");
    }
  }

  useEffect(() => {
    loadKeywords();
  }, []);

  async function handleAdd() {
    if (loading) return;

    const value = keyword.trim();

    if (!value) {
      alert("키워드를 입력하세요.");
      return;
    }

    if (keywords.some((k) => k.keyword.toLowerCase() === value.toLowerCase())) {
      alert("이미 등록된 키워드입니다.");
      return;
    }

    try {
      setLoading(true);

      await addKeyword(value);

      setKeyword("");

      await loadKeywords();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;

    try {
      await deleteKeyword(id);
      await loadKeywords();
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  }

  async function handleToggle(item: Keyword) {
    try {
      await updateKeywordEnabled(item.id, !item.enabled);

      await loadKeywords();
    } catch (err) {
      console.error(err);
      alert("수정 실패");
    }
  }

  return (
    <div>
      <h1>키워드 관리</h1>

      <div
        style={{
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAdd();
            }
          }}
          placeholder="키워드를 입력하세요."
        />

        <button onClick={handleAdd} disabled={loading}>
          추가
        </button>
      </div>

      <table
        border={1}
        cellPadding={10}
        style={{
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            <th>사용</th>
            <th>키워드</th>
            <th>등록일</th>
            <th>삭제</th>
          </tr>
        </thead>

        <tbody>
          {keywords.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={() => handleToggle(item)}
                />
              </td>

              <td>{item.keyword}</td>

              <td>{new Date(item.created_at).toLocaleDateString()}</td>

              <td>
                <button onClick={() => handleDelete(item.id)}>삭제</button>
              </td>
            </tr>
          ))}

          {keywords.length === 0 && (
            <tr>
              <td colSpan={4} align="center">
                등록된 키워드가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
