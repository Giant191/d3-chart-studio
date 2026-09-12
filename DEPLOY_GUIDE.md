# 部署操作手冊：GitHub + GCP Cloud Run

這份手冊是給你自己在電腦上操作的步驟，因為推送到你的GitHub帳號、部署到你的GCP帳號，都需要你自己的帳密權限，我沒辦法代替你操作。跟著做，順序不要跳過。全部指令都是複製貼上就能用，`<...>` 包起來的地方要換成你自己的資料。

---

## 前置準備

1. 一個Google帳號（用來開GCP帳號，免費）
2. 電腦上安裝：
   - [Git](https://git-scm.com/downloads)
   - [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/docs/install)
   - Docker Desktop（非必要，只有想在自己電腦先測試容器時才需要）

---

## 步驟一：先在本機確認專案能跑（可跳過，但建議做）

```bash
cd d3-chart-studio
npm install
npm start
```

瀏覽器開 http://localhost:8080 ，應該看到「D3 Chart Studio」頁面，點範例按鈕會出現圖表，代表前後端都正常。按 Ctrl+C 關掉。

---

## 步驟二：建立GCP專案並開通必要服務

```bash
# 登入你的Google帳號
gcloud auth login

# 建立一個新的GCP專案（專案ID全球唯一，自己取一個，例如加上你的名字縮寫）
gcloud projects create d3-chart-studio-wyatt --name="D3 Chart Studio"

# 設定成目前操作的專案
gcloud config set project d3-chart-studio-wyatt

# 【重要】GCP新帳號通常有免費試用額度，但仍需要綁定一張信用卡才能啟用付費API
# Cloud Run本身有免費額度（每月200萬次請求），只要你沒有超過額度就不會被收費
# 開啟以下網址完成帳單帳戶設定：https://console.cloud.google.com/billing

# 開通這個專案要用到的API
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

---

## 步驟三：建立Artifact Registry（存放Docker映像檔的倉庫）

```bash
gcloud artifacts repositories create d3-chart-studio-repo \
  --repository-format=docker \
  --location=asia-east1 \
  --description="D3 Chart Studio container images"
```

---

## 步驟四：先手動部署一次，確認流程沒問題

這一步先不透過GitHub Actions，直接用gcloud指令部署一次，確認GCP那邊設定都是對的：

```bash
gcloud run deploy d3-chart-studio \
  --source . \
  --region asia-east1 \
  --allow-unauthenticated \
  --port 8080
```

跑完之後終端機會印出一個網址，類似 `https://d3-chart-studio-xxxxx-de.a.run.app`，打開它應該就能看到你的網站正式跑在雲端上了。**這個網址可以直接放進履歷或作品集PPT裡。**

---

## 步驟五：把專案推上GitHub

```bash
cd d3-chart-studio
git init
git add .
git commit -m "D3 Chart Studio: JSON驅動的D3.js圖表產生器，含Docker與CI/CD"
```

到 https://github.com/new 建立一個新的repository（例如取名 `d3-chart-studio`），**不要**勾選自動加README，建立好之後：

```bash
git remote add origin https://github.com/<你的帳號>/d3-chart-studio.git
git branch -M main
git push -u origin main
```

---

## 步驟六：設定GitHub Actions要用的認證（讓GitHub能自動部署到你的GCP）

建立一組服務帳戶（Service Account）給GitHub Actions專用：

```bash
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer"

# 把你的專案ID記下來，等等會用到
gcloud config get-value project
```

給這個服務帳戶足夠的權限：

```bash
PROJECT_ID=$(gcloud config get-value project)

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

產生這個服務帳戶的金鑰檔案（給GitHub用）：

```bash
gcloud iam service-accounts keys create github-deployer-key.json \
  --iam-account=github-deployer@${PROJECT_ID}.iam.gserviceaccount.com
```

這會在你電腦上產生一個 `github-deployer-key.json` 檔案，**這個檔案不要放進git、不要公開分享**，等一下會貼進GitHub的Secrets設定裡就好，貼完之後這個檔案可以刪掉。

---

## 步驟七：在GitHub設定Secrets

到你的GitHub repository頁面 → Settings → Secrets and variables → Actions → New repository secret，新增兩組：

| Secret名稱 | 值 |
|---|---|
| `GCP_PROJECT_ID` | 你的GCP專案ID（前面`gcloud config get-value project`印出來的那個） |
| `GCP_SA_KEY` | 打開 `github-deployer-key.json`，把整個檔案內容複製貼上 |

設定完成後，`github-deployer-key.json` 這個檔案就可以從你電腦上刪除了。

---

## 步驟八：觸發自動部署

之後每次你 `git push` 到 `main` 分支，GitHub Actions就會自動：建置Docker映像檔 → 推到Artifact Registry → 部署到Cloud Run。你可以到GitHub repository的「Actions」頁籤看執行過程。

隨便改一個檔案（比如README加一行字）測試看看：

```bash
git add .
git commit -m "test: 觸發CI/CD流程"
git push
```

到GitHub的Actions頁籤看流程有沒有跑成功（綠色勾勾）。

---

## 履歷上可以怎麼寫

完成以上步驟後，你就有了真實可查證的雲端部署經驗，履歷/面試可以講：

「自主開發並部署一套D3.js圖表產生器練習專案，使用Docker容器化、透過GitHub Actions建立CI/CD流程，自動建置映像檔並部署至Google Cloud Run，練習雲端服務部署與自動化部署流程。」

面試被追問細節時，你至少要能回答：Dockerfile裡每一步在做什麼、為什麼用non-root user、CI/CD流程的每個step在做什麼、Cloud Run跟傳統伺服器的差異是什麼（按用量計費、自動擴縮、不用自己管作業系統patch）。

---

## 遇到問題怎麼辦

- `gcloud run deploy --source .` 失敗：通常是billing帳戶沒設定好，去 https://console.cloud.google.com/billing 檢查
- GitHub Actions跑失敗：點進失敗的那個run看紅字錯誤訊息，通常是Secrets貼錯或IAM權限漏加
- 想砍掉重來：`gcloud run services delete d3-chart-studio --region asia-east1`
