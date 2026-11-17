// 最小可部署的 Node.js Web 服务
// 要点：监听平台注入的 PORT，并绑定 0.0.0.0（否则容器外访问不到，表现为 502）
const http = require("node:http");

const port = process.env.PORT || 3000;
const host = "0.0.0.0";

const startedAt = new Date();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // 健康检查：平台或你自己用来探活
  if (url.pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, uptime: process.uptime() }));
    return;
  }

  // 一个 JSON 接口示例
  if (url.pathname === "/api/hello") {
    const name = url.searchParams.get("name") || "world";
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify(
        {
          message: `Hello, ${name}!`,
          time: new Date().toISOString(),
          startedAt: startedAt.toISOString(),
          uptimeSeconds: Math.round(process.uptime()),
          node: process.version,
        },
        null,
        2
      )
    );
    return;
  }

  // 首页：把当前运行信息直接渲染出来，方便确认部署成功
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Abasthan · Node.js is running</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
    background: #0b0f19; color: #e6e9ef; padding: 24px;
  }
  .card {
    width: 100%; max-width: 620px; background: #131a29; border: 1px solid #243049;
    border-radius: 16px; padding: 32px 28px; box-shadow: 0 24px 60px rgba(0,0,0,.45);
  }
  h1 { margin: 0 0 6px; font-size: 22px; display: flex; align-items: center; gap: 10px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 12px #22c55e; }
  p.sub { margin: 0 0 22px; color: #93a0b8; font-size: 14px; }
  dl { margin: 0; display: grid; grid-template-columns: 128px 1fr; gap: 10px 16px; font-size: 14px; }
  dt { color: #93a0b8; }
  dd { margin: 0; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; color: #d7e2f7; word-break: break-all; }
  .links { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
  a {
    display: inline-block; padding: 8px 14px; border-radius: 8px; font-size: 13px;
    text-decoration: none; color: #cfe0ff; background: #1b2740; border: 1px solid #2b3a5c;
  }
  a:hover { background: #23304e; }
  footer { margin-top: 22px; font-size: 12px; color: #6b7789; }
</style>
</head>
<body>
  <main class="card">
    <h1><span class="dot"></span> Node.js 服务已启动</h1>
    <p class="sub">如果这行字你能在公网域名上看到，说明部署成功。</p>
    <dl>
      <dt>Node 版本</dt><dd>${process.version}</dd>
      <dt>监听端口</dt><dd>${port}</dd>
      <dt>启动时间</dt><dd>${startedAt.toISOString()}</dd>
      <dt>已运行</dt><dd>${Math.round(process.uptime())} 秒</dd>
      <dt>当前时间</dt><dd>${new Date().toISOString()}</dd>
      <dt>请求路径</dt><dd>${url.pathname}</dd>
    </dl>
    <div class="links">
      <a href="/api/hello?name=Abasthan">/api/hello</a>
      <a href="/healthz">/healthz</a>
    </div>
    <footer>Free 档连续 90 分钟无流量会休眠，下次访问需等冷启动。</footer>
  </main>
</body>
</html>`;

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(port, host, () => {
  console.log(`[startup] listening on http://${host}:${port} (Node ${process.version})`);
});

// 优雅退出：平台停容器时会发 SIGTERM，先关连接再退出，避免部署被强制杀掉
function shutdown(signal) {
  console.log(`[shutdown] received ${signal}, closing server...`);
  server.close(() => {
    console.log("[shutdown] server closed");
    process.exit(0);
  });
  // 兜底：5 秒内没关干净就强退
  setTimeout(() => {
    console.error("[shutdown] forced exit after timeout");
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// 兜底：未捕获异常打日志，不要静默退出
process.on("unhandledRejection", (err) => {
  console.error("[fatal] unhandledRejection:", err);
});
