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
| answers | jsonb | 回答内容 |

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

## デプロイ（Vercel）

### 初回デプロイ

1. GitHub に push（リポジトリはPublic / Privateどちらでも可）
2. [Vercel](https://vercel.com) にログイン → **Add New… → Project**
3. GitHub リポジトリを Import
4. **Framework Preset**: `Vite`（自動検出される）
5. **Environment Variables** に以下を追加（`Production` / `Preview` / `Development` すべてにチェック）:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. **Deploy** を押す → 1〜2分で公開URL（例: `https://visitorcounting-system.vercel.app`）が発行される

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

## 実装制約

- まずは単一画面に近い構成で実装する
- 過度なコンポーネント分割をしない
- 状態管理ライブラリを導入しない
- Router を導入しない
- UI ライブラリを導入しない
- CSS フレームワークを導入しない
- ファイル数を最小限にする
- まずは動くプロトタイプを優先する
