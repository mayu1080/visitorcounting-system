"""survey_responses.csv の簡易集計と棒グラフ生成スクリプト。

前提:
- 入力: data/survey_responses.csv
- Supabase API から取得したCSV、または Supabase Table Editor からExportしたCSVを使う
- AGGREGATE_EVENT_ID / AGGREGATE_ENVIRONMENT が設定されていれば絞り込む
- answers カラム内の questionId ごとに集計する
- 全質問の横棒グラフを1枚にまとめて outputs/{event_id}/chart.png に出力する
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import pandas as pd
from dotenv import load_dotenv
from matplotlib import font_manager


ENV_FILE = Path(".env.local")
INPUT_CSV = Path("data/survey_responses.csv")
OUTPUT_DIR = Path("outputs")

QUESTION_TITLES = {
    "q1": "今日は何名様でのご来場ですか？",
    "q2": "お子様の年齢について、当てはまる年代は？",
    "q3": "本日はどこからお越しいただきましたか？",
    "q4": "何回目のご利用ですか？",
}

QUESTION_SHORT_TITLES = {
    "q1": "Q1. ご来場人数",
    "q2": "Q2. お子様の年齢",
    "q3": "Q3. ご来訪エリア",
    "q4": "Q4. ご利用回数",
}

QUESTION_OPTIONS_ORDER = {
    "q1": ["1人", "2人", "3人", "4名以上"],
    "q2": ["0~1歳", "2~3歳", "4~6歳", "7歳以上"],
    "q3": ["名取市内", "仙台市内", "それ以外の地域"],
    "q4": ["初めて", "2回目", "3回目", "4回以上"],
}


def main() -> None:
    load_dotenv(ENV_FILE)
    event_id_filter = os.environ.get("AGGREGATE_EVENT_ID")
    environment_filter = os.environ.get("AGGREGATE_ENVIRONMENT")

    if not INPUT_CSV.exists():
        raise SystemExit(f"入力CSVが見つかりません: {INPUT_CSV}")

    df = pd.read_csv(INPUT_CSV)
    if "answers" not in df.columns:
        raise SystemExit("'answers' カラムがCSVに存在しません")

    df = apply_filters(df, event_id_filter, environment_filter)

    rows = []
    for _, response in df.dropna(subset=["answers"]).iterrows():
        answers_json = response["answers"]
        answers = json.loads(answers_json)
        for question_id, answer in answers.items():
            rows.append(
                {
                    "event_id": response.get("event_id", ""),
                    "environment": response.get("environment", ""),
                    "survey_version": response.get("survey_version", ""),
                    "question_id": question_id,
                    "answer": answer,
                }
            )

    if not rows:
        raise SystemExit("集計できる回答が1件も見つかりません")

    answers_df = pd.DataFrame(rows)
    counts = (
        answers_df.groupby(
            ["event_id", "environment", "survey_version", "question_id", "answer"],
            dropna=False,
        )
        .size()
        .reset_index(name="count")
    )

    def option_index(row: pd.Series) -> int:
        order = QUESTION_OPTIONS_ORDER.get(row["question_id"], [])
        try:
            return order.index(row["answer"])
        except ValueError:
            return len(order)

    counts["_order"] = counts.apply(option_index, axis=1)
    counts = (
        counts.sort_values(["question_id", "_order"])
        .drop(columns="_order")
        .reset_index(drop=True)
    )
    counts.insert(
        1,
        "question",
        counts["question_id"].map(QUESTION_TITLES).fillna(counts["question_id"]),
    )

    output_dir = get_output_dir(event_id_filter)
    summary_csv = output_dir / "summary.csv"
    chart_png = output_dir / "chart.png"
    output_dir.mkdir(parents=True, exist_ok=True)
    counts.to_csv(summary_csv, index=False, encoding="utf-8-sig")
    print(f"summary saved: {summary_csv}")

    set_japanese_font()
    matplotlib.rcParams["axes.unicode_minus"] = False

    question_ids = counts["question_id"].drop_duplicates().tolist()
    heights = [
        max(2.0, 0.6 * len(QUESTION_OPTIONS_ORDER.get(question_id, [])) + 1.4)
        for question_id in question_ids
    ]
    fig, axes = plt.subplots(
        len(question_ids),
        1,
        figsize=(10, sum(heights)),
        gridspec_kw={"height_ratios": heights},
    )
    if len(question_ids) == 1:
        axes = [axes]

    for ax, question_id in zip(axes, question_ids):
        group = counts[counts["question_id"] == question_id]
        short_title = QUESTION_SHORT_TITLES.get(question_id, question_id)
        answers_list = group["answer"].tolist()
        count_list = group["count"].tolist()

        y_positions = list(range(len(answers_list)))
        bars = ax.barh(y_positions, count_list)
        ax.set_yticks(y_positions)
        ax.set_yticklabels(answers_list)
        ax.invert_yaxis()
        ax.set_title(short_title, fontsize=14, pad=10)
        ax.set_xlabel("件数")
        ax.grid(axis="x", linestyle="--", alpha=0.3)
        ax.set_axisbelow(True)
        for spine in ("top", "right"):
            ax.spines[spine].set_visible(False)

        max_count = max(count_list) if count_list else 0
        ax.set_xlim(0, max_count * 1.15 if max_count > 0 else 1)
        for bar, count in zip(bars, count_list):
            ax.text(
                bar.get_width() + max_count * 0.02,
                bar.get_y() + bar.get_height() / 2,
                str(count),
                va="center",
                fontsize=11,
            )

    plt.tight_layout()
    plt.savefig(chart_png, dpi=150)
    plt.close(fig)
    print(f"chart saved: {chart_png}")


def apply_filters(
    df: pd.DataFrame,
    event_id_filter: str | None,
    environment_filter: str | None,
) -> pd.DataFrame:
    filtered = df
    if event_id_filter:
        require_column(filtered, "event_id", "AGGREGATE_EVENT_ID")
        filtered = filtered[filtered["event_id"] == event_id_filter]
        print(f"event_id filter: {event_id_filter} ({len(filtered)} rows)")

    if environment_filter:
        require_column(filtered, "environment", "AGGREGATE_ENVIRONMENT")
        filtered = filtered[filtered["environment"] == environment_filter]
        print(f"environment filter: {environment_filter} ({len(filtered)} rows)")

    return filtered


def require_column(df: pd.DataFrame, column: str, env_name: str) -> None:
    if column not in df.columns:
        raise SystemExit(
            f"{env_name} が設定されていますが、CSVに '{column}' カラムが存在しません。"
            "Supabase のカラム追加後に fetch_responses.py を再実行してください。"
        )


def get_output_dir(event_id_filter: str | None) -> Path:
    if not event_id_filter:
        return OUTPUT_DIR
    return OUTPUT_DIR / event_id_filter


def set_japanese_font() -> None:
    candidates = [
        "Yu Gothic",
        "Meiryo",
        "MS Gothic",
        "Hiragino Sans",
        "Hiragino Maru Gothic Pro",
        "Arial Unicode MS",
    ]
    installed_fonts = {font.name for font in font_manager.fontManager.ttflist}
    for candidate in candidates:
        if candidate in installed_fonts:
            matplotlib.rcParams["font.family"] = candidate
            return
    matplotlib.rcParams["font.family"] = "sans-serif"


if __name__ == "__main__":
    main()
