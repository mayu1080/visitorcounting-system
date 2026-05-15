# アンケート案件の追加・変更

開発時に **新しい案件のアンケート**を足したり、**文言・設問・テーマ**を変えたりするときの手順です。現場タブレット運用や集計コマンドは引き続き `OPERATIONS.md`、リポジトリ全体の説明は `README.md` を参照してください。

## 方針（コピペを減らす）

- **正本:** ジェネレータで編集したあと **`src/surveys/*-survey.json`** に置く JSON（ダウンロードのまま、`survey` ラップ付きで可）。
- **薄い TypeScript:** `loadSurveyFromJson` で JSON を `SurveyConfig` に読み込むだけの `*.ts` を1ファイル置く（例: `natoriPark.ts`）。
- **実行時の切り替え:** `src/surveyConfig.ts` の `surveyConfigs` のキーと、Vercel / `.env.local` の **`VITE_SURVEY_CONFIG`** を一致させる。
- **送信検証:** Supabase Edge Function の **`SURVEY_REGISTRY`**（`supabase/functions/submit-response/index.ts`）を、フロントと**同じ event_id・survey_version・設問ID・選択肢**になるよう更新する。ここがズレると **400 / 送信失敗** になる。

## 関連ファイル

| 用途 | パス |
|------|------|
| 型 | `src/surveys/types.ts` |
| JSON → `SurveyConfig` | `src/surveys/loadSurveyJson.ts` |
| なとりぱーく例（JSON + 薄い ts） | `src/surveys/natori-park-survey.json`, `src/surveys/natoriPark.ts` |
| どの案件を出すか | `src/surveyConfig.ts` の `surveyConfigs` |
| 設定ジェネレータ UI | ブラウザで `/config-editor`（README参照） |
| 送信時のサーバー側検証 | `supabase/functions/submit-response/index.ts` の `SURVEY_REGISTRY` |

## 新規案件チェックリスト

1. **ローカルで** `npm run dev` を起動し、`http://localhost:5173/config-editor` を開く。
2. 基本設定・テーマ・質問を編集し、**JSON をダウンロード**する。
3. リポジトリに **`src/surveys/<識別子>-survey.json`** として保存する（例: `spring-fair-survey.json`）。**ダウンロードファイル全体**（`_readme` / `meta` / `survey`）のままでよい。
4. **`src/surveys/<識別子>.ts`** を新規作成し、次の形にする（ファイル名・import パスは JSON に合わせる）:

```ts
import type { SurveyConfig } from './types'
import raw from './spring-fair-survey.json'
import { loadSurveyFromJson } from './loadSurveyJson'

export const springFairSurvey: SurveyConfig = loadSurveyFromJson(raw)
```

5. **`src/surveyConfig.ts`** の `surveyConfigs` に、**`VITE_SURVEY_CONFIG` で使うキー文字列**と export を追加する:

```ts
import { springFairSurvey } from './surveys/springFair'

const surveyConfigs = {
  // ...
  'spring-fair': springFairSurvey,
} as const
```

6. **Edge Function** `submit-response` の **`SURVEY_REGISTRY`** に、**同じキー**（例: `'spring-fair'`）でエントリを追加する。内容は JSON の **`survey`** と一致させる（`eventId`, `surveyVersion`, 各 `questions[].id` / `options`）。更新後 **`supabase functions deploy submit-response`** で再デプロイする。

7. **`.env.local`（開発）** または **Vercel の Environment Variables** で `VITE_SURVEY_CONFIG` を上記キー（例: `spring-fair`）に設定する。本番ビルドでは **`VITE_ENVIRONMENT`** も必須。

8. ブラウザでアンケートを一通り試し、Supabase の `survey_responses` に意図どおりの `event_id` / `survey_version` / `answers` が入ることを確認する。

## JSON と TypeScript の関係

- `loadSurveyFromJson` は、ルートに **`survey` プロパティがあればその中身**を、**なければルート全体**を `SurveyConfig` として読む。
- テーマで `"32"` のように **単位だけ無い数値文字列**は、読み込み時に **`32px`** に正規化される。

