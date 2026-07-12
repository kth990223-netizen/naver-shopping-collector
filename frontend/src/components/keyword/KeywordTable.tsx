import { useEffect, useRef } from "react";

import KeywordRow from "./KeywordRow";
import type { Keyword } from "../../types/keyword";

interface Props {
  keywords: Keyword[];
  onDelete: (id: string) => Promise<void>;
  onToggle: (keyword: Keyword) => Promise<void>;
  onToggleAll: (enabled: boolean) => Promise<void>;
  readOnly?: boolean;
}

export default function KeywordTable({
  keywords,
  onDelete,
  onToggle,
  onToggleAll,
  readOnly = false,
}: Props) {
  const allEnabled = keywords.length > 0 && keywords.every((k) => k.enabled);
  const someEnabled = keywords.some((k) => k.enabled);

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someEnabled && !allEnabled;
    }
  }, [someEnabled, allEnabled]);

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="w-20 px-4 py-3 text-center">
              <span className="inline-flex items-center gap-1.5">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allEnabled}
                  disabled={readOnly || keywords.length === 0}
                  onChange={() => onToggleAll(!allEnabled)}
                  aria-label="전체 사용 설정/해제"
                  title="전체 사용 설정/해제"
                  className="h-4 w-4 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                />
                사용
              </span>
            </th>
            <th className="px-4 py-3 text-left">키워드</th>
            <th className="w-44 px-4 py-3 text-center">등록일</th>
            <th className="w-24 px-4 py-3 text-center">삭제</th>
          </tr>
        </thead>

        <tbody>
          {keywords.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
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
                readOnly={readOnly}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
