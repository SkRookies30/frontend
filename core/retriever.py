import json
import os
from pathlib import Path

import numpy as np
import faiss
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBED_MODEL = "text-embedding-3-small"

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"

INDEX_PATH = DATA_DIR / "vector_index.faiss"
META_PATH = DATA_DIR / "vector_meta.json"


class Retriever:
    def __init__(self):
        if not INDEX_PATH.exists() or not META_PATH.exists():
            raise FileNotFoundError(
                "벡터 인덱스가 없습니다. build_vector_index.py 먼저 실행하세요."
            )

        self.index = faiss.read_index(str(INDEX_PATH))
        self.meta = json.loads(META_PATH.read_text(encoding="utf-8"))

    def _embed_query(self, query: str) -> np.ndarray:
        resp = client.embeddings.create(
            model=EMBED_MODEL,
            input=[query]
        )
        vec = np.array([resp.data[0].embedding], dtype="float32")
        faiss.normalize_L2(vec)
        return vec

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        qv = self._embed_query(query)
        scores, idxs = self.index.search(qv, top_k)

        results = []
        for score, idx in zip(scores[0], idxs[0]):
            if idx == -1:
                continue
            item = dict(self.meta[idx])
            item["score"] = float(score)
            results.append(item)

        return results
STAGE_PRIORITY = {
    "IMMEDIATE": 0,
    "INVESTIGATION": 1,
    "POST": 2,
    "RECOVERY": 2,
    "PREVENTION": 3,
}

def search(self, query: str, top_k: int = 5) -> list[dict]:
    qv = self._embed_query(query)
    scores, idxs = self.index.search(qv, top_k * 3)  # 후보를 좀 더 뽑고

    results = []
    for score, idx in zip(scores[0], idxs[0]):
        if idx == -1:
            continue
        item = dict(self.meta[idx])
        item["score"] = float(score)
        results.append(item)

    # ✅ stage 우선 + 점수 보조 정렬
    results.sort(
        key=lambda x: (
            STAGE_PRIORITY.get(str(x.get("stage", "")).upper(), 99),
            -x["score"],
        )
    )

    return results[:top_k]
