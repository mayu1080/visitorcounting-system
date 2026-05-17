# 運用手順

このドキュメントは、**現場タブレット運用** と **オフィスPCでの集計** の両方の手順をまとめたものです。

**アンケート案件の追加・JSON・Edge Function 連携**など開発向けの手順は **`SURVEYS.md`** を参照してください。

---

# 現場運用（タブレット）

## 事前準備（イベント前日まで）

1. Vercel に最新版がデプロイされていることを確認
   - PCのブラウザで公開URLを開いて回答送信テスト
   - Supabase の `survey_responses` に行が追加されていればOK
2. タブレットを充電しておく
3. （会場Wi-Fiを使う場合）主催者にWi-FiのSSID・パスワードを事前に確認
4. （予備）モバイルWi-Fi or スマホのテザリングを準備

## 当日セットアップ

### 1. ネットワーク接続

- 会場Wi-Fi に接続する
  - **キャプティブポータル（ログイン画面）が出るWi-Fi** の場合は、ブラウザを開いて承認画面を通過する
- 接続後、必ず一度ブラウザで任意のサイト（例: `https://www.google.com`）を開いて疎通確認する

### 2. アンケートサイトを開く

1. ブラウザのアドレスバーに Vercel の公開URLを入力
   - 例: `https://visitorcounting-system.vercel.app`
2. アンケート1問目が表示されたらOK
3. **試しに1問回答してみて、ネットワーク経由で送信できるか確認**
   - 「ご回答ありがとうございました」画面まで進めばOK
   - エラーが出る場合は Supabase 側ではなくネットワーク疎通の問題の可能性が高い → モバイルWi-Fi等へ切り替え

### 3. キオスクモード化

#### 方法A: Chrome のフルスクリーン（簡単）

1. Chrome のメニュー → フルスクリーン
2. 戻るボタン・ホームボタンを誤って押されない位置に設置

#### 方法B: Fully Kiosk Browser（推奨）

1. Google Play から `Fully Kiosk Browser` をインストール
2. Start URL に Vercel の公開URLを設定
3. 以下を有効化:
   - Auto Reload（任意・回答後の自動リセットがあるので必須ではない）
   - Keep Screen On
   - Hide Status / Navigation Bar
4. 「キオスクモード」を開始

### 4. スリープ防止

- 設定 → ディスプレイ → スリープしない（または充電中スリープしない）
- 電源ケーブルを接続したまま設置

## 撤収

1. ブラウザを閉じる（Fully Kiosk の場合は終了）
2. タブレットの Wi-Fi 接続を解除
3. 当日の回答数を Supabase Table Editor で確認

---

# 集計運用（オフィスPC）

## 日常運用

プロジェクトフォルダでターミナルを開き、以下を実行する。

**案件ごとに集計する場合**は、実行コマンドで `event_id`（と必要なら `environment`）を指定する。`.env.local` を毎回書き換える必要はない（コマンド引数が `.env.local` より優先される）。

### Windows / PowerShell

```powershell
# なとりぱーく（本番データ）の例
.\.venv\Scripts\python.exe scripts\update_reports.py -e natori-park -E production

# 茨城バニラドーム（本番データ）の例
.\.venv\Scripts\python.exe scripts\update_reports.py -e ibaraki-vanilladome -E production

# 長い形式でも可
.\.venv\Scripts\python.exe scripts\update_reports.py --event-id natori-park --environment production
```

### Mac / Terminal

```bash
./.venv/bin/python scripts/update_reports.py -e natori-park -E production
```

`.env.local` に `AGGREGATE_EVENT_ID` / `AGGREGATE_ENVIRONMENT` を書いておけば、引数を省略したときだけそちらが使われる。

このコマンドは内部で以下を順に実行する。

1. Supabase API から回答を取得し、`data/survey_responses.csv` に保存（**`-e` / `-E` 指定時は API 取得段階から絞り込み**）
2. `outputs/{event_id}/summary.csv` と `outputs/{event_id}/chart.png` を生成（同じ絞り込みを再適用）

## 出力

