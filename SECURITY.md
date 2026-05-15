# セキュリティ方針（MVP）

## 公開前に入れたガード（要約）

- **ブラウザから `survey_responses` への直接 INSERT は行わない。** 匿名キーでは PostgREST 経由の INSERT を許可しない（RLS で拒否）。
- **回答送信は Edge Function `submit-response` のみ。** フロントは `supabase.functions.invoke` で呼び出す。
- **`event_id` / `environment` / `survey_version` はクライアント値を保存に使わない。** Edge Function 内の許可リスト（`SURVEY_REGISTRY`）とシークレット `SUBMIT_ENVIRONMENT` で固定する。
- **`answers` はサーバーで最低限検証**（型・キー集合・各値が定義された選択肢のいずれか・文字列長上限）。
- **`service_role` キーはフロントの環境変数に含めない。** 使うのは Edge Function（ホストが注入）とローカル Python 集計のみ。

## 残るリスク（今回の範囲外）

- **レート制限・WAF は未実装。** 匿名で `submit-response` を叩けるため、悪意のある大量リクエストで負荷をかけられる可能性は残る。
- **`configKey` はクライアントが送る**ため、許可されたアンケートに対する送信は誰でも行える（意図した公開範囲）。未許可キーは 400 で拒否する。

## 運用チェックリスト

1. Supabase で **anon の `survey_responses` INSERT ポリシーを削除**し、README の SQL と一致させる。
2. Edge Function **`submit-response` をデプロイ**し、シークレット **`SUBMIT_ENVIRONMENT`** を `test` または `production` に設定する。
3. Vercel の本番ビルドで **`VITE_SURVEY_CONFIG` / `VITE_ENVIRONMENT` が必ず設定**されるようにする（未設定だとビルド時に落ちる）。
4. 本番 Supabase の `SUBMIT_ENVIRONMENT` と、運用上の意味（本番データか検証か）を揃える。

## 案件追加時

- `src/surveyConfig.ts` の `surveyConfigs` に加え、**`supabase/functions/submit-response/index.ts` の `SURVEY_REGISTRY` に同じキー・設問・選択肢・event_id / survey_version を追加**する。片方だけ更新すると送信が 400 になるか、検証と表示が食い違う。
