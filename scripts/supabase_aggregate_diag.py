"""集計用 Supabase 接続の簡易診断（JWT の role 確認・フィルタ不一致のヒント）。"""

from __future__ import annotations

import base64
import json
from collections import Counter
from typing import Any


def jwt_role(api_key: str) -> str | None:
    """Supabase API キー JWT の role クレーム（service_role / anon など）。"""
    try:
        parts = api_key.strip().split(".")
        if len(parts) != 3:
            return None
        payload = parts[1]
        payload += "=" * (-len(payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(payload))
        role = data.get("role")
        return role if isinstance(role, str) else None
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def warn_if_not_service_role(api_key: str) -> None:
    role = jwt_role(api_key)
    if role is None:
        print("警告: SUPABASE_SERVICE_ROLE_KEY の形式を確認できませんでした。")
        return
    if role != "service_role":
        print(
            f"警告: SUPABASE_SERVICE_ROLE_KEY の role は '{role}' です（service_role である必要があります）。\n"
            "  anon キーを入れていると、RLS により SELECT が 0 件になることがあります。\n"
            "  Supabase → Project Settings → API → service_role（secret）を .env.local に設定してください。"
        )
    else:
        print("API key role: service_role（RLS バイパス）")


def print_filter_mismatch_hint(
    client: Any,
    table_name: str,
    event_id_filter: str | None,
    environment_filter: str | None,
) -> None:
    """フィルタ付きで 0 件のとき、テーブル内の event_id / environment の分布を表示。"""
    try:
        probe = client.table(table_name).select("event_id, environment").execute()
    except Exception as exc:
        print(f"診断用の全件取得に失敗しました: {exc}")
        return

    rows = probe.data or []
    total = len(rows)
    print(f"診断: フィルタなしの取得件数 = {total}")

    if total == 0:
        print(
            "  → テーブルが空か、別プロジェクトの URL/キーか、anon キーで RLS にブロックされています。"
        )
        return

    by_event = Counter(r.get("event_id") for r in rows)
    by_env = Counter(r.get("environment") for r in rows)
    print(f"  event_id の内訳: {dict(by_event)}")
    print(f"  environment の内訳: {dict(by_env)}")

    hints: list[str] = []
    if event_id_filter and event_id_filter not in by_event:
        hints.append(
            f"-e {event_id_filter} は DB に存在しません。上記の event_id のいずれかを指定してください。"
        )
    if environment_filter and environment_filter not in by_env:
        hints.append(
            f"-E {environment_filter} は DB に存在しません。"
            f" Edge の SUBMIT_ENVIRONMENT が test なら -E test を試してください。"
        )
    for line in hints:
        print(f"  → {line}")