## 集計スクリプトについて

`scripts/analyze_responses.py` には、グラフ用の **質問文・選択肢の並び**が案件前提でハードコードされている部分がある。新しい設問 ID や文言に変えた場合は、**集計結果やラベルがずれないよう**同スクリプト側の更新も検討する。

## よくあるミス

| 症状 | 確認すること |
|------|----------------|
| ビルド時に `Unknown VITE_SURVEY_CONFIG` | `surveyConfigs` のキーと `VITE_SURVEY_CONFIG` の綴り |
| 送信が失敗する | Edge の **`SURVEY_REGISTRY`** にキーがあるか、**選択肢の文言が1文字でも違わないか** |
| JSON を直したのに画面が変わらない | **保存した JSON ファイル名**と **`*.ts` の import パス**が一致しているか |


## 別 URL で別案件を並行運用するときは（例: `ibaraki-vanilladome`）

**なとりぱーく用 URL と茨城バニラドーム用 URL を同時に開きたい**場合は、このケースに当たる。**1つの Vercel プロジェクトだけでは無理**（ビルド時に `VITE_SURVEY_CONFIG` が1値に固定されるため）。次のようにする。

### 構成のイメージ

| 項目 | 並行運用時 |
|------|------------|
| GitHub / ソース | **同一リポジトリ**でよい（`surveyConfigs` に両方のキーを載せておく） |
| 公開 URL | **Vercel プロジェクトを案件ごとに分ける**（プロジェクトA → URL A、プロジェクトB → URL B） |
| 環境変数 | プロジェクトA は `VITE_SURVEY_CONFIG=natori-park`（例）、プロジェクトB は `VITE_SURVEY_CONFIG=ibaraki-vanilladome`。それ以外の `VITE_SUPABASE_*` / `VITE_ENVIRONMENT` は方針に合わせて設定 |
| Supabase | **同一プロジェクトでよい**（`survey_responses` は `event_id` で案件が分かれる）。データを物理分離したい場合だけ Supabase を分ける |
| Edge Function | **1つでよい**。`SURVEY_REGISTRY` に **`natori-park` と `ibaraki-vanilladome` の両方**を登録しておく。フロントが送る `configKey` がプロジェクトごとに違うので、両方とも検証できる |

### 事前準備（コード）

1. `ibaraki-vanilladome` を **`surveyConfigs` と JSON・薄い `.ts` と `SURVEY_REGISTRY`** に追加する（上の「新規案件チェックリスト」どおり）。
2. GitHub の **`main`（または運用ブランチ）に push** しておく（Vercel がこのコミットをデプロイする）。

### 既存プロジェクト（1件目・例: なとりぱーく）

すでにデプロイ済みのプロジェクトは **そのまま** でよい。

- ダッシュボードでそのプロジェクトを開く → **Settings** → **Environment Variables**
- **Production** の `VITE_SURVEY_CONFIG` が **`natori-park`**（など、なとり用のキー）になっていることを確認
- 公開 URL は **Settings** → **Domains**、またはプロジェクトトップの **Visit** で確認（例: `https://visitorcounting-system.vercel.app`）

**同じプロジェクト内に「もう1本の本番 URL」を増やすことはできない。** 茨城用は **別プロジェクト** を作る。

### Vercel 画面での手順（2件目のプロジェクトを追加）

茨城（`ibaraki-vanilladome`）用の **別 URL** を出すときの操作例です。

#### 1. 新しいプロジェクトを作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログインする。
2. 右上 **Add New…** → **Project** を選ぶ（ホームの **Add New Project** でも可）。
3. **Import Git Repository** の一覧から、**なとり用と同じ GitHub リポジトリ**（例: `visitorcounting system`）を選ぶ。
   - 一覧に無い場合は **Adjust GitHub App Permissions** / **Configure GitHub App** でリポジトリへのアクセスを許可する。
