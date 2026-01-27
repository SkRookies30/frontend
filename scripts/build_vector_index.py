import json
import os
from pathlib import Path

import numpy as np
import faiss
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"

KB_JSON = DATA_DIR / "security_data.json"
INDEX_PATH = DATA_DIR / "vector_index.faiss"
META_PATH = DATA_DIR / "vector_meta.json"

EMBED_MODEL = "text-embedding-3-small"


def build_text(row: dict) -> str:
    parts = [
        f"attack_name: {row.get('attack_name','')}",
        f"stage: {row.get('stage','')}",
        f"severity_min: {row.get('severity_min','')}",
        f"action: {row.get('action_text','')}",
        f"source: {row.get('source_doc','')}",
        f"section: {row.get('source_section','')}",
        f"notes: {row.get('notes','')}",
    ]
    return "\n".join([p for p in parts if p.strip()])


def embed_texts(texts: list[str]) -> np.ndarray:
    resp = client.embeddings.create(
        model=EMBED_MODEL,
        input=texts
    )
    vecs = np.array([d.embedding for d in resp.data], dtype="float32")
    faiss.normalize_L2(vecs)  # cosine similarity용
    return vecs


def main():
    if not KB_JSON.exists():
        raise FileNotFoundError(f"JSON 파일 없음: {KB_JSON}")

    rows = json.loads(KB_JSON.read_text(encoding="utf-8"))
    texts = [build_text(r) for r in rows]

    vectors = embed_texts(texts)
    dim = vectors.shape[1]

    index = faiss.IndexFlatIP(dim)
    index.add(vectors)

    faiss.write_index(index, str(INDEX_PATH))

    meta = []
    for r, t in zip(rows, texts):
        meta.append({
            **r,
            "_search_text": t
        })

    META_PATH.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("✅ 벡터 인덱스 생성 완료")
    print(f"- rows: {len(rows)}")
    print(f"- index: {INDEX_PATH}")
    print(f"- meta : {META_PATH}")


if __name__ == "__main__":
    main()
