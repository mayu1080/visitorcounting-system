# 集計運用手順

このドキュメントは、オフィスPCでアンケート結果を更新するための手順です。

## 日常運用

プロジェクトフォルダでターミナルを開き、以下を実行する。

### Windows / PowerShell

```powershell
.\.venv\Scripts\python.exe scripts\update_reports.py
```

### Mac / Terminal

```bash
./.venv/bin/python scripts/update_reports.py
```

このコマンドは内部で以下を順に実行する。

1. Supabase APIから回答を取得し、`data/survey_responses.csv` に保存
2. `outputs/summary.csv` と `outputs/chart.png` を生成

## 出力

- `data/survey_responses.csv`: Supabase APIから取得した回答データ
- `outputs/summary.csv`: 質問ID・回答ごとの件数
- `outputs/chart.png`: 全質問を1枚にまとめた横棒グラフ

## 初回セットアップ

### 1. Python仮想環境を作成

Windows:

```powershell
python -m venv .venv
```

Mac:

```bash
python3 -m venv .venv
```

### 2. 依存ライブラリをインストール

Windows:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Mac:

```bash
./.venv/bin/python -m pip install -r requirements.txt
```

### 3. `.env.local` を作成

`.env.example` を参考に `.env.local` を作成する。

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...
```

注意:

- `VITE_SUPABASE_ANON_KEY` はフロントエンド用
- `SUPABASE_SERVICE_ROLE_KEY` はローカルPython集計用
- `SUPABASE_SERVICE_ROLE_KEY` は管理者権限のキーなので、GitHubにpushしない
- `.env.local` は `.gitignore` に登録済み

## トラブルシューティング

### `.env.local が見つかりません`

プロジェクトルートに `.env.local` を配置する。

### `SUPABASE_URL が .env.local に設定されていません`

`.env.local` に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` があるか確認する。

### `Supabase API取得に失敗しました`

以下を確認する。

- インターネット接続
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Supabase側の `survey_responses` テーブル

### `ModuleNotFoundError`

依存ライブラリが未インストール。以下を再実行する。

Windows:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Mac:

```bash
./.venv/bin/python -m pip install -r requirements.txt
```

### グラフが古い

`outputs/chart.png` を開き直す。画像ビューアがキャッシュしている場合は一度閉じて再度開く。
