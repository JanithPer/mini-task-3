from backend.benchmark.metrics import mrr, recall_at_k
from backend.cost import cost_context_gen, cost_embedding, cost_query_rewrite, cost_rerank


def test_recall_at_k_empty_gold() -> None:
    assert recall_at_k(["a", "b", "c"], set(), 5) == 0.0


def test_recall_at_k_all_found() -> None:
    assert recall_at_k(["a", "b", "c"], {"a", "b", "c"}, 5) == 1.0


def test_recall_at_k_partial() -> None:
    assert recall_at_k(["a", "b", "x", "y"], {"a", "c"}, 5) == 0.5


def test_recall_at_k_truncated() -> None:
    assert recall_at_k(["a", "b", "c", "d", "e"], {"d", "e", "f"}, 3) == 0.0


def test_recall_at_k_all_gold_in_top() -> None:
    assert recall_at_k(["a", "b", "c", "d", "e"], {"a", "e"}, 5) == 1.0


def test_mrr_empty_gold() -> None:
    assert mrr(["a", "b", "c"], set()) == 0.0


def test_mrr_first_rank() -> None:
    assert mrr(["a", "b", "c"], {"a"}) == 1.0


def test_mrr_third_rank() -> None:
    assert mrr(["x", "y", "a", "b"], {"a"}) == 1.0 / 3


def test_mrr_not_found() -> None:
    assert mrr(["a", "b", "c"], {"x"}) == 0.0


def test_mrr_multiple_gold_first_is_used() -> None:
    assert mrr(["x", "a", "b"], {"b", "a"}) == 1.0 / 2


def test_cost_embedding_free() -> None:
    assert cost_embedding(1_000_000) == 0.0
    assert cost_embedding(0) == 0.0


def test_cost_rerank_free() -> None:
    assert cost_rerank(1000) == 0.0
    assert cost_rerank(0) == 0.0


def test_cost_context_gen() -> None:
    assert cost_context_gen(1_000_000, 0) == 0.15
    assert cost_context_gen(0, 500_000) == 0.30
    assert round(cost_context_gen(1_000_000, 500_000), 10) == 0.45


def test_cost_query_rewrite() -> None:
    assert cost_query_rewrite(1_000_000, 0) == 0.15
    assert cost_query_rewrite(0, 1_000_000) == 0.60
    assert round(cost_query_rewrite(2_000_000, 500_000), 10) == 0.60
