from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from dotenv import load_dotenv

from core.retriever import Retriever
from agents.guidance_agent import ResponseGuidanceAgent

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]

# ✅ 서버 시작 시 1회 로드 (매 요청마다 만들면 느려짐)
retriever = Retriever()
guidance = ResponseGuidanceAgent(model="gpt-5", max_output_tokens=400)

@app.post("/api/chat")
def chat(req: ChatRequest):
    # 1) 마지막 user 메시지 추출
    user_text = ""
    for m in reversed(req.messages):
        if m.get("role") == "user" and m.get("text"):
            user_text = m["text"].strip()
            break

    if not user_text:
        return {"reply": "질문을 입력해줘."}

    # 2) (지금은 더미) detection/classification 결과 자리
    detection = None
    classification = None
    # 팀원 코드 나오면 여기에 연결:
    # detection = det_agent.predict(...)
    # classification = cls_agent.predict(...)

    # 3) RAG 검색
    hits = retriever.search(user_text, top_k=3)

    # 4) LLM 답변 생성 (RAG 근거 주입)
    reply = guidance.generate_with_evidence(
        user_text=user_text,
        evidences=hits,
        top_k=3,
        detection=detection,
        classification=classification,
    )

    return {"reply": reply}
