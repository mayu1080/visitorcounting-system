# 来場者アンケートシステム

## 目的

展示会・イベント会場で使う、来場者向けの展示用アンケート。
現場にPCは置かず、Androidタブレットのブラウザで常時表示して運用する。

## 構成

- フロントエンド: React + Vite（静的ビルド）
- データ保存: Supabase（`survey_responses` テーブル）
- 回答送信: **Supabase Edge Function `submit-response`**（`service_role` で INSERT）
- ホスティング: Vercel

## MVP

- 質問表示
- 回答入力
- 送信（Edge Function 経由で Supabase へ書き込み）
- 完了画面の表示
- 数秒後に自動で1問目へリセット

## アンケート画面

- 上部固定見出し: 案件ごとの `appTitle`（例: なとりぱーく用設定）
- アクセス直後に1問目を表示
- 1画面1質問で順番に表示。**各問で回答を選び「次に進む」で次の質問へ**
- 最後の質問のあと確認画面へ進み、**「送信する」で Edge Function へ送信**
- 回答は `{ questionId: answerValue }` の形で保存

## 保存

回答は **Edge Function `submit-response`** が検証したうえで `survey_responses` に INSERT する。集計は `OPERATIONS.md` 参照。

テーブル例: `survey_responses`

| カラム | 型 | 用途 |
| --- | --- | --- |
| id | uuid | 主キー |
| created_at | timestamptz | 回答日時 |
| event_id | text | 案件識別子（**Edge 側で固定**） |
| environment | text | `test` / `production`（**Edge のシークレット `SUBMIT_ENVIRONMENT` で固定**） |
| survey_version | text | アンケート版（**Edge 側で固定**） |
| answers | jsonb | 回答内容（**Edge でバリデーション済み**） |

既存テーブルに追加する場合:

```sql
alter table survey_responses
add column if not exists event_id text,
add column if not exists environment text,
add column if not exists survey_version text;
```

### RLS（行レベルセキュリティ）

**方針:** `anon` キー（ブラウザ）からは `survey_responses` を **直接 INSERT できない** ようにする。INSERT は Edge Function の `service_role` のみ（RLS バイパス）。

Supabase SQL Editor などで実行:

```sql
alter table survey_responses enable row level security;

drop policy if exists "allow anon insert" on survey_responses;
drop policy if exists "allow anon select" on survey_responses;
drop policy if exists "allow anon update" on survey_responses;
drop policy if exists "allow anon delete" on survey_responses;
```

- **`anon` 向けの INSERT / SELECT / UPDATE / DELETE ポリシーは付けない**（付いていれば上記で削除）。
- 集計用 Python は **`SUPABASE_SERVICE_ROLE_KEY`** で取得する（RLS バイパス）。

**デプロイ順の目安:** 先に Edge Function `submit-response` をデプロイし、フロントを invoke する版に切り替えた**後**に、anon の INSERT ポリシーを削除する。順序が逆だと、更新前のフロントが送信できなくなる。

### Supabase Edge Function `submit-response`

- リポジトリ: `supabase/functions/submit-response/index.ts`
- 許可された `configKey`（= `VITE_SURVEY_CONFIG` と同じキー）だけ受け付け、**`event_id` / `survey_version` はサーバー内レジストリで固定**。
- **`SUBMIT_ENVIRONMENT`** シークレット（`test` または `production`）を **必ず** 設定する（ダッシュボード **Project Settings → Edge Functions → Secrets**、または CLI `supabase secrets set SUBMIT_ENVIRONMENT=production`）。
- `verify_jwt = false`（`supabase/config.toml`）：ログインなし公開のため。悪用対策としてのレート制限は未実装。

デプロイ例（Supabase CLI 利用時）:

```bash
supabase functions deploy submit-response
supabase secrets set SUBMIT_ENVIRONMENT=production
```

### 環境変数（フロントエンド・Vite）

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`（**`survey_responses` 直接 INSERT には使わない**。Edge invoke 用）
- **`VITE_SURVEY_CONFIG`（必須）**: `src/surveyConfig.ts` のキーと一致（例: `natori-park`）。**未知の値ではビルド／起動時にエラー**。
- **`VITE_ENVIRONMENT`**: 本番ビルド（`vite build`）では **必須**。保存値とは独立（運用チェック用。保存は Edge の `SUBMIT_ENVIRONMENT`）。

詳細は `SECURITY.md` を参照。

## デプロイ（Vercel）

### 初回デプロイ

1. GitHub に push（リポジトリは Public / Private どちらでも可）
2. **Supabase:** Edge Function `submit-response` をデプロイし、`SUBMIT_ENVIRONMENT` を設定する（上記）
3. **Supabase:** RLS を READMEの SQL どおりにし、anon 直接 INSERT を無効化する
4. [Vercel](https://vercel.com) にログイン → **Add New… → Project**
5. GitHub リポジトリを Import
6. **Framework Preset**: `Vite`（自動検出される）
7. **Environment Variables** に以下を追加:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SURVEY_CONFIG`（例: `natori-park`）
   - `VITE_ENVIRONMENT`（Production では `production`、Preview は `test` など）
8. **Deploy** を押す → 公開 URL が発行される

### 2回目以降

`main` ブランチへ push すると Vercel が自動で再デプロイする。Edge Function を変えた場合は Supabase 側でも再デプロイが必要。

### 動作確認

1. PCのブラウザで公開 URL を開く → アンケート画面が表示される
2. 1件回答して送信完了画面が出る
3. Supabase Table Editor で `survey_responses` に行が追加されていることを確認

## タブレット運用

- Android タブレットのブラウザで Vercel の公開 URL を開く
- 全画面表示にする（Chrome のフルスクリーン or Fully Kiosk Browser）
- スリープを OFF にする（設定 → ディスプレイ → スリープしない、または充電中スリープしない）
- 電源を接続したまま設置
- 詳細な現場運用手順は `OPERATIONS.md` 参照

