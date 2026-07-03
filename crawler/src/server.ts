import http from "node:http";
import { runCollection } from "./collectAll";
import { ALLOWED_DASHBOARD_ORIGINS, LOCAL_SERVER_PORT } from "./config/constants";

interface RunState {
  running: boolean;
  lastRunAt: string | null;
  lastResult: { keywordCount: number; totalAds: number } | null;
  lastError: string | null;
}

const state: RunState = {
  running: false,
  lastRunAt: null,
  lastResult: null,
  lastError: null,
};

function applyCors(req: http.IncomingMessage, res: http.ServerResponse) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_DASHBOARD_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/status") {
    sendJson(res, 200, state);
    return;
  }

  if (req.method === "POST" && req.url === "/collect") {
    if (state.running) {
      sendJson(res, 409, { error: "이미 수집이 진행 중입니다." });
      return;
    }

    state.running = true;
    state.lastError = null;

    sendJson(res, 202, { status: "started" });

    runCollection()
      .then((summary) => {
        state.lastResult = summary;
        state.lastRunAt = new Date().toISOString();
      })
      .catch((err) => {
        state.lastError = (err as Error).message;
        console.error("수집 실패:", err);
      })
      .finally(() => {
        state.running = false;
      });

    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(LOCAL_SERVER_PORT, "127.0.0.1", () => {
  console.log(`크롤러 로컬 서버 실행 중: http://localhost:${LOCAL_SERVER_PORT}`);
  console.log(`대시보드의 "수집 시작" 버튼이 이 서버로 요청을 보냅니다.`);
  console.log(`(먼저 "npm run chrome"으로 Chrome을 띄우고 로그인해두세요.)`);
});
