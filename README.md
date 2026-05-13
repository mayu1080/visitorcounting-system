# 来場者アンケートシステム

## 目的

展示会・イベント会場で使う、来場者向けの展示用アンケート。
現場にPCは置かず、Androidタブレットのブラウザで常時表示して運用する。

## 構成

- フロントエンド: React + Vite（静的ビルド）
- データ保存: Supabase
- ホスティング: Vercel

## MVP

- 質問表示
- 回答入力
- 送信（Supabase へ書き込み）
- 完了画面の表示
- 数秒後に自動で1問目へリセット

## アンケート画面

- 上部固定見出し: 「なとりぱーくご利用についてのアンケート」
- アクセス直後に1問目を表示
- 1画面1質問で順番に表示、回答後に自動で次の質問へ進む
- 最後の質問に回答後、送信ボタンを表示
- 回答は `{ questionId: answerValue }` の形で保存

## 保存

Supabase に回答を保存する。
集計はオフィスPCから Supabase の Table Editor / CSV Export で確認。

テーブル例: `survey_responses`

| カラム | 型 | 用途 |
| --- | --- | --- |
| id | uuid | 主キー |
| created_at | timestamptz | 回答日時 |
| answers | jsonb | 回答内容 |

環境変数:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## デプロイ

Vercel にデプロイする。

1. GitHub に push
2. Vercel でリポジトリを選択（Framework: Vite）
3. 環境変数を設定して Deploy
4. 発行された URL を現場タブレットで開く

## タブレット運用

- Android タブレットのブラウザで対象 URL を開く
- 全画面表示にする（Chrome のフルスクリーン or Fully Kiosk Browser）
- スリープを OFF にする（設定 → ディスプレイ → スリープしない、または充電中スリープしない）
- 電源を接続したまま設置

## 起動方法（開発）

```bash
npm install
cp .env.example .env.local   # Supabase の URL と anon key を記入
npm run dev
```

## 集計・グラフ化（オフィスPC）

ローカルPCのPythonスクリプトから Supabase API で直接取得し、集計・棒グラフ化する。

### .env.local に追加する環境変数

```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...（Supabase ダッシュボード → Project Settings → API → "service_role" のキー）
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` は管理者権限のキー。**フロントエンドや Git に絶対に含めない**こと。`.gitignore` に `.env.local` が登録済みであることを確認。

### 手順

1. 依存インストール（初回のみ）
   ```bash
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```
2. API から取得して CSV 保存
   ```bash
   .\.venv\Scripts\python.exe scripts\fetch_responses.py
   ```
   → `data/survey_responses.csv` に保存される
3. 集計＋グラフ生成
   ```bash
   .\.venv\Scripts\python.exe scripts\analyze_responses.py
   ```
4. 出力を確認
   - `outputs/summary.csv`: 質問ID・回答ごとの件数
   - `outputs/chart.png`: 全質問を1枚にまとめた横棒グラフ

### 旧手順（手動 CSV エクスポート）

`fetch_responses.py` が使えない環境では、Supabase Table Editor からCSVを手動エクスポートし、`data/survey_responses.csv` として配置すれば `analyze_responses.py` で同様に集計可能。

## 実装制約

- まずは単一画面に近い構成で実装する
- 過度なコンポーネント分割をしない
- 状態管理ライブラリを導入しない
- Router を導入しない
- UI ライブラリを導入しない
- CSS フレームワークを導入しない
- ファイル数を最小限にする
- まずは動くプロトタイプを優先する