## 起動方法（開発）

```bash
npm install
cp .env.example .env.local
# .env.local に VITE_* を記入（VITE_SURVEY_CONFIG は必須）
npm run dev
```

ブラウザで **`http://localhost:5173/config-editor`**（ポートは環境による）を開くと、ローカル専用の **Survey config ジェネレータ**（認証なし・DB なし）が使える。**`App` を動的 import しているため、`.env.local` が未設定でもこの URL だけは開ける**（アンケート本体は従来どおり `VITE_SURVEY_CONFIG` 等が必要）。

## Survey config ジェネレータ（`/config-editor`）

- **目的:** `src/surveys/*.ts` を手で書かずに、アンケート設定のたたき台を作る（**設定ジェネレータ**）。保存は JSON ダウンロードのみ。
- **ルーティング:** React Router は使わず、`main.tsx` で `pathname === '/config-editor'` のときだけ `ConfigEditor` を表示する。
- **Vercel:** 直リンクのため `vercel.json` で SPA 用 rewrite を設定している。

### 使い方

1. `/config-editor` を開く（開発時は上記 URL）。
2. 左カラムで基本設定・テーマ・フォント（px）・質問を編集する。空欄のフォント系は **既存の既定（fontScale 連動の計算式）** を使う。
3. 右カラムで **プレビュー** と **JSON** を確認する。
4. **JSON をダウンロード**し、`src/surveys/` に保存する（例: `natori-park-survey.json`）。**ダウンロードファイル全体**（`_readme` / `meta` / `survey` 付き）のままでよい。
5. 案件用の **`.ts` は薄く**し、`loadSurveyFromJson` で JSON を読み込む（`src/surveys/natoriPark.ts` が例）。**案件を増やすときの全体手順は `SURVEYS.md`**。
6. `src/surveyConfig.ts` の `surveyConfigs` と、**`supabase/functions/submit-response/index.ts` の `SURVEY_REGISTRY`** を手動で揃える（送信バリデーション用）。

`meta.environment` は運用メモ用で、TypeScript の `SurveyConfig` 型には含めない。実際の DB の `environment` は Edge の **`SUBMIT_ENVIRONMENT`** が決める。

## 集計・グラフ化

オフィス PC での集計・グラフ生成は `OPERATIONS.md` 参照。

## 複数案件対応

コードベースは1つのまま、案件ごとのアンケート内容・表示文言・テーマを `src/surveys/` 配下で切り替える。**案件の追加手順・JSON 運用・Edge `SURVEY_REGISTRY` 同期の詳細は `SURVEYS.md` を参照。**

### 設定ファイル

- `src/surveys/types.ts`: survey config の型定義
- `src/surveys/loadSurveyJson.ts`: ジェネレータの JSON（`survey` ラップあり／なし）を **`SurveyConfig` に読み込む**ヘルパー
- `src/surveys/default.ts`: **`VITE_SURVEY_CONFIG=default` のとき**の設定
- `src/surveys/natoriPark.ts`: なとりぱーく用（**`natori-park-survey.json` を import** して `loadSurveyFromJson`）
- `src/surveyConfig.ts`: `VITE_SURVEY_CONFIG` を見て設定を選ぶローダー（**未設定・未知キーはエラー**）

### 案件追加手順

`SURVEYS.md` の **新規案件チェックリスト** に従う（ジェネレータ → `*-survey.json` → 薄い `*.ts` → `surveyConfig.ts` → Edge `SURVEY_REGISTRY` → 環境変数）。

### theme 設定

将来 UI 編集画面を作れるよう、表示テーマは survey config 内の `theme` に持たせる。

```ts
theme: {
  backgroundColor: '#0f1115',
  textColor: '#f5f5f7',
  accentColor: '#ffc857',
  buttonStyle: 'rounded',
  fontScale: 1,
}
```

`buttonStyle` は `rounded` / `square` / `pill` を指定できる。

### 本番切り替え

Vite の環境変数はビルド時に固定される。案件を切り替える場合は、Vercel の Environment Variables を変更して Redeploy する。

- `VITE_SURVEY_CONFIG`: 使用する案件設定
- `VITE_ENVIRONMENT`: 本番ビルド必須（例: `production` / `test`）
- **Supabase Edge の `SUBMIT_ENVIRONMENT`**: 行に保存される環境名（本番 DB では `production` など）

複数案件を**同時**運用する場合は、同じ GitHub リポジトリを使って **Vercel プロジェクトを案件ごとに分ける**（**Add New → Project** で2件目を作る。同じプロジェクト内に URL を増やすことはできない）。画面操作の詳細は **`SURVEYS.md`「別 URL で別案件を並行運用」** を参照。プロジェクトごとに `VITE_SURVEY_CONFIG` と公開 URL を分ける。

### 集計の絞り込み

`.env.local` に以下を設定すると、集計時に対象を絞り込める。

```env
AGGREGATE_EVENT_ID=natori-park
AGGREGATE_ENVIRONMENT=production
```

出力先（`scripts/analyze_responses.py` の実装）:

- `AGGREGATE_EVENT_ID` **あり**: `outputs/{event_id}/summary.csv` と `outputs/{event_id}/chart.png`
- `AGGREGATE_EVENT_ID` **なし**: `outputs/summary.csv` と `outputs/chart.png`

## 実装制約

- まずは単一画面に近い構成で実装する
- 過度なコンポーネント分割をしない
- 状態管理ライブラリを導入しない
- Router を導入しない
- UI ライブラリを導入しない
- CSS フレームワークを導入しない
- ファイル数を最小限にする
- まずは動くプロトタイプを優先する
