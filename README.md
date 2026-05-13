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

Supabase に回答を保存する。集計は別ドキュメント `OPERATIONS.md` 参照。

テーブル例: `survey_responses`

| カラム | 型 | 用途 |
| --- | --- | --- |
| id | uuid | 主キー |
| created_at | timestamptz | 回答日時 |
| event_id | text | 案件識別子 |
| environment | text | `test` / `production` |
| survey_version | text | アンケート版 |
| answers | jsonb | 回答内容 |

既存テーブルに追加する場合:

```sql
alter table survey_responses
add column if not exists event_id text,
add column if not exists environment text,
add column if not exists survey_version text;
```

### RLS（行レベルセキュリティ）

URLが公開されても改ざん・閲覧されないよう、Supabase 側で以下を設定する。

```sql
alter table survey_responses enable row level security;

drop policy if exists "allow anon insert" on survey_responses;
drop policy if exists "allow anon select" on survey_responses;
drop policy if exists "allow anon update" on survey_responses;
drop policy if exists "allow anon delete" on survey_responses;

create policy "allow anon insert"
on survey_responses
for insert
to anon
with check (true);
```

- フロントで使う `anon` キーには **INSERT のみ** 許可
- 集計用 Python スクリプトは `service_role` キーで RLS をバイパス

### 環境変数（フロントエンド）

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SURVEY_CONFIG`: 使用するアンケート設定（例: `natori-park`）
- `VITE_ENVIRONMENT`: 保存時の環境名（`test` / `production`）

## デプロイ（Vercel）

### 初回デプロイ

1. GitHub に push（リポジトリはPublic / Privateどちらでも可）
2. [Vercel](https://vercel.com) にログイン → **Add New… → Project**
3. GitHub リポジトリを Import
4. **Framework Preset**: `Vite`（自動検出される）
5. **Environment Variables** に以下を追加:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SURVEY_CONFIG`（例: `natori-park`）
   - `VITE_ENVIRONMENT`
6. `VITE_ENVIRONMENT` は環境ごとに値を分ける
   - Production: `production`
   - Preview / Development: `test`
7. **Deploy** を押す → 1〜2分で公開URL（例: `https://visitorcounting-system.vercel.app`）が発行される

### 2回目以降

`main` ブランチへ push すると Vercel が自動で再デプロイする。手動操作は不要。

### 動作確認

1. PCのブラウザで公開URLを開く → アンケート画面が表示される
2. 1件回答して送信完了画面が出る
3. Supabase Table Editor で `survey_responses` に行が追加されていることを確認

## タブレット運用

- Android タブレットのブラウザで Vercel の公開URLを開く
- 全画面表示にする（Chrome のフルスクリーン or Fully Kiosk Browser）
- スリープを OFF にする（設定 → ディスプレイ → スリープしない、または充電中スリープしない）
- 電源を接続したまま設置
- 詳細な現場運用手順は `OPERATIONS.md` 参照

## 起動方法（開発）

```bash
npm install
cp .env.example .env.local   # Supabase の URL と anon key を記入
npm run dev
```

## 集計・グラフ化

オフィスPCでの集計・グラフ生成は `OPERATIONS.md` 参照。

## 複数案件対応

コードベースは1つのまま、案件ごとのアンケート内容・表示文言・テーマを `src/surveys/` 配下の設定ファイルで切り替える。

### 設定ファイル

- `src/surveys/types.ts`: survey config の型定義
- `src/surveys/default.ts`: `VITE_SURVEY_CONFIG` 未設定時の設定
- `src/surveys/natoriPark.ts`: なとりぱーく用の設定
- `src/surveyConfig.ts`: `VITE_SURVEY_CONFIG` を見て設定を選ぶローダー

### 案件追加手順

1. `src/surveys/yourEvent.ts` を作成
2. `SurveyConfig` 型に合わせて以下を定義
   - `eventId`
   - `surveyVersion`（例: `v1.0.0_2026-05-13`）
   - 表示文言
   - `questions`
   - `theme`
3. `src/surveyConfig.ts` の `surveyConfigs` に追加
4. `.env.local` または Vercel の Environment Variables で `VITE_SURVEY_CONFIG` を追加したキー名に変更

### theme 設定

将来UI編集画面を作れるよう、表示テーマはsurvey config内の `theme` に持たせる。

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
- `VITE_ENVIRONMENT`: 本番は `production`、テストは `test`

複数案件を同時運用する場合は、同じGitHubリポジトリを使って **Vercelプロジェクトを案件ごとに分ける**。プロジェクトごとに `VITE_SURVEY_CONFIG` と公開URLを分ける。

### 集計の絞り込み

`.env.local` に以下を設定すると、集計時に対象を絞り込める。

```env
AGGREGATE_EVENT_ID=natori-park
AGGREGATE_ENVIRONMENT=production
```

出力先は `outputs/{event_id}/summary.csv` と `outputs/{event_id}/chart.png`。

## 実装制約

- まずは単一画面に近い構成で実装する
- 過度なコンポーネント分割をしない
- 状態管理ライブラリを導入しない
- Router を導入しない
- UI ライブラリを導入しない
- CSS フレームワークを導入しない
- ファイル数を最小限にする
- まずは動くプロトタイプを優先する
