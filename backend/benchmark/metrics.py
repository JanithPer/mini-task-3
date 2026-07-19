def recall_at_k(retrieved_ids: list[str], gold: set[str], k: int) -> float:
    if not gold:
        return 0.0
    top_k = set(retrieved_ids[:k])
    return len(top_k & gold) / len(gold)


def mrr(retrieved_ids: list[str], gold: set[str]) -> float:
    if not gold:
        return 0.0
    for i, rid in enumerate(retrieved_ids, start=1):
        if rid in gold:
            return 1.0 / i
    return 0.0
