"""回答データ取得から集計グラフ生成までをまとめて実行するスクリプト。"""

from __future__ import annotations

from analyze_responses import main as analyze_responses
from fetch_responses import main as fetch_responses


def main() -> None:
    fetch_responses()
    analyze_responses()


if __name__ == "__main__":
    main()
