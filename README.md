# abasthan-app

最小可部署的 Node.js Web 服务，用于 Abasthan 免费档（Free / First app free）。

无任何第三方依赖，只用 Node 内置模块，所以安装阶段不会因为 npm 网络问题失败。

## 本地运行

```bash
node index.js
# 打开 http://localhost:3000
```

如果本机想换端口：

```bash
# PowerShell
$env:PORT=8080; node index.js
# bash
PORT=8080 node index.js
```

## 路由

| 路径 | 说明 |
|---|---|
| `/` | 一个 HTML 页面，显示 Node 版本、端口、启动时间、运行时长 |
| `/api/hello?name=xxx` | 返回 JSON 示例接口 |
| `/healthz` | 健康检查，返回 `{"ok":true,"uptime":...}` |

## 部署到 Abasthan 时各字段怎么填

| 字段 | 值 |
|---|---|
| Source Code | 你的仓库（如 `binceo/Abasthan`） |
| App Language | `Node.js` |
| Runtime Version | `22`（或 20 / 18，都兼容） |
| Branch | `main` |
| Name | 子域名前缀，全小写，如 `myapp` → `myapp.abasthan.app` |
| Project | 留空即可 |
| Root Directory | **留空**（index.js 和 package.json 在仓库根目录） |
| Build Command | `npm install` |
| Start Command | `npm start` |

### 为什么 Build Command 只写 `npm install`

这个项目没有依赖也没有打包步骤。如果写成 `npm install && npm run build`，`build` 脚本虽然存在（是个 echo），但多一步没有任何收益。想保持和平台默认一致，写成 `npm install && npm run build` 也能成功。

## 关键约束（已在本项目里处理好）

- **端口**：监听 `process.env.PORT`，默认回退 3000 —— 不能写死端口
- **绑定地址**：`0.0.0.0` —— 只绑 `127.0.0.1` 会导致容器外访问不到（表现为 502）
- **优雅退出**：监听 `SIGTERM` / `SIGINT`，部署滚动替换时不会被强杀
- **日志**：全部输出到 stdout，平台可实时抓取

## 注意事项

- Free 档连续 **90 分钟无流量会休眠**，下次访问需冷启动（第一个访客会看到加载页），属正常现象
- 每个账号只有**第一个应用免费**，这个应用建好后再建第二个要付费（Starter $5/月起）
- 想彻底停止计费就把服务停掉，而不是让它闲置
