"""回答データ取得から集計グラフ生成までをまとめて実行するスクリプト。

例:
  .\\.venv\\Scripts\\python.exe scripts\\update_reports.py -e ibaraki-vanilladome -E production
  .\\.venv\\Scripts\\python.exe scripts\\update_reports.py --event-id natori-park --environment production
"""

from __future__ import annotations

from aggregate_cli import init_aggregate_env
from analyze_responses import main as analyze_responses
from fetch_responses import main as fetch_responses


def main() -> None:
    init_aggregate_env()
    fetch_responses()
    analyze_responses()


if __name__ == "__main__":
    main()
