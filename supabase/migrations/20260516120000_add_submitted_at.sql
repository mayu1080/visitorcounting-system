-- データ送信日時（アンケート回答が Edge Function 経由で保存された時刻）
alter table survey_responses
  add column if not exists submitted_at timestamptz;

comment on column survey_responses.submitted_at is 'データが送信された日付・時間（JST表示はダッシュボードのタイムゾーン設定に依存）';

-- 既存行: created_at があればコピー、なければ現在時刻
update survey_responses
set submitted_at = coalesce(submitted_at, created_at, now())
where submitted_at is null;

alter table survey_responses
  alter column submitted_at set default now(),
  alter column submitted_at set not null;
