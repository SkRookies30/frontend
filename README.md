ModuleProject/
├─ agents/
│  ├─ __init__.py
│  └─ guidance_agent.py        # LLM 기반 대응 가이드 생성
│
├─ core/
│  ├─ __init__.py
│  └─ retriever.py             # 벡터 검색(RAG)
│
├─ scripts/
│  ├─ __init__.py   (선택)
│  └─ build_vector_index.py    # 지식베이스 벡터 인덱스 생성(최초 1회)
│
├─ data/
│  └─ security_data.json       # 보안 지식베이스
│
├─ requirements.txt            # 의존성 목록
└─ main.py 또는 main1.py        # 실행 파일
실행 순서
pip install -r requirements.txt
python scripts/build_vector_index.py   # 최초 1회
python main.py                         # 또는 python -m main