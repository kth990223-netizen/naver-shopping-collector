import { useState } from "react";
import { loadSettings, saveSettings, type AppSettings } from "../utils/settings";
import { sendWebhookNotification } from "../utils/notify";

export default function SettingPage() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    if (!settings.webhookUrl) return;

    setTesting(true);
    setTestResult(null);

    try {
      await sendWebhookNotification(settings.webhookUrl, "네이버 쇼핑 수집기 - 테스트 알림입니다.");
      setTestResult("전송했습니다. 채널을 확인하세요.");
    } catch (err) {
      setTestResult(`전송 실패: ${(err as Error).message}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">설정</h1>
      <p className="mt-2 mb-6 text-sm text-slate-500">
        아래 설정은 이 브라우저에만 저장됩니다(다른 기기/브라우저에서는 다시 설정해야 합니다).
      </p>

      <div className="max-w-xl space-y-6 rounded-xl bg-white p-6 shadow">
        <div>
          <label className="block text-sm font-semibold text-slate-700">알림 웹훅 URL</label>
          <p className="mt-1 text-xs text-slate-400">
            수집이 끝나면(성공/실패 모두) 이 주소로 알림을 보냅니다. Discord 채널의 "연동 → 웹후크"에서
            만든 URL을 붙여넣으면 됩니다. 비워두면 알림을 보내지 않습니다.
          </p>
          <input
            type="text"
            value={settings.webhookUrl}
            onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
            placeholder="https://discord.com/api/webhooks/..."
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={!settings.webhookUrl || testing}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testing ? "전송 중..." : "테스트 알림 보내기"}
            </button>
            {testResult && <span className="text-xs text-slate-500">{testResult}</span>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700">미수집 경고 기준일</label>
          <p className="mt-1 text-xs text-slate-400">
            마지막 수집 이후 이 기간(일)이 지나면 대시보드에 경고를 표시합니다.
          </p>
          <input
            type="number"
            min={1}
            value={settings.staleDaysThreshold}
            onChange={(e) =>
              setSettings({ ...settings, staleDaysThreshold: Math.max(1, Number(e.target.value) || 1) })
            }
            className="mt-2 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            저장
          </button>
          {saved && <span className="text-sm text-emerald-600">저장되었습니다.</span>}
        </div>
      </div>
    </div>
  );
}
