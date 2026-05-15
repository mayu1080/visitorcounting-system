"""集計スクリプト共通: コマンドライン引数で event_id / environment を指定（.env.local より優先）。"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv

ENV_FILE = Path(".env.local")


def init_aggregate_env() -> tuple[str | None, str | None]:
    """`.env.local` を読み込み、`-e` / `-E` があれば環境変数を上書きして返す。"""
    if ENV_FILE.exists():
        load_dotenv(ENV_FILE)

    parser = argparse.ArgumentParser(
        description="集計対象の絞り込み（update_reports / fetch_responses / analyze_responses 共通）",
        add_help=False,
    )
    parser.add_argument(
        "-e",
        "--event-id",
        dest="event_id",
        metavar="ID",
        help="集計対象の event_id",
    )
    parser.add_argument(
        "-E",
        "--environment",
        dest="environment",
        metavar="ENV",
        help="集計対象の environment",
    )
    parser.add_argument("-h", "--help", action="help", help="このヘルプを表示")
    args, _unknown = parser.parse_known_args()

    if args.event_id:
        os.environ["AGGREGATE_EVENT_ID"] = args.event_id.strip()
    if args.environment:
        os.environ["AGGREGATE_ENVIRONMENT"] = args.environment.strip()

    event_id = os.environ.get("AGGREGATE_EVENT_ID") or None
    environment = os.environ.get("AGGREGATE_ENVIRONMENT") or None
    return event_id, environment
