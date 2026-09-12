# D3 Chart Studio

一個 JSON 設定驅動的 D3.js 圖表產生器，前後端皆為個人重新設計實作的練習專案，用來練習並展示：Docker 容器化、GitHub Actions CI/CD、部署到 Google Cloud Run。

> 這是一個從零重寫的個人 side project，不包含任何前雇主的原始程式碼。功能構想（JSON 設定驅動產生客製化圖表）來自個人過往工作經驗的啟發，實作內容為全新撰寫。

## 功能

- 支援長條圖、圓餅圖、氣泡圖、折線圖，皆由 JSON 設定驅動
- 純前端使用 D3.js v7 渲染圖表，含互動 Tooltip
- 後端 Express API 提供設定驗證（`/api/charts/validate`）與範例資料（`/api/charts/samples`）
- 已容器化（Dockerfile），可在任何支援 Docker 的環境執行
- 內建 GitHub Actions Workflow：push 到 `main` 分支即自動建置映像檔並部署到 Google Cloud Run

## 本機執行

```bash
npm install
npm start
# 開啟 http://localhost:8080
```

## 用 Docker 執行

```bash
docker build -t d3-chart-studio .
docker run -p 8080:8080 d3-chart-studio
# 開啟 http://localhost:8080
```

## 專案結構

```
d3-chart-studio/
├── src/
│   ├── server/index.js        # Express API（健康檢查、驗證、範例資料）
│   └── public/
│       ├── index.html         # 前端頁面（JSON編輯器＋預覽）
│       └── chart-engine.js    # D3.js圖表渲染引擎（原創實作）
├── Dockerfile
├── .dockerignore
├── .github/workflows/deploy.yml   # CI/CD：build → push → deploy to Cloud Run
└── DEPLOY_GUIDE.md             # 部署到 GCP Cloud Run 的完整操作手冊
```

## 技術棧

Node.js、Express、D3.js v7、Docker、GitHub Actions、Google Cloud Run、Artifact Registry

## 部署

完整的雲端部署步驟（含 GCP 帳號設定、GitHub Secrets 設定）請見 [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md)。