- `data/survey_responses.csv`: Supabase APIから取得した回答データ
- **集計結果（`analyze_responses.py`）**
  - `.env.local` に **`AGGREGATE_EVENT_ID` を設定している場合**: `outputs/{event_id}/summary.csv` と `outputs/{event_id}/chart.png`
  - **`AGGREGATE_EVENT_ID` を未設定の場合**: `outputs/summary.csv` と `outputs/chart.png`（プロジェクト直下の `outputs/`）

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
VITE_SURVEY_CONFIG=natori-park
VITE_ENVIRONMENT=test
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...
AGGREGATE_EVENT_ID=natori-park
AGGREGATE_ENVIRONMENT=production
```

注意:

- `VITE_SUPABASE_ANON_KEY` はフロントエンド用（Edge Function の invoke に使用。テーブル直接 INSERT には使わない）
- `VITE_SURVEY_CONFIG` は使用するアンケート設定（**必須**。未知の値ではアプリが起動しない）
- `VITE_ENVIRONMENT` は **本番ビルドでは必須**（ビルド時チェック）。DB に保存される `environment` は **Supabase Edge Function のシークレット `SUBMIT_ENVIRONMENT`** で決まる
- `SUPABASE_SERVICE_ROLE_KEY` はローカル Python 集計用
- `AGGREGATE_EVENT_ID` / `AGGREGATE_ENVIRONMENT` は集計対象の絞り込み用
- `SUPABASE_SERVICE_ROLE_KEY` は管理者権限のキーなので、GitHub に push しない
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

出力先は `AGGREGATE_EVENT_ID` の有無で変わる（README「集計の絞り込み」参照）。

- `AGGREGATE_EVENT_ID` あり: `outputs/{event_id}/chart.png`
- なし: `outputs/chart.png`

該当パスの画像を開き直す。画像ビューアがキャッシュしている場合は一度閉じて再度開く。

---

# 現場トラブル対応

## タブレットでサイトが開けない

1. **会場Wi-Fi がキャプティブポータル**: ブラウザで任意のサイトを開いて承認画面を通過
2. **会場Wi-Fi がフィルタリングで `vercel.app` をブロック**: モバイルWi-Fi or テザリングへ切替
3. **インターネット自体が繋がっていない**: Wi-Fi設定を確認、モバイル回線に切替
4. **URL を間違えて入力**: URL を再確認

## 回答送信エラーが出る

タブレット画面に「送信に失敗しました。もう一度お試しください。」と表示される場合:

1. ネットワーク接続を確認（Wi-Fi が切れていないか）
2. Supabase が稼働しているか確認（Supabase Status ページ参照）
3. Edge Function **`submit-response`** がデプロイ済みか確認
4. Edge Function のシークレット **`SUBMIT_ENVIRONMENT`** が `test` または `production` か確認（**未設定だと 500 になりやすい**）
5. PC のブラウザで同じ URL を開き、F12 → **Console** で `submit-response failed:` を確認（`Invalid answers` / `Unknown configKey` / `Server misconfiguration` など）
6. Supabase → **Edge Functions** → `submit-response` → **Logs** で送信時刻付近を確認
7. Vercel の **`VITE_SURVEY_CONFIG`** が Edge の **`SURVEY_REGISTRY`** のキーと一致しているか
8. 解決しない場合は、一度タブレットの**ブラウザをリロード**して復帰させる

**PostHog の `headerUpgradeCta` など:** Supabase **ダッシュボード画面**の分析用エラーであり、**来場者アンケートの送信とは無関係**です。

## 回答が Supabase に保存されない

1. Edge Function **`submit-response` がデプロイ済み**か、Supabase ダッシュボードの **Edge Functions** で確認
2. Edge Function のシークレット **`SUBMIT_ENVIRONMENT`** が `test` または `production` に設定されているか確認
3. RLS で **`anon` が `survey_responses` に直接 INSERT できない**状態になっているか確認（意図どおり。送信は Edge のみ）
4. Vercel の環境変数 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / **`VITE_SURVEY_CONFIG`**（フロントのキーが Edge の `SURVEY_REGISTRY` と一致しているか）を確認

## 集計で「取得件数: 0」／集計できる回答が1件も見つかりません

`update_reports.py` は **`SUPABASE_SERVICE_ROLE_KEY`** で取得するため、**RLS ポリシーを削除したこと自体は原因になりません**（`service_role` は RLS をバイパスする）。

よくある原因（優先度順）:

| 原因 | 症状 | 対処 |
|------|------|------|
| **`.env.local` に anon キーを入れている** | エラーなく 0 件 | Project Settings → API → **service_role**（secret）を `SUPABASE_SERVICE_ROLE_KEY` に設定 |
| **`-E production` と DB の `environment` が不一致** | Table Editor には行があるが 0 件 | Edge の **`SUBMIT_ENVIRONMENT`** が `test` なら `-E test` で再実行。Table Editor の `environment` 列を確認 |
| **別 Supabase プロジェクトの URL/キー** | 本番テーブルに行があるのに 0 件 | `SUPABASE_URL` が Vercel の `VITE_SUPABASE_URL` と同じプロジェクトか確認 |
| **フィルタだけ不一致** | `-e` なしでは取れる | `fetch_responses.py` 実行時に診断ログで `event_id` / `environment` の内訳が出る（スクリプト更新済み） |

確認コマンド:

```powershell
.\.venv\Scripts\python.exe scripts\fetch_responses.py -e natori-park -E production
```

先頭に `API key role: service_role` と出ればキー種別は OK。`role は 'anon'` と出たらキーを差し替える。

フィルタなしで件数だけ見る:

```powershell
.\.venv\Scripts\python.exe scripts\fetch_responses.py
```

`data/survey_responses.csv` の `environment` 列の値に合わせて `-E` を指定する。

---

# Mac固有の補足（未検証・参考）

集計用Pythonを **Mac** で動かす場合の追加考慮事項。現状は Windows で運用しているため未検証だが、Mac で `python3 -m venv` などが失敗するケースの主な原因を以下に挙げる。

## Xcode Command Line Tools

`python3 -m venv .venv` や `pip install` で C 拡張のビルドが必要な場合に必要。インストール方法:

```bash
xcode-select --install
```

## SSL証明書

Python.org からインストールした Python では、`pip install` が SSL エラーになることがある。
Applications/Python 3.x フォルダ内の `Install Certificates.command` をダブルクリックすると解消する。

## activate を使わない理由

このドキュメントの全コマンドは `.venv/bin/python` のフルパスを使う形に統一している。これは:

- 初回セットアップでも撤去時でも操作が同じ
- `activate` を忘れてシステムPythonで実行する事故を防ぐ
- スクリプトに書きやすい

`source .venv/bin/activate` でアクティベートしてから `python scripts/update_reports.py` でも同じ結果になる。お好みで。
