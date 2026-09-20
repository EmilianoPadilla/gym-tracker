from typing import List
import models


def calculate_streak(logs: List[models.Log]) -> int:
    """
    Given an exercise's logs (any order), return how many consecutive most-recent
    sessions were logged at the same weight as the latest one.

    Example: weights logged over time (oldest->newest) = [90, 95, 100, 100, 100]
    -> streak = 3 (last three sessions all at 100kg)
    """
    if not logs:
        return 0

    sorted_logs = sorted(logs, key=lambda l: l.date, reverse=True)
    latest_weight = sorted_logs[0].weight

    streak = 0
    for log in sorted_logs:
        if log.weight == latest_weight:
            streak += 1
        else:
            break
    return streak


def streak_color(streak: int) -> str:
    """1 session -> green (fresh), 2 -> orange (watch it), 3+ -> red (time to increase)."""
    if streak <= 1:
        return "green"
    elif streak == 2:
        return "orange"
    else:
        return "red"
