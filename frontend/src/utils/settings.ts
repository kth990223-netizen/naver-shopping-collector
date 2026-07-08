const WEBHOOK_URL_KEY = "settings.webhookUrl";
const STALE_DAYS_KEY = "settings.staleDaysThreshold";

const DEFAULT_STALE_DAYS = 2;

export interface AppSettings {
  webhookUrl: string;
  staleDaysThreshold: number;
}

export function loadSettings(): AppSettings {
  return {
    webhookUrl: localStorage.getItem(WEBHOOK_URL_KEY) ?? "",
    staleDaysThreshold: Number(localStorage.getItem(STALE_DAYS_KEY)) || DEFAULT_STALE_DAYS,
  };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(WEBHOOK_URL_KEY, settings.webhookUrl);
  localStorage.setItem(STALE_DAYS_KEY, String(settings.staleDaysThreshold));
}
