from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_patterns_includes_sliding_window():
    res = client.get("/api/v1/patterns")
    assert res.status_code == 200
    ids = {p["id"] for p in res.json()}
    assert "sliding_window" in ids


def test_pattern_detail_has_lesson_and_related():
    res = client.get("/api/v1/patterns/sliding_window")
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Sliding Window"
    assert len(body["lesson"]) >= 8
    assert body["lesson"][0]["note"]
    related_ids = {p["id"] for p in body["relatedProblems"]}
    assert "longest-unique-substring" in related_ids
    assert "max-sum-subarray-k" in related_ids


def test_problems_filter_by_pattern():
    res = client.get("/api/v1/problems", params={"pattern": "sliding_window"})
    assert res.status_code == 200
    ids = {p["id"] for p in res.json()}
    assert ids == {"longest-unique-substring", "max-sum-subarray-k"}


def test_sliding_window_problem_traces():
    pack = client.get("/api/v1/problems/longest-unique-substring").json()
    res = client.post(
        "/api/v1/trace",
        json={
            "code": pack["starterCode"],
            "input": {"s": "abcab"},
            "problemId": "longest-unique-substring",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert body["result"] == 3
    assert len(body["steps"]) > 0
