"""Supabase API から survey_responses を取得して CSV に保存するスクリプト。

前提:
- .env.local に SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていること
- service_role key は管理者権限。フロントや Git に絶対含めないこと
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pandas as pd

from aggregate_cli import ENV_FILE, init_aggregate_env
from supabase_aggregate_diag import print_filter_mismatch_hint, warn_if_not_service_role

OUTPUT_CSV = Path("data/survey_responses.csv")
TABLE_NAME = "survey_responses"


def main() -> None:
    if not ENV_FILE.exists():
        raise SystemExit(
            f".env.local が見つかりません: {ENV_FILE}\n"
            "SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定したファイルを配置してください"
        )

    event_id_filter, environment_filter = init_aggregate_env()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url:
        raise SystemExit("SUPABASE_URL が .env.local に設定されていません")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY が .env.local に設定されていません")

    try:
        from supabase import create_client
    except ImportError as exc:
        raise SystemExit(
            "supabase パッケージが未インストールです。\n"
            "  .\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt"
        ) from exc

    client = create_client(url, key)
    warn_if_not_service_role(key)

    try:
        query = client.table(TABLE_NAME).select("*")
        if event_id_filter:
            query = query.eq("event_id", event_id_filter)
            print(f"fetch filter event_id: {event_id_filter}")
        if environment_filter:
            query = query.eq("environment", environment_filter)
            print(f"fetch filter environment: {environment_filter}")
        response = query.execute()
    except Exception as exc:
        raise SystemExit(f"Supabase API取得に失敗しました: {exc}") from exc

    rows = response.data or []
    print(f"取得件数: {len(rows)}")

    if len(rows) == 0 and (event_id_filter or environment_filter):
        print("--- 0 件のため診断を実行します ---")
        print_filter_mismatch_hint(client, TABLE_NAME, event_id_filter, environment_filter)

    if rows:
        df = pd.DataFrame(rows)
        if "answers" in df.columns:
            df["answers"] = df["answers"].apply(
                lambda v: json.dumps(v, ensure_ascii=False)
                if isinstance(v, (dict, list))
                else v
            )
    else:
        df = pd.DataFrame(
            columns=[
                "id",
                "created_at",
                "submitted_at",
                "event_id",
                "environment",
                "survey_version",
                "answers",
            ]
        )

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"saved: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
