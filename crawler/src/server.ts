import http from "node:http";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";
import { ALLOWED_DASHBOARD_ORIGINS, LOCAL_SERVER_PORT } from "./config/constants";

const CRAWLER_ROOT = path.resolve(__dirname, "..");

interface RunState {
  running: boolean;
  lastRunAt: string | null;
  lastError: string | null;
}

const state: RunState = {
  running: false,
  lastRunAt: null,
  lastError: null,
};

let child: ChildProcess | null = null;

/**
 * "수집 시작" 버튼을 누르면 이 서버 프로세스 안에서 조용히 수집하는 대신,
 * 새 cmd 창을 띄워서 그 안에서 `npm run chrome`(Chrome 디버깅 창 실행/로그인 세션 확인)
 * 다음 `npm run dev`(실제 수집)를 순서대로 직접 실행한다. 이미 Chrome이 떠있어도
 * 다시 실행하면 기존 프로필의 창을 새로 열 뿐이라 안전하다.
 * 캡차가 뜨면 사용자가 그 창에서 바로 Enter를 눌러 대응할 수 있고,
 * 진행 로그/최종 결과도 그 창에서 그대로 볼 수 있다.
 *
 * `npm run chrome`은 Chrome을 백그라운드로 띄우고 곧바로 반환되므로,
 * CDP 포트가 열릴 시간을 주기 위해 `npm run dev` 전에 짧은 지연을 둔다.
 *
 * `start /wait`로 띄워서 그 창이 완전히 닫힐 때까지 이 child의 exit을
 * 기다린다 (완료 여부 추적용). 안쪽 cmd는 `npm run dev` 실행 후 `pause`로
 * 잠깐 멈춰서 사용자가 결과를 읽고 아무 키나 눌러야 창이 닫히게 한다.
 */
function startCollectionWindow(): ChildProcess {
  // /D로 새 창의 시작 디렉터리를 crawler 루트로 명시한다 (start가 cwd를
  // 물려받는다는 가정에 기대지 않고, npm이 항상 crawler/package.json을
  // 찾도록 확실히 보장하기 위함).
  const command = `start /wait "네이버 쇼핑 수집" /D "${CRAWLER_ROOT}" cmd /c "npm run chrome && timeout /t 3 /nobreak >nul && npm run dev && pause"`;

  return spawn(command, {
    cwd: CRAWLER_ROOT,
    shell: true,
    windowsHide: false,
  });
}

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

    child = startCollectionWindow();

    child.on("error", (err) => {
      state.lastError = `수집 창을 여는 데 실패했습니다: ${err.message}`;
      state.running = false;
      child = null;
    });

    child.on("exit", (code) => {
      state.lastRunAt = new Date().toISOString();

      if (code !== 0) {
        state.lastError = `수집 창이 코드 ${code}로 종료됐습니다.`;
      }

      state.running = false;
      child = null;
    });

    return;
  }

  if (req.method === "POST" && req.url === "/shutdown") {
    if (state.running) {
      sendJson(res, 409, { error: "수집이 진행 중이라 서버를 종료할 수 없습니다." });
      return;
    }

    sendJson(res, 200, { status: "shutting down" });

    // 응답을 다 보낸 뒤에 종료해야 클라이언트가 200을 확실히 받는다.
    res.on("finish", () => {
      setTimeout(() => process.exit(0), 100);
    });

    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(LOCAL_SERVER_PORT, "127.0.0.1", () => {
  console.log(`크롤러 로컬 서버 실행 중: http://localhost:${LOCAL_SERVER_PORT}`);
  console.log(`대시보드의 "수집 시작" 버튼을 누르면 새 cmd 창에서 npm run chrome → npm run dev가 순서대로 실행됩니다.`);
  console.log(`(최초 1회는 그 창에서 직접 네이버 로그인이 필요합니다.)`);
});