4. **Configure Project** 画面で次を設定する。
   - **Project Name**: なとり用と区別できる名前（例: `visitorcounting-ibaraki`）。これが URL の一部になる（`https://visitorcounting-ibaraki.vercel.app`）。
   - **Framework Preset**: **Vite**（自動検出されていればそのまま）。
   - **Root Directory**: リポジトリ直下なら **そのまま**（サブフォルダにコードがある場合だけ変更）。

#### 2. Environment Variables を登録（Production）

同じ **Configure Project** 画面の **Environment Variables**、または作成後の **Settings** → **Environment Variables** で追加する。

| Name | Value（例） | Environment |
|------|-------------|-------------|
| `VITE_SUPABASE_URL` | なとり用プロジェクトと **同じ** Supabase URL | **Production** にチェック |
| `VITE_SUPABASE_ANON_KEY` | 同上の **anon key** | **Production** |
| `VITE_SURVEY_CONFIG` | **`ibaraki-vanilladome`** | **Production** |
| `VITE_ENVIRONMENT` | **`production`**（本番ビルド用） | **Production** |

- 各行を入力したら **Add**（または **Save**）。
- **Preview** / **Development** にも同じ変数を付けるかは任意。現場タブレットは **Production の URL** を使うことが多い。

**重要:** なとり用プロジェクトの `VITE_SURVEY_CONFIG` は **`natori-park` のまま変更しない。** 茨城用は **新プロジェクト側だけ** `ibaraki-vanilladome` にする。

#### 3. 初回デプロイ

1. **Configure Project** 画面の下部 **Deploy** を押す（既にプロジェクトだけ作った場合は **Deployments** → **Redeploy**、または `main` へ push で自動デプロイ）。
2. **Deployments** タブでビルドが **Ready** になるまで待つ（1〜2分程度）。
3. 成功したデプロイの行にある **Visit**、またはプロジェクトトップのドメイン表示を開く。

これが **茨城用の本番 URL**（例: `https://visitorcounting-ibaraki.vercel.app`）。

#### 4. 2つの URL を控える

| 案件 | Vercel プロジェクト（例） | `VITE_SURVEY_CONFIG` | 本番 URL（例） |
|------|---------------------------|------------------------|----------------|
| なとりぱーく | 既存（例: `visitorcounting-system`） | `natori-park` | `https://…-natori….vercel.app` |
| 茨城バニラドーム | 新規（例: `visitorcounting-ibaraki`） | `ibaraki-vanilladome` | `https://…-ibaraki….vercel.app` |

タブレット・現場では **案件ごとに URL を1つ固定**する（`OPERATIONS.md` の手順書に URL を記載する）。

#### 5. 動作確認

1. **茨城用 URL** を PC ブラウザで開き、アンケート文言・設問が茨城用になっているか確認する。
2. 1件送信し、Supabase **Table Editor** の `survey_responses` で **`event_id` が茨城用**（JSON の `eventId` と一致）になっているか確認する。
3. **なとり用 URL** も同様に開き、なとり用のまま送れるか確認する（両方同時に使えることの確認）。

#### 6. 以降の更新

- コードを **`main` に push** すると、**接続している Vercel プロジェクトは両方とも** 自動で再デプロイされる（同じリポジトリを import しているため）。
- 環境変数を変えたときは、該当プロジェクトの **Deployments** → 最新デプロイの **⋯** → **Redeploy**（または空コミットで再デプロイ）が必要。

### よくある勘違い

| 勘違い | 実際 |
|--------|------|
| 同じ Vercel プロジェクトに `VITE_SURVEY_CONFIG` を2つ登録すれば URL が2本できる | **できない。** 本番ビルドは1種類のアンケートだけ |
| Environment Variables を変えれば同じ URL で案件が切り替わる | **次のデプロイから** 表示が変わるだけで、**同時に2案件は出せない** |
| 別 URL が必要 | **Add New → Project でプロジェクトをもう1つ** 作る |

「サーバーを別機で立てる」必要はなく、**Vercel プロジェクトを案件ごとに分ける**イメージでよい。

